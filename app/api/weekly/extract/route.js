import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AUTHOR_VOICE } from '../../../lib/career-data';

export const maxDuration = 120;

const LINKEDIN_RULES = `LINKEDIN POST RULES:
- First 210 characters MUST force a "See more" click
- Total length: 800-1800 characters
- Short paragraphs (1-2 sentences each, generous white space)
- No emojis anywhere
- No markdown formatting — plain text only
- No external links in the body text
- End with a reference to the full Catchlight article and "link in the first comment"
- Final line: 3-5 hashtags including #Visibility #MarketingScience #Catchlight
- No AI slop phrases`;

const PILL_PROMPTS = [
  // Tuesday — Infographic (DATA-DRIVEN)
  {
    day: 'tuesday',
    format: 'infographic',
    systemSuffix: `PILL FORMAT: INFOGRAPHIC COMPANION (Tuesday)
- This LinkedIn post accompanies an infographic image
- Focus on NUMBERS, COMPARISONS, PERCENTAGES, BEFORE/AFTER from the article
- Lead with the most striking data point
- The post explains the data story; the infographic visualizes it

${LINKEDIN_RULES}

ALSO GENERATE:
- infographicBrief: Describe what the infographic should show (layout, data points, comparison structure)
- dataPoints: Array of 3-5 specific data points/stats to feature in the visual

Return ONLY valid JSON (no markdown code blocks):
{
  "day": "tuesday",
  "format": "infographic",
  "postContent": "LinkedIn post text with hashtags...",
  "infographicBrief": "Description of what the infographic should show...",
  "dataPoints": ["stat 1", "stat 2", "stat 3"],
  "hookPreview": "first 210 characters exactly"
}`,
  },
  // Wednesday — Video Script (FORWARD-LOOKING)
  {
    day: 'wednesday',
    format: 'video',
    systemSuffix: `PILL FORMAT: VIDEO SCRIPT (Wednesday)
- This LinkedIn post accompanies a short video (45-60 seconds)
- Focus on TRENDS, PREDICTIONS, WHAT IS CHANGING from the article
- The post and video script must be different — not the same text

${LINKEDIN_RULES}

ALSO GENERATE:
- videoScript: A 45-60 second narration script (~120-160 words) structured as:
  [HOOK - 5 sec] [SETUP - 15 sec] [INSIGHT - 25 sec] [TAKEAWAY - 10 sec] [CTA - 5 sec]
- duration: estimated total seconds (45-60)

Return ONLY valid JSON (no markdown code blocks):
{
  "day": "wednesday",
  "format": "video",
  "postContent": "LinkedIn post text with hashtags...",
  "videoScript": "Narration script with section markers...",
  "duration": 55,
  "hookPreview": "first 210 characters exactly"
}`,
  },
  // Thursday — Text Only (NARRATIVE)
  {
    day: 'thursday',
    format: 'text',
    systemSuffix: `PILL FORMAT: TEXT-ONLY STORYTELLING (Thursday)
- This is a standalone text post with NO visual companion
- Focus on a STORY: an experiment, an anecdote, a historical case from the article
- Narrative structure: Situation -> Complication -> Resolution -> Lesson
- This must be the most engaging, scroll-stopping post of the week
- Make it feel like a micro-essay, not a marketing post

${LINKEDIN_RULES}

Return ONLY valid JSON (no markdown code blocks):
{
  "day": "thursday",
  "format": "text",
  "postContent": "LinkedIn post text with hashtags...",
  "hookPreview": "first 210 characters exactly"
}`,
  },
];

export async function POST(request) {
  try {
    const { weekNumber, articleTitle, articleContent, pillIndex } = await request.json();

    if (!articleContent) {
      return NextResponse.json({ error: 'articleContent is required (generate article first)' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Generate single pill or all three
    const indicesToGenerate = pillIndex !== undefined && pillIndex !== null
      ? [pillIndex]
      : [0, 1, 2];

    const results = [];
    const previousHooks = [];

    for (const idx of indicesToGenerate) {
      const pillConfig = PILL_PROMPTS[idx];
      if (!pillConfig) continue;

      // Build non-overlap context
      let overlapGuard = '';
      if (previousHooks.length > 0) {
        overlapGuard = `\n\nALREADY GENERATED (do NOT repeat these angles or insights):\n${
          previousHooks.map((h, i) => `- ${PILL_PROMPTS[i].day.toUpperCase()}: ${h}`).join('\n')
        }\n\nChoose a DIFFERENT insight, angle, and data point from the article.`;
      }

      const systemPrompt = `You extract standalone insight pills from research articles for LinkedIn.

${AUTHOR_VOICE}

${pillConfig.systemSuffix}`;

      const userContent = `Extract a ${pillConfig.format} insight pill from this Catchlight article.

ARTICLE TITLE: ${articleTitle || 'Catchlight Article'}

FULL ARTICLE:
${articleContent}
${overlapGuard}

The pill must work completely on its own — the reader should NOT need the full article for context. Include at least one specific data point or named study.`;

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      });

      const text = response.content.find(b => b.type === 'text')?.text || '';

      let pill;
      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          pill = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (e) {
        console.error(`Failed to parse ${pillConfig.day} pill:`, text.substring(0, 300));
        pill = {
          day: pillConfig.day,
          format: pillConfig.format,
          postContent: text,
          hookPreview: text.substring(0, 210),
        };
      }

      pill.status = 'generated';
      results.push(pill);
      previousHooks.push(pill.hookPreview || pill.postContent?.substring(0, 210) || '');
    }

    // Return single pill or array
    if (pillIndex !== undefined && pillIndex !== null) {
      return NextResponse.json({ pill: results[0] });
    }
    return NextResponse.json({ pills: results });
  } catch (error) {
    console.error('Weekly pill extraction failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
