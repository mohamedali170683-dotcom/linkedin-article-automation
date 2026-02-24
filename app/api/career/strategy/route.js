import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { KNOWLEDGE_DOMAINS, CURATED_INSIGHTS } from '../../../lib/knowledge-base';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const { targetRoles } = await request.json();

    if (!targetRoles || targetRoles.length === 0) {
      return NextResponse.json({ error: 'At least one target role is required' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Build compact domain list
    const domainsContext = KNOWLEDGE_DOMAINS.map(d =>
      `- ${d.id}: ${d.label} — ${d.description}`
    ).join('\n');

    // Build compact insight catalog (ID + framework + one hook only, to fit token budget)
    const insightCatalog = KNOWLEDGE_DOMAINS.map(d => {
      const domainInsights = CURATED_INSIGHTS.filter(i => i.domain === d.id);
      const entries = domainInsights.map(i =>
        `  ${i.id}: "${i.framework}" (${i.source.author}) — hook: "${i.contentHooks[0]}"`
      ).join('\n');
      return `[${d.label}]\n${entries}`;
    }).join('\n\n');

    // Build role context for secondary alignment
    const rolesContext = targetRoles.map(r =>
      `- ${r.title} at ${r.company}: ${(r.requirements || []).slice(0, 3).join('; ')}`
    ).join('\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are a thought leadership content strategist. Create a 12-week content calendar that positions the author as an authority in marketing science, behavioral economics, and business strategy.

KNOWLEDGE DOMAINS:
${domainsContext}

AVAILABLE INSIGHTS (use these IDs in your plan):
${insightCatalog}

TARGET ROLES (for subtle secondary alignment — content should naturally demonstrate these capabilities without mentioning the companies):
${rolesContext}

TASK: Generate a 12-week content strategy using the insight catalog above.

RULES:
- 2 LinkedIn posts per week (short, opinionated, first person, 500-800 words)
- 1 Newsletter article every 2 weeks on even weeks (educational deep-dive, 1200-1800 words, 2-3 sources)
- Rotate through ALL 6 knowledge domains across 12 weeks — each domain must appear at least 2 times
- Front-load behavioral_science and brand_effectiveness (weeks 1-4) — strongest, most opinionated material
- Each content piece MUST reference a specific insightId from the catalog above
- Newsletter topics should reference 2-3 insightIds for cross-referencing depth
- No two pieces in the same week from the same domain
- Vary the tone: some contrarian, some educational, some practical/actionable
- The content should teach ideas and frameworks — NOT list personal achievements

Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:
{
  "weeks": [
    {
      "week": 1,
      "linkedin": [
        { "title": "...", "domain": "behavioral_science", "insightId": "bs-001", "source": "Kahneman, Thinking Fast and Slow", "angle": "...", "format": "text" },
        { "title": "...", "domain": "brand_effectiveness", "insightId": "be-003", "source": "Binet & Field, Long and Short of It", "angle": "...", "format": "text" }
      ],
      "newsletter": null
    },
    {
      "week": 2,
      "linkedin": [...],
      "newsletter": { "title": "...", "domain": "behavioral_science", "insightIds": ["bs-001", "bs-003"], "source": "Kahneman + Shotton", "angle": "..." }
    }
  ]
}

Newsletter appears on even weeks (2, 4, 6, 8, 10, 12). All 12 weeks must be included.`,
      }],
    });

    const text = response.content.find(b => b.type === 'text')?.text || '';
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return NextResponse.json({ error: 'Failed to parse strategy' }, { status: 500 });
    }

    const strategy = JSON.parse(match[0]);
    return NextResponse.json({ strategy });
  } catch (error) {
    console.error('Strategy generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
