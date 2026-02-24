import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CURATED_INSIGHTS, getInsightById, getDomainById } from '../../../lib/knowledge-base';
import { AUTHOR_VOICE, NEWSLETTER_SYSTEM_PROMPT } from '../../../lib/career-data';

export const maxDuration = 60;

// ═══════════════════════════════════════════════
// LinkedIn system prompt — ideas-first, not CV-first
// ═══════════════════════════════════════════════

const linkedinSystemPrompt = `You are a thought leadership content writer covering marketing science, behavioral economics, and business strategy.

${AUTHOR_VOICE}

LINKEDIN POST FORMAT:
- 500-800 words
- Opens with a counterintuitive finding, a bold claim, or a pattern most people miss
- The RESEARCH or FRAMEWORK is the post. The practitioner perspective interprets it.
- Structure: Hook (finding) → Why it matters → Practitioner interpretation → Implication → Question
- Be specific: name the researcher, name the study, name the finding
- Be opinionated: take a clear position on what the research means for practice
- Short paragraphs (2-3 sentences max). LinkedIn-optimized.
- End with a genuine engagement question that marketing leaders would want to answer
- No emojis in body text. Professional but human tone.
- No hashtags in body text. Include [HASHTAGS] section at end with 3-5 relevant hashtags.

CONTENT APPROACH:
- The INSIGHT is the headline. The experience is the supporting evidence.
- When referencing research, name the researcher and the finding specifically
- When adding practitioner perspective, use "In practice..." or "What this means for marketing teams..." — not "When I built..." or "At my agency..."
- Contrarian takes welcome. Challenge conventional marketing wisdom with evidence.
- Every claim backed by research or observable pattern. No generic advice.`;

export async function POST(request) {
  try {
    const { title, pillar, domain, insightId, insightIds, type, angle, targetRoles } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const isNewsletter = type === 'newsletter';

    // Resolve domain (support both old `pillar` and new `domain` keys)
    const domainId = domain || pillar;
    const domainInfo = getDomainById(domainId);

    // Look up curated insight(s)
    const ids = isNewsletter
      ? (insightIds || (insightId ? [insightId] : []))
      : (insightId ? [insightId] : []);
    const insights = ids.map(id => getInsightById(id)).filter(Boolean);

    // Build insight context for the prompt
    let insightContext = '';
    if (insights.length > 0) {
      insightContext = `\n\nSOURCE MATERIAL — use this as the foundation of the ${isNewsletter ? 'article' : 'post'}:\n\n` +
        insights.map(ins => (
          `Research: ${ins.source.author}, "${ins.source.book}"
Framework: ${ins.framework}
Key Insight: ${ins.insight}
Suggested Angle: ${isNewsletter ? ins.newsletterAngle : ins.linkedinAngle}`
        )).join('\n\n---\n\n');
    }

    // Build subtle role alignment (secondary, not primary)
    let roleAlignment = '';
    if (targetRoles && targetRoles.length > 0) {
      roleAlignment = `\n\nSECONDARY GOAL (subtle, do not make this obvious):
This content should naturally demonstrate capabilities relevant to senior marketing leadership roles. Do NOT mention any companies or roles directly. Instead, ensure the ${isNewsletter ? 'article' : 'post'} naturally signals:
${targetRoles.slice(0, 3).map(r =>
  `- Familiarity with: ${(r.requirements || []).slice(0, 2).join(', ')}`
).join('\n')}`;
    }

    // Build angle instructions
    let angleInstructions = '';
    if (angle && angle.trim()) {
      angleInstructions = `\n\nSPECIFIC ANGLE: ${angle}\nUse this angle as the primary frame for the ${isNewsletter ? 'article' : 'post'}.`;
    }

    const systemPrompt = isNewsletter ? NEWSLETTER_SYSTEM_PROMPT : linkedinSystemPrompt;

    const userContent = isNewsletter
      ? `Write a newsletter article titled: "${title}"

Knowledge domain: ${domainInfo?.label || domainId}
Domain description: ${domainInfo?.description || ''}
${insightContext}

This is an educational newsletter article. It should:
- Be 1200-1800 words
- Include section headers wrapped in ** (e.g., **Section Title**)
- Start with a counterintuitive finding or provocative question
- Pull from 2-3 specific sources: name the researcher, name the study, name the finding
- Build a cohesive argument that weaves multiple sources together
- Include at least one actionable framework or mental model
- End with an implication or open question that invites replies${roleAlignment}${angleInstructions}`
      : `Write a LinkedIn post titled: "${title}"

Knowledge domain: ${domainInfo?.label || domainId}
Domain description: ${domainInfo?.description || ''}
${insightContext}

Write a 500-800 word LinkedIn post that teaches this idea to a marketing audience.
The research IS the post. Your practitioner perspective interprets it.${roleAlignment}${angleInstructions}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: isNewsletter ? 3000 : 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const text = response.content.find(b => b.type === 'text')?.text || '';
    const alignedTo = (targetRoles || []).map(r => r.company);

    return NextResponse.json({
      draft: text,
      alignedTo,
      type: isNewsletter ? 'newsletter' : 'linkedin',
    });
  } catch (error) {
    console.error('Career content generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
