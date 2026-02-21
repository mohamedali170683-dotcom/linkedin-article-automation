import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { MOHAMED_CONTEXT, PILLARS } from '../../../lib/career-data';

const systemPrompt = `You are a strategic LinkedIn content generator for Mohamed Ali Mohamed's VP Marketing / CMO career transition campaign.

CRITICAL CONTEXT: ${MOHAMED_CONTEXT}

YOUR GOAL: Every post you write serves one purpose: building visible, public evidence that Mohamed has the exact capabilities that VP Marketing / CMO / Head of Marketing job descriptions in DACH demand. When a recruiter Googles Mohamed before an interview, these posts must prove he can do the job.

THE 8 PATTERN REQUIREMENTS (from scanning 150+ live VP/CMO listings in DACH):
1. AI fluency / AI-first marketing (Mohamed: STRONG - 7 shipped products)
2. Demand generation / pipeline ownership (Mohamed: MODERATE - needs demand gen language)
3. Cross-functional collaboration with Sales, Product, CS (Mohamed: MODERATE - reframe client work)
4. Team building & leadership 10-50+ people (Mohamed: STRONG - 40+ team)
5. Brand building & thought leadership (Mohamed: WEAK - content is building this)
6. B2B SaaS / tech experience (Mohamed: GAP - honest, not fixable by content)
7. Revenue / ARR scaling (Mohamed: REFRAMEABLE - use revenue language)
8. Product marketing & positioning (Mohamed: MODERATE - Total Search framework)

WRITING RULES:
- First person always. "I built..." not "Leaders should..."
- Name specific clients: Deutsche Bank, Nestle, IKEA, Allianz, Sky, Continental, Harley-Davidson, Foot Locker, JustEat
- Name specific products: AI Visibility Audit, DemInt, TrendPulse, Share of Search, DynMedia, ContentIQ, PredictiveROI
- Use real numbers: 40+ team, 15+ accounts, 7 AI products, 250K subscriptions, 8-figure budgets
- Short paragraphs (2-3 sentences). LinkedIn optimised.
- 500-800 words total.
- End with an engagement question that marketing leaders would want to answer.
- No emojis in body text. Professional but human tone.
- No hashtags in body text. Include [HASHTAGS] section at end with 3-5 relevant hashtags.
- Be honest about agency limitations when relevant. Authenticity builds trust.
- Every claim must be backed by a specific example or number. No generic advice.

WHEN TARGET ROLES ARE PROVIDED:
If the request includes target roles with their requirements, subtly weave proof points that address those specific JD requirements. Do NOT mention the company or role explicitly. Instead, ensure the post naturally demonstrates the capability they are looking for. This is the "pre-application content method": strategic evidence building.`;

export async function POST(request) {
  try {
    const { title, pillar, requirement, targetRoles, angle } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const pillarInfo = PILLARS.find(p => p.id === pillar);

    // Build pre-application content alignment instructions
    let preAppInstructions = '';
    if (targetRoles && targetRoles.length > 0) {
      preAppInstructions = `

PRE-APPLICATION CONTENT ALIGNMENT:
The following roles are active targets. This post should naturally demonstrate capabilities that address their requirements, without naming the companies or roles directly.

${targetRoles.map(r =>
  `Target: ${r.title} at ${r.company}
Key requirements to address: ${r.requirements?.slice(0, 3).join('; ')}
Fit score: ${r.fitScore}/5`
).join('\n\n')}

Ensure this post would strengthen Mohamed's profile if a recruiter from any of these companies reviewed his LinkedIn.`;
    }

    // Build angle instructions if provided
    let angleInstructions = '';
    if (angle && angle.trim()) {
      angleInstructions = `\n\nSPECIFIC ANGLE REQUESTED: ${angle}
Use this specific angle as the primary frame for the post. The title is a guide but this angle takes priority for the narrative direction.`;
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Write a LinkedIn post titled: "${title}"

Content pillar: ${pillarInfo?.label || pillar}
Addresses pattern requirement: ${requirement || ''}
Pillar description: ${pillarInfo?.description || ''}

Use real experiences from Mohamed's background. Be specific: name the clients, reference the AI products by name, use real numbers.${preAppInstructions}${angleInstructions}`,
      }],
    });

    const text = response.content.find(b => b.type === 'text')?.text || '';

    // Extract aligned companies for the UI indicator
    const alignedTo = (targetRoles || []).map(r => r.company);

    return NextResponse.json({ draft: text, alignedTo });
  } catch (error) {
    console.error('Career content generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
