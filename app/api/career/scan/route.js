import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

function scoreJob(job) {
  let score = 0;
  const reqText = (job.requirements || []).join(' ').toLowerCase();
  const titleText = (job.title || '').toLowerCase();
  const descText = (job.description || '').toLowerCase();
  const allText = `${reqText} ${titleText} ${descText}`;

  if (/ai|machine learning|martech|data.driven|automation|technology|digital transformation/.test(allText)) score++;
  if (/team|lead|manage|people|direct report|head count|leadership/.test(allText)) score++;
  if (/enterprise|consumer|fmcg|retail|media|brand(?!.*saas)|b2c|ecommerce/.test(allText)) score++;
  if ((job.requirements || []).length >= 3) score++;
  const loc = (job.location || '').toLowerCase();
  if (/germany|dach|berlin|munich|hamburg|d[uü]sseldorf|remote|austria|switzerland|k[oö]ln|frankfurt|stuttgart|wien|z[uü]rich/.test(loc)) score++;
  return score;
}

// Expand user query into DACH-market Google Jobs searches
function expandQuery(query) {
  const q = query.toLowerCase().replace(/"/g, '').trim();

  // Split OR-style queries
  const parts = q.split(/\bor\b|,/).map(s => s.trim()).filter(Boolean);

  // Map common executive titles to Google Jobs-friendly equivalents
  const expansions = [];
  for (const part of parts) {
    // Remove "germany/dach/remote" from query — we use location param instead
    const cleaned = part.replace(/\b(germany|dach|remote|deutschland|berlin|munich|hamburg)\b/gi, '').trim();
    if (!cleaned) continue;

    expansions.push(cleaned);

    // Add German-market equivalents for common titles
    if (/vp.?marketing|vice president.?marketing/i.test(cleaned)) {
      expansions.push('Marketing Director');
      expansions.push('Leiter Marketing');
    } else if (/head of marketing/i.test(cleaned)) {
      expansions.push('Marketing Director');
      expansions.push('Leiter Marketing');
    } else if (/\bcmo\b/i.test(cleaned)) {
      expansions.push('Chief Marketing Officer');
      expansions.push('Marketing Director');
    } else if (/head of digital/i.test(cleaned)) {
      expansions.push('Digital Marketing Director');
    }
  }

  // Deduplicate
  return [...new Set(expansions)];
}

// Single SerpAPI Google Jobs request
async function serpAPISearch(query, apiKey) {
  const params = new URLSearchParams({
    engine: 'google_jobs',
    q: query,
    location: 'Germany',
    gl: 'de',
    hl: 'en',
    api_key: apiKey,
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  const data = await response.json();

  // SerpAPI returns auth/quota errors with 200 status
  if (data.error) {
    // "Google hasn't returned any results" = no matches, not a real error
    if (data.error.includes("hasn't returned any results")) {
      return [];
    }
    throw new Error(`SerpAPI: ${data.error}`);
  }

  if (!response.ok) {
    throw new Error(`SerpAPI HTTP ${response.status}`);
  }

  return (data.jobs_results || []).map(job => {
    const qualifications = job.job_highlights?.find(h => h.title === 'Qualifications');
    const responsibilities = job.job_highlights?.find(h => h.title === 'Responsibilities');
    const requirements = (qualifications?.items || responsibilities?.items || []).slice(0, 5);
    const applyUrl = job.apply_options?.[0]?.link || '';

    return {
      title: job.title || '',
      company: job.company_name || '',
      location: job.location || '',
      url: applyUrl,
      requirements,
      description: (job.description || '').substring(0, 300),
      source: job.via || 'Google Jobs',
      postedAt: job.detected_extensions?.posted_at || '',
      schedule: job.detected_extensions?.schedule_type || '',
    };
  });
}

// SerpAPI Google Jobs search — expands and runs parallel searches
async function searchWithSerpAPI(query) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  const subQueries = expandQuery(query);

  // Run all sub-queries in parallel
  const allResults = await Promise.all(
    subQueries.map(q => serpAPISearch(q, apiKey))
  );

  // Flatten and deduplicate by title+company
  const seen = new Set();
  const deduped = [];
  for (const results of allResults) {
    for (const job of results) {
      const key = `${job.title}||${job.company}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(job);
      }
    }
  }

  return deduped;
}

// Claude web search fallback
async function searchWithClaude(query) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const searchResponse = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Search for current open job listings matching: ${query}. Find real, currently open positions. For each role, identify the job title, company, location, URL, and top 3-5 requirements from the job description.`,
    }],
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
  });

  const searchText = searchResponse.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  const parseResponse = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Extract job listings from this search result. Return ONLY a valid JSON array. Each object must have: title (string), company (string), location (string), url (string or ""), requirements (array of 3-5 strings). If you find fewer than 3 listings, still return what you find. Return valid JSON only, no markdown.\n\n${searchText}`,
    }],
  });

  const parseText = parseResponse.content
    .find(b => b.type === 'text')?.text || '[]';

  const match = parseText.match(/\[[\s\S]*\]/);
  let jobs = [];
  try {
    jobs = match ? JSON.parse(match[0]) : [];
  } catch {
    console.error('JSON parse failed:', parseText);
    jobs = [];
  }

  return jobs.map(job => ({
    ...job,
    description: '',
    source: 'AI Web Search',
    postedAt: '',
    schedule: '',
  }));
}

export async function POST(request) {
  try {
    const { query, engine } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    let jobs = [];
    let usedEngine = 'claude';

    // Use requested engine, or SerpAPI by default if key exists
    if (engine === 'claude') {
      jobs = await searchWithClaude(query);
      usedEngine = 'claude';
    } else {
      // Try SerpAPI first
      const serpResults = await searchWithSerpAPI(query);
      if (serpResults !== null) {
        jobs = serpResults;
        usedEngine = 'google_jobs';
      } else {
        // Fallback to Claude
        jobs = await searchWithClaude(query);
        usedEngine = 'claude';
      }
    }

    // Auto-score each role
    const scored = jobs.map(job => ({
      ...job,
      fitScore: scoreJob(job),
    }));

    return NextResponse.json({ jobs: scored, engine: usedEngine });
  } catch (error) {
    console.error('Career scan failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
