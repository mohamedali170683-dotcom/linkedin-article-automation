import { NextResponse } from 'next/server';
import catchlightCalendar from '../../../lib/catchlight-calendar.json';

export async function POST(request) {
  try {
    const { week } = await request.json();

    // Get the Light topic for this week from Catchlight calendar
    const lightData = catchlightCalendar.weeks.find(w => w.week === week);
    if (!lightData) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    }

    const prompt = `You are writing a "Light" for Catchlight, a biweekly newsletter about "where AI visibility meets the science of attention."

LIGHT #${week}: "${lightData.light}"
HOOK: ${lightData.hook}
AI VISIBILITY ANGLE: ${lightData.aiVisibility}
ATTENTION SCIENCE ANGLE: ${lightData.attentionScience}
SOURCES TO REFERENCE: ${lightData.sources.join(', ')}

BRAND VOICE:
- Sharp, confident, slightly contrarian
- Data-driven but not dry
- Written for marketing directors who are skeptical of hype
- Never preachy or obvious
- Use "you" to speak directly to the reader

STRUCTURE (450-600 words total):
1. HOOK (1-2 sentences): Start with the provocative statement provided. Make them stop scrolling.
2. THE AI REALITY (100-150 words): What's actually happening in AI search/visibility right now. Be specific with data or examples.
3. THE BRAIN SCIENCE (100-150 words): The behavioral principle that explains why this matters. Reference the research but make it accessible.
4. THE BRIDGE (100-150 words): Where these two worlds collide. This is your unique insight - what no one else is saying.
5. THE TAKEAWAY (1-2 sentences): One memorable line they'll remember. Make it quotable.

RULES:
- NEVER use em-dashes. Use commas, periods, or "and" instead.
- Short paragraphs (2-3 sentences max)
- No bullet points in the body - this is prose
- Don't start with "In today's world" or similar clichés
- Don't end with a question - end with a statement
- Include at least one specific data point or study reference

Generate 2 DIFFERENT versions:

VERSION A - "Sharp & Provocative"
- More aggressive hook
- Challenges conventional wisdom
- Slightly edgy tone

VERSION B - "Thoughtful & Nuanced"
- More reflective opening
- Acknowledges complexity
- Warmer but still smart

Return as JSON array:
[
  {
    "styleName": "Sharp & Provocative",
    "styleDescription": "Challenges conventional thinking, edgier tone",
    "title": "Light #${week}: ${lightData.light}",
    "subtitle": "${lightData.hook}",
    "content": "Full Light body here (450-600 words)..."
  },
  {
    "styleName": "Thoughtful & Nuanced",
    "styleDescription": "Reflective, acknowledges complexity",
    "title": "Light #${week}: ${lightData.light}",
    "subtitle": "${lightData.hook}",
    "content": "Full Light body here (450-600 words)..."
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
        max_tokens: 4000,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return NextResponse.json({ error: 'Failed to generate Light' }, { status: 500 });
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

    return NextResponse.json({
      options,
      lightData: {
        week: lightData.week,
        light: lightData.light,
        hook: lightData.hook
      }
    });

  } catch (error) {
    console.error('Light generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
