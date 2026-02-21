import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Step 1: Web search for current roles
    const searchResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Search for current open job listings matching: ${query}. Find real, currently open positions. For each role, identify the job title, company, location, URL, and top 3-5 requirements from the job description.`,
        }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Search API error:', errorText);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const searchData = await searchResponse.json();
    const searchText = searchData.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    // Step 2: Parse into structured JSON
    const parseResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Extract job listings from this search result. Return ONLY a valid JSON array. Each object must have: title (string), company (string), location (string), url (string or ""), requirements (array of 3-5 strings). If you find fewer than 3 listings, still return what you find. Return valid JSON only, no markdown.\n\n${searchText}`,
        }],
      }),
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error('Parse API error:', errorText);
      return NextResponse.json({ error: 'Failed to parse results' }, { status: 500 });
    }

    const parseData = await parseResponse.json();
    const parseText = parseData.content
      .find(b => b.type === 'text')?.text || '[]';

    const match = parseText.match(/\[[\s\S]*\]/);
    let jobs = [];
    try {
      jobs = match ? JSON.parse(match[0]) : [];
    } catch {
      console.error('JSON parse failed:', parseText);
      jobs = [];
    }

    // Step 3: Auto-score each role
    const scored = jobs.map(job => {
      let score = 0;
      const reqText = (job.requirements || []).join(' ').toLowerCase();
      if (/ai|machine learning|martech|data.driven|automation|technology/.test(reqText)) score++;
      if (/team|lead|manage|people|direct report|head count/.test(reqText)) score++;
      if (/enterprise|consumer|fmcg|retail|media|brand(?!.*saas)/.test(reqText)) score++;
      if ((job.requirements || []).length >= 3) score++;
      const loc = (job.location || '').toLowerCase();
      if (/germany|dach|berlin|munich|hamburg|d[uü]sseldorf|remote|austria|switzerland|k[oö]ln|frankfurt|stuttgart/.test(loc)) score++;
      return { ...job, fitScore: score };
    });

    return NextResponse.json({ jobs: scored });
  } catch (error) {
    console.error('Career scan failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
