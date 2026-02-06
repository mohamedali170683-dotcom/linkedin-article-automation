import { NextResponse } from 'next/server';
import researchBriefs from '../../../lib/research-briefs.json';

export async function POST(request) {
  try {
    const { week } = await request.json();

    // Get research brief for this week
    const brief = researchBriefs[String(week)];
    if (!brief) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    }

    const prompt = `You are a LinkedIn content strategist. Generate 2 COMPLETE LinkedIn articles about "${brief.topic}" using this research:

RESEARCH BRIEF:
${brief.brief}

KEY QUOTES:
${brief.keyQuotes?.join('\n') || 'N/A'}

KEY FINDINGS:
${brief.keyFindings?.join('\n') || 'N/A'}

Create 2 FULL articles with DIFFERENT styles:

OPTION A - "Research-Forward"
- Lead with compelling data/statistics
- Academic but accessible tone
- Heavy emphasis on citing studies
- Structure: Hook with data → Research deep-dive → Practical implications → CTA

OPTION B - "Storytelling Approach"
- Lead with a relatable scenario or question
- Conversational, thought-provoking tone
- Weave research into narrative naturally
- Structure: Story/question hook → "Here's what research shows" → Real-world application → CTA

Each article should be:
- 800-1200 words
- Use short paragraphs (2-3 sentences max)
- Include specific data points from the research
- End with an engaging question or call-to-action
- NEVER use em-dashes. Use commas, periods, or regular hyphens instead

Return as JSON array:
[
  {
    "styleName": "Research-Forward",
    "styleDescription": "Data-driven, academic yet accessible",
    "title": "Article title here",
    "subtitle": "Optional subtitle",
    "content": "Full article body here..."
  },
  {
    "styleName": "Storytelling",
    "styleDescription": "Narrative-driven, conversational",
    "title": "Article title here",
    "subtitle": "Optional subtitle",
    "content": "Full article body here..."
  }
]

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`;

    // Call Anthropic API directly
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return NextResponse.json({ error: 'Failed to generate articles' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content.find(block => block.type === 'text')?.text || '';

    // Parse the JSON response
    let options;
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      options = JSON.parse(cleanText);
    } catch (e) {
      console.error('Failed to parse response:', text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ options });

  } catch (error) {
    console.error('Article generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
