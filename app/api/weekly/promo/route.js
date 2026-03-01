import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AUTHOR_VOICE } from '../../../lib/career-data';

export const maxDuration = 60;

const PROMO_SYSTEM_PROMPT = `You write LinkedIn promotional posts for the Catchlight newsletter.

${AUTHOR_VOICE}

LINKEDIN POST RULES:
- First 210 characters MUST force a "See more" click. Open with a surprising stat, a bold claim, or a pattern break. This is the single most important part of the post.
- Total length: 800-1800 characters
- Short paragraphs (1-2 sentences each, generous white space)
- No emojis anywhere in the post
- No markdown formatting (no **, no ##, no bullet points) — plain text only
- No external links in the body text
- End with a reference to the full article and "link in the first comment"
- Final line: exactly 3-5 hashtags on a new line, MUST include #Visibility #MarketingScience #Catchlight
- Do NOT summarize the article. TEASE it. Create curiosity gaps.
- The post should stand alone as valuable even if the reader never clicks.
- No AI slop phrases ("In today's world...", "Let's dive in...", etc.)`;

export async function POST(request) {
  try {
    const { weekNumber, articleTitle, articleContent } = await request.json();

    if (!articleContent) {
      return NextResponse.json({ error: 'articleContent is required (generate article first)' }, { status: 400 });
    }

    const userContent = `Here is this week's Catchlight article. Write a LinkedIn promotional post that makes people want to read the full article.

ARTICLE TITLE: ${articleTitle || 'Catchlight Article'}

ARTICLE CONTENT (for context):
${articleContent.substring(0, 2500)}

Return ONLY valid JSON (no markdown code blocks):
{
  "content": "Full LinkedIn post text including hashtags...",
  "hookPreview": "The first 210 characters exactly"
}`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: PROMO_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const text = response.content.find(b => b.type === 'text')?.text || '';

    let promoPost;
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        promoPost = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON object found');
      }
    } catch (e) {
      console.error('Failed to parse promo response:', text.substring(0, 300));
      promoPost = {
        content: text,
        hookPreview: text.substring(0, 210),
      };
    }

    promoPost.status = 'generated';

    return NextResponse.json({ promoPost });
  } catch (error) {
    console.error('Weekly promo generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
