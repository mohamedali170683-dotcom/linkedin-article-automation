import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 120;

const APIFY_ACTOR = 'curious_coder~linkedin-post-search-scraper';
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

async function scrapeLinkedIn(topics, apiKey) {
  // Start actor run
  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_ACTOR}/runs?token=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: topics,
        maxResults: 5,
        datePosted: 'past-week',
      }),
    }
  );

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Apify start failed: ${startRes.status} ${err}`);
  }

  const runData = await startRes.json();
  const runId = runData.data?.id;
  if (!runId) throw new Error('No run ID returned from Apify');

  // Poll for completion
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL);

    const pollRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`
    );
    const pollData = await pollRes.json();
    const status = pollData.data?.status;

    if (status === 'SUCCEEDED') {
      const datasetId = pollData.data?.defaultDatasetId;
      if (!datasetId) throw new Error('No dataset ID');

      const itemsRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}&limit=40`
      );
      return await itemsRes.json();
    }

    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      return null;
    }
  }

  return null;
}

function deduplicatePosts(posts) {
  const seen = new Set();
  return posts.filter(p => {
    const url = p.url || p.postUrl || '';
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

async function scorePost(client, post) {
  const authorName = post.authorName || post.author || 'Unknown';
  const postUrl = post.url || post.postUrl || '';
  const postText = (post.text || post.postText || '').substring(0, 1500);

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
      preview: (post.text || post.postText || '').substring(0, 200),
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

    const apiKey = process.env.APIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'APIFY_API_KEY not configured' }, { status: 500 });
    }

    // 1. Apify scrape
    const rawPosts = await scrapeLinkedIn(topics, apiKey);
    if (!rawPosts) {
      return NextResponse.json({ error: 'scrape_failed' });
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
