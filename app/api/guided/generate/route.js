import { NextResponse } from 'next/server';
import { getWeekData } from '../../../lib/calendar';
import researchBriefs from '../../../lib/research-briefs.json';

const STEP_PROMPTS = {
  opening: `Generate 3 different opening options for this LinkedIn article. Each option should:
- Start with a contrarian hook that challenges conventional marketing wisdom
- Be 2-3 paragraphs (about 150-200 words)
- Use an intellectual but accessible tone
- Never use em-dashes (use commas or periods instead)
- Each option should take a DIFFERENT angle or approach

Return JSON array with 3 objects, each having a "content" field with the opening text.`,

  research: `Generate 3 different research section options. Each option should:
- Deep dive into the methodology and findings from the research brief
- Describe HOW studies were conducted (who ran it, sample size, what was measured)
- Include specific numbers, percentages, and effect sizes
- Be 3-4 paragraphs (about 300-400 words)
- Each option should emphasize DIFFERENT aspects of the research

Return JSON array with 3 objects, each having a "content" field.`,

  body: `Generate 3 different body section options. Each option should:
- Expand on the practical implications of the research
- Connect findings to real marketing scenarios
- Include actionable insights
- Be 3-4 paragraphs (about 300-400 words)
- Each option should take a DIFFERENT practical angle

Return JSON array with 3 objects, each having a "content" field.`,

  conclusion: `Generate 3 different conclusion options. Each option should:
- Summarize the key insight memorably
- Include a thought-provoking discussion question at the end
- Be 2 paragraphs (about 100-150 words)
- End with an engaging CTA that invites comment
- Each option should have a DIFFERENT closing angle

Return JSON array with 3 objects, each having a "content" field.`,

  metadata: `Generate 3 different title/metadata options. Each option should include:
- title: Attention-grabbing title that attacks a specific common practice (under 70 chars)
- subtitle: The metric/insight subhead
- teaserPost: 200-300 word LinkedIn feed post written as flowing paragraphs (not single sentences)
- twitterPost: 280 character max tweet with a specific finding
- hashtags: Array of 6 relevant hashtags starting with #HumanPsychologyAndMarketing
- thumbnailConcept: Specific visual metaphor scene description (no text in image)

Return JSON array with 3 complete metadata objects.`,
};

export async function POST(request) {
  try {
    const { week, step, article, availableCharts } = await request.json();

    if (!week || !step) {
      return NextResponse.json({ error: 'Missing week or step' }, { status: 400 });
    }

    const weekData = getWeekData(week);
    if (!weekData) {
      return NextResponse.json({ error: 'Invalid week' }, { status: 400 });
    }

    const brief = researchBriefs[String(week)] || null;

    // Build context about what's already written
    let articleContext = '';
    if (article.opening) articleContext += `\n\nOPENING ALREADY WRITTEN:\n${article.opening}`;
    if (article.research) articleContext += `\n\nRESEARCH SECTION ALREADY WRITTEN:\n${article.research}`;
    if (article.body) articleContext += `\n\nBODY ALREADY WRITTEN:\n${article.body}`;
    if (article.conclusion) articleContext += `\n\nCONCLUSION ALREADY WRITTEN:\n${article.conclusion}`;

    // Charts context
    let chartsContext = '';
    if (availableCharts && availableCharts.length > 0) {
      chartsContext = `\n\nAVAILABLE CHARTS FOR THIS ARTICLE:\n${availableCharts.map((c, i) => `${i + 1}. ${c.caption}`).join('\n')}`;
    }
    if (article.charts && article.charts.length > 0) {
      chartsContext += `\n\nSELECTED CHARTS:\n${article.charts.map(c => c.caption).join('\n')}`;
    }

    const systemPrompt = `You are helping Mohamed Hamdy, Search Marketing Director at WPP Media Germany, write a LinkedIn article step by step.

CRITICAL RULES:
- ONLY use information from the RESEARCH BRIEF provided
- Do NOT fabricate statistics or quotes
- Never use em-dashes (use commas or periods instead)
- Write in an intellectual but accessible tone
- Each option must be distinctly different in approach/angle

${STEP_PROMPTS[step]}`;

    let userPrompt = `Week ${week}: "${weekData.topic}"
Sources: ${weekData.sources}`;

    if (brief) {
      userPrompt += `

RESEARCH BRIEF:
${brief.brief}

KEY QUOTES:
${brief.keyQuotes?.join('\n') || 'None provided'}

KEY FINDINGS:
${brief.keyFindings?.join('\n') || 'None provided'}`;
    }

    userPrompt += articleContext;
    userPrompt += chartsContext;

    userPrompt += `

Generate 3 distinctly different options for the ${step} section. Return ONLY valid JSON array.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }

    const data = await response.json();
    const textContent = data.content.find(block => block.type === 'text')?.text || '';

    // Parse JSON from response
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const options = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ options });
    }

    return NextResponse.json({ error: 'Failed to parse options', raw: textContent }, { status: 500 });
  } catch (error) {
    console.error('Guided generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
