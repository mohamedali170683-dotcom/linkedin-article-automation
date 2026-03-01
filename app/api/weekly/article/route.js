import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import catchlightCalendar from '../../../lib/catchlight-calendar.json';
import bookPagesUrls from '../../../lib/book-pages-urls.json';
import { AUTHOR_VOICE } from '../../../lib/career-data';
import { findMatchingInsights } from '../../../lib/insight-matcher';

export const maxDuration = 120;

const ARTICLE_SYSTEM_PROMPT = `You are writing a deep research article for Catchlight, a newsletter about "where AI visibility meets the science of attention."

${AUTHOR_VOICE}

ARTICLE FORMAT:
- 2500-3500 words
- Research-first, citation-heavy
- Name specific researchers, specific numbers, specific studies
- Connected narrative structure — NOT a listicle
- Section headers wrapped in ** (e.g., **Section Title**)

STRUCTURE:
1. HOOK (2-3 sentences): Open with a counterintuitive finding or provocative tension
2. **The Research** (800-1000 words): Deep dive into the source material. Name the researchers, describe the methodology, cite specific numbers and effect sizes.
3. **The Framework** (400-600 words): Synthesize the research into an actionable framework or mental model. Give it a name if possible.
4. **The Bridge** (400-600 words): Connect the research to AI visibility. How does this principle play out when brands appear in ChatGPT, Perplexity, or AI Overviews?
5. **The Implication** (300-400 words): What should marketing leaders do differently? One clear recommendation backed by the evidence.
6. CODA (1-2 sentences): A memorable closing line that echoes the hook.

BANNED PHRASES:
- "In today's rapidly evolving..."
- "Let's dive in"
- "It's important to note"
- "In the ever-changing landscape"
- "Game-changer"
- "Unlock the power of"
- "At the end of the day"
- "In conclusion"
- "Without further ado"
- "Needless to say"

Every claim must include source attribution. If you are not certain of a specific number, say "approximately" or "research suggests" — never fabricate statistics.

AUTHOR: Mohamed Elhabiby
NEWSLETTER: Catchlight — Where Visibility Meets Attention`;

export async function POST(request) {
  try {
    const { weekNumber } = await request.json();

    if (!weekNumber || weekNumber < 1 || weekNumber > 52) {
      return NextResponse.json({ error: 'weekNumber must be 1-52' }, { status: 400 });
    }

    const lightData = catchlightCalendar.weeks.find(w => w.week === weekNumber);
    if (!lightData) {
      return NextResponse.json({ error: `No Light found for week ${weekNumber}` }, { status: 404 });
    }

    // Get matching insights from knowledge base
    const matchedInsights = findMatchingInsights(lightData.sources);

    // Get available charts for context
    const charts = bookPagesUrls[String(weekNumber)] || [];

    // Build user content
    const insightContext = matchedInsights.length > 0
      ? `\n\nCURATED INSIGHTS FROM KNOWLEDGE BASE:\n${matchedInsights.map(ins =>
          `- ${ins.source.author}, "${ins.source.book}" — ${ins.framework}: ${ins.insight.substring(0, 300)}...`
        ).join('\n\n')}`
      : '';

    const chartContext = charts.length > 0
      ? `\n\nAVAILABLE RESEARCH CHARTS (reference these in your article if relevant):\n${charts.map(c => `- ${c.caption}`).join('\n')}`
      : '';

    const userContent = `Write Light #${weekNumber}: "${lightData.light}"

Hook: ${lightData.hook}
AI Visibility Angle: ${lightData.aiVisibility}
Attention Science Angle: ${lightData.attentionScience}
Source References: ${lightData.sources.join(', ')}
${insightContext}${chartContext}

Write the full article following the structure in your instructions. Return ONLY valid JSON (no markdown code blocks):
{
  "title": "Light #${weekNumber}: ${lightData.light}",
  "subtitle": "A compelling subtitle based on the hook",
  "content": "Full markdown article (2500-3500 words)...",
  "sections": ["Hook", "The Research", "The Framework", "The Bridge", "The Implication", "Coda"],
  "researchers": ["List of researcher names mentioned in the article"]
}`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: ARTICLE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const text = response.content.find(b => b.type === 'text')?.text || '';

    // Parse JSON from response
    let article;
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        article = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON object found');
      }
    } catch (e) {
      console.error('Failed to parse article response:', text.substring(0, 500));
      // Fallback: return raw text as content
      article = {
        title: `Light #${weekNumber}: ${lightData.light}`,
        subtitle: lightData.hook,
        content: text,
        sections: [],
        researchers: [],
      };
    }

    article.status = 'generated';

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Weekly article generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
