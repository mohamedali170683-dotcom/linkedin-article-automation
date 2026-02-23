import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { PILLARS, MOHAMED_CONTEXT } from '../../../lib/career-data';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const { targetRoles } = await request.json();

    if (!targetRoles || targetRoles.length === 0) {
      return NextResponse.json({ error: 'At least one target role is required' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const rolesContext = targetRoles.map(r =>
      `- ${r.title} at ${r.company} (${r.location})
  Requirements: ${(r.requirements || []).slice(0, 5).join('; ')}
  Fit score: ${r.fitScore}/5`
    ).join('\n');

    const pillarsContext = PILLARS.map(p =>
      `- ${p.label} (${p.id}): ${p.description}`
    ).join('\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are a strategic content planner for Mohamed Ali Mohamed's VP Marketing / CMO career campaign.

MOHAMED'S BACKGROUND:
${MOHAMED_CONTEXT}

TARGET ROLES THIS QUARTER:
${rolesContext}

AVAILABLE CONTENT PILLARS:
${pillarsContext}

THE 8 PATTERN REQUIREMENTS (from 150+ VP/CMO listings in DACH):
1. AI fluency (Mohamed: STRONG)
2. Demand generation (Mohamed: MODERATE)
3. Cross-functional collaboration (Mohamed: MODERATE)
4. Team building & leadership (Mohamed: STRONG)
5. Brand building & thought leadership (Mohamed: WEAK)
6. B2B SaaS / tech experience (Mohamed: GAP)
7. Revenue / ARR scaling (Mohamed: REFRAMEABLE)
8. Product marketing & positioning (Mohamed: MODERATE)

TASK: Generate a 12-week content strategy that builds evidence for the target roles above.

RULES:
- 2 LinkedIn posts per week (short, punchy, first person, 500-800 words each)
- 1 Newsletter article every 2 weeks (educational, 1200-1800 words, with frameworks/data)
- Prioritize pillars that address WEAK/GAP/MODERATE areas with real proof points
- Front-load STRONG pillars (weeks 1-3) to build momentum, then address gaps
- Every piece should be traceable to a specific requirement from the target roles
- Vary formats: most are text, include 1-2 carousel ideas and 1 video idea
- Newsletter topics should be broader/educational (not just "I did X")

Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:
{
  "weeks": [
    {
      "week": 1,
      "linkedin": [
        { "title": "...", "pillar": "ai", "angle": "...", "alignsTo": ["requirement addressed"], "format": "text" },
        { "title": "...", "pillar": "crossfunc", "angle": "...", "alignsTo": ["requirement addressed"], "format": "text" }
      ],
      "newsletter": null
    },
    {
      "week": 2,
      "linkedin": [...],
      "newsletter": { "title": "...", "pillar": "ai", "angle": "...", "alignsTo": ["requirement addressed"] }
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
