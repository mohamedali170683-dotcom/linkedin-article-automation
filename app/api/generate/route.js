import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getWeekData } from '../../lib/calendar';
import researchBriefs from '../../lib/research-briefs.json';

export async function POST(request) {
  try {
    const { week } = await request.json();
    const weekData = getWeekData(week);

    if (!weekData) {
      return NextResponse.json({ error: 'Invalid week number' }, { status: 400 });
    }

    const brief = researchBriefs[String(weekData.week)] || null;

    const systemPrompt = `You are generating a LinkedIn article for Mohamed Hamdy, Search Marketing Director at WPP Media Germany.

CRITICAL SOURCE RULE:
- You MUST ONLY use information, quotes, and findings from the RESEARCH BRIEF provided below.
- The research brief contains real excerpts from Mohamed's personal library of behavioral science and marketing books.
- Do NOT add any statistics, quotes, or claims from outside these sources.
- If the research brief is limited, write a shorter but still compelling article using only what is provided.
- Every claim must be traceable to the provided brief. Do not fabricate or supplement with general knowledge.

VOICE GUIDELINES:
- Use contrarian hooks that challenge conventional marketing wisdom
- Reference historical figures or philosophical concepts in the opening
- Write in an intellectual but accessible tone
- NEVER use em-dashes. Use commas, periods, or regular hyphens instead
- Keep the article between 1,500-1,800 words
- End with a discussion question to drive engagement

STRUCTURE:
1. Hook (contrarian statement or historical reference)
2. The Research (what the science actually shows)
3. Why This Matters (practical implications)
4. Application (actionable recommendations)
5. The Bottom Line (memorable closing insight)
6. Discussion CTA

FORMAT YOUR RESPONSE AS JSON with these exact keys:
{
  "title": "Attention-grabbing title that challenges assumptions",
  "subtitle": "The metric/insight subhead",
  "article": "Full article text with proper paragraph breaks using double newlines",
  "teaserPost": "200-300 word LinkedIn feed post that teases the article. Include line breaks for readability.",
  "twitterPost": "280 character max tweet that teases the article with a hook",
  "hashtags": ["#HumanPsychologyAndMarketing", "plus 5 more relevant hashtags"],
  "thumbnailConcept": "Visual concept description for the article image",
  "citations": ["List of sources cited in the article with author, title, and year"]
}`;

    let userPrompt = `Generate a complete LinkedIn article package for Week ${weekData.week}: "${weekData.topic}"

Primary Sources to Reference: ${weekData.sources}
Key Search Terms: ${weekData.searchTerms.join(", ")}`;

    if (brief) {
      userPrompt += `

RESEARCH BRIEF FROM YOUR LIBRARY:
${brief.brief}

Key Quotes You Can Use:
${brief.keyQuotes.join('\n')}

Key Findings:
${brief.keyFindings.join('\n')}`;
    }

    userPrompt += `

Requirements:
1. ONLY use information from the Research Brief above. Do not add external knowledge or statistics.
2. Use the specific quotes and findings provided word-for-word where possible.
3. Every citation must reference a book or paper from the Research Brief.
4. Connect to practical marketing applications (Google Ads, brand building, consumer behavior)
5. Write for an audience of marketing professionals who want evidence-based insights
6. Make it memorable and shareable
7. The teaser post should be compelling and end with "Link in comments" or similar CTA
8. The Twitter post should be punchy, contrarian, and under 280 characters
9. The citations list must ONLY include sources mentioned in the Research Brief

Remember: NO em-dashes. Use commas or periods instead.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 5000,
        messages: [
          { role: "user", content: userPrompt }
        ],
        system: systemPrompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return NextResponse.json({ error: 'Failed to generate article' }, { status: 500 });
    }

    const data = await response.json();
    const textContent = data.content.find(block => block.type === 'text')?.text || '';

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Generate header image with DALL-E 3
      if (parsed.thumbnailConcept && process.env.OPENAI_API_KEY) {
        try {
          const imagePrompt = `Professional, modern LinkedIn article header image. ${parsed.thumbnailConcept}. Clean, minimalist style with subtle gradients and abstract shapes. No text, no words, no letters in the image.`;

          const imgRes = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'dall-e-3',
              prompt: imagePrompt,
              n: 1,
              size: '1792x1024',
              quality: 'standard',
            }),
          });

          const imgData = await imgRes.json();
          const dalleUrl = imgData.data?.[0]?.url;

          if (dalleUrl) {
            // Save to Vercel Blob for permanent storage (DALL-E URLs expire in ~1hr)
            const imgDownload = await fetch(dalleUrl);
            const imgBuffer = await imgDownload.arrayBuffer();
            const blob = await put(`images/week-${week}.png`, Buffer.from(imgBuffer), {
              access: 'public',
              contentType: 'image/png',
            });
            parsed.imageUrl = blob.url;
          }
        } catch (imgError) {
          console.error('Image generation failed (non-blocking):', imgError);
        }
      }

      // Auto-save to blob storage
      try {
        const origin = new URL(request.url).origin;
        await fetch(`${origin}/api/articles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            week: weekData.week,
            topic: weekData.topic,
            content: parsed,
            generatedAt: new Date().toISOString()
          })
        });
      } catch (saveError) {
        console.error('Failed to auto-save article:', saveError);
      }

      return NextResponse.json({
        success: true,
        week: weekData.week,
        topic: weekData.topic,
        content: parsed,
        generatedAt: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        error: 'Failed to parse generated content',
        raw: textContent
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
