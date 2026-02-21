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

// Split complex queries into simpler Google Jobs-friendly searches
function splitQuery(query) {
  // Remove boolean operators and quoted phrases, split into individual search terms
  const cleaned = query
    .replace(/\bOR\b/gi, ',')
    .replace(/"/g, '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // If the query was already simple (no OR/commas), use as-is
  if (cleaned.length <= 1) return [query.replace(/"/g, '')];
  return cleaned;
}

// Single SerpAPI Google Jobs request
async function serpAPISearch(query, apiKey) {
  const params = new URLSearchParams({
    engine: 'google_jobs',
    q: query,
    gl: 'de',
    hl: 'en',
    api_key: apiKey,
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  if (!response.ok) {
    console.error('SerpAPI error:', response.status, await response.text());
    return [];
  }

  const data = await response.json();
  if (data.error) {
    console.error('SerpAPI error body:', data.error);
    return [];
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

// SerpAPI Google Jobs search — splits complex queries into parallel searches
async function searchWithSerpAPI(query) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return null;

  const subQueries = splitQuery(query);
  console.log('SerpAPI sub-queries:', subQueries);

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

  console.log('SerpAPI total results:', deduped.length);
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
