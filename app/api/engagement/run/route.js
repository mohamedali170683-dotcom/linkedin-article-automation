import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 120;

// Pay-per-result actor ($0.005/post) — no rental subscription needed
const APIFY_ACTOR = 'apimaestro~linkedin-posts-search-scraper-no-cookies';
const POLL_INTERVAL = 4000;
const MAX_POLL_ATTEMPTS = 30;

const SCORING_SYSTEM_PROMPT = `You analyze LinkedIn posts for Moha, a Search Marketing Director at WPP Media Germany and founder of Velaris (an AI Visibility Platform).

Score each post 1-10 for relevance to his core writing themes:
- AI search visibility and Generative Engine Optimization (GEO)
- Search marketing strategy (SEO, SEA, cross-channel)
- Marketing leadership and VP/CMO career development

For posts scoring 6 or above, generate 3 comment options in his voice:
- "insight": adds a specific data point, trend, or research finding
- "pov": shares a practitioner perspective from agency or platform work
- "question": respectfully challenges an assumption or asks something that deepens the conversation

His comment style rules:
- Senior practitioner tone — always adds genuine value, never sycophantic
- 2-3 sentences maximum
- No emojis
- Ends with either a strong statement or a pointed question that invites dialogue
- No self-promotion

Return ONLY valid JSON with no markdown, no preamble:
{
  "score": <integer 1-10>,
  "reason": "<one sentence explaining relevance>",
  "comments": {
    "insight": "<comment text>",
    "pov": "<comment text>",
    "question": "<comment text>"
  }
}

If score is below 6, still return valid JSON but comments can be empty strings.`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function blobPrefix(week) {
  return `engagement-${week}`;
}

async function saveEngagementData(week, data) {
  const prefix = blobPrefix(week);
  try {
    const { blobs } = await list({ prefix });
    for (const blob of blobs) await del(blob.url);
  } catch {}
  await put(`${prefix}.json`, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
  });
}

async function runActorForKeyword(keyword, apiKey) {
  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_ACTOR}/runs?token=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword,
        sortBy: 'date_posted',
        maxPosts: 10,
      }),
    }
  );

  if (!startRes.ok) {
    const err = await startRes.text();
    console.error(`Apify start failed for "${keyword}": ${startRes.status} ${err}`);
    return [];
  }

  const runData = await startRes.json();
  const runId = runData.data?.id;
  if (!runId) return [];

  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL);
    const pollRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`
    );
    const pollData = await pollRes.json();
    const status = pollData.data?.status;

    if (status === 'SUCCEEDED') {
      const datasetId = pollData.data?.defaultDatasetId;
      if (!datasetId) return [];
      const itemsRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}&limit=15`
      );
      return await itemsRes.json();
    }
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) return [];
  }
  return [];
}

async function scrapeLinkedIn(topics, apiKey) {
  // Run actor once per topic keyword, merge results
  const results = await Promise.all(
    topics.map(topic => runActorForKeyword(topic, apiKey))
  );
  return results.flat();
}

function normalizePost(raw) {
  return {
    url: raw.url || raw.postUrl || raw.link || raw.postLink || '',
    text: raw.text || raw.postText || raw.content || raw.postContent || '',
    authorName: raw.authorName || raw.author || raw.authorFullName || raw.fullName || 'Unknown',
  };
}

function deduplicatePosts(posts) {
  const seen = new Set();
  return posts
    .map(normalizePost)
    .filter(p => {
      const key = p.url || p.text.substring(0, 80);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function scorePost(client, post) {
  // post is already normalized via normalizePost()
  const { authorName, url: postUrl, text: fullText } = post;
  const postText = fullText.substring(0, 1500);

  if (!postText.trim()) return null;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: SCORING_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `AUTHOR: ${authorName}\nPOST URL: ${postUrl}\nPOST TEXT: ${postText}`,
      }],
    });

    const text = response.content.find(b => b.type === 'text')?.text || '';
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const scored = JSON.parse(jsonMatch[0]);

    return {
      author: authorName,
      url: postUrl,
      preview: fullText.substring(0, 200),
      score: scored.score,
      reason: scored.reason || '',
      comments: scored.comments || { insight: '', pov: '', question: '' },
      status: 'Pending',
    };
  } catch (e) {
    console.error(`Scoring failed for ${postUrl}:`, e.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const { topics, week } = await request.json();

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ error: 'topics array is required' }, { status: 400 });
    }
    if (!week) {
      return NextResponse.json({ error: 'week is required (e.g. 2026-W10)' }, { status: 400 });
    }

    const apiKey = process.env.APIFY_API_TOKEN || process.env.APIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'APIFY_API_TOKEN not configured' }, { status: 500 });
    }

    // 1. Apify scrape (runs one search per topic, merges results)
    const rawPosts = await scrapeLinkedIn(topics, apiKey);
    if (!rawPosts || rawPosts.length === 0) {
      return NextResponse.json({ error: 'scrape_failed', detail: 'No posts found — check Apify dashboard for run logs' });
    }

    const posts = deduplicatePosts(rawPosts);

    // 2. Claude scoring
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const scoredResults = await Promise.all(
      posts.map(post => scorePost(client, post))
    );

    // 3. Filter and sort
    const filtered = scoredResults
      .filter(p => p && p.score >= 6)
      .sort((a, b) => b.score - a.score);

    // 4. Save to Vercel Blob
    const result = { posts: filtered, week, count: filtered.length };
    await saveEngagementData(week, result);

    // 5. Return
    return NextResponse.json(result);
  } catch (error) {
    console.error('Engagement run failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
