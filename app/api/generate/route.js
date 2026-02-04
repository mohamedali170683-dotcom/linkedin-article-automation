import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getWeekData } from '../../lib/calendar';
import researchBriefs from '../../lib/research-briefs.json';
import bookPagesUrls from '../../lib/book-pages-urls.json';

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

RESEARCH DEPTH REQUIREMENTS:
- When referencing a study, ALWAYS explain the methodology: who conducted it, sample size, what they measured, how they measured it, and the specific numerical findings
- Example: Instead of "research shows anchoring works," write "Kahneman describes an experiment where real-estate agents assessed the value of a house. Half saw a substantially higher asking price. Despite their expertise, the agents were significantly influenced by the anchor price, yet insisted they were not."
- Describe the experimental setup so the reader can visualize it: "In Cialdini's study, beef buyers were divided into three groups..."
- Include specific numbers from the research brief: percentages, sample sizes, effect sizes, time periods
- When a study compared groups, describe both the control and experimental conditions
- Make the reader feel like they are reading the original research, not a summary of a summary

VOICE GUIDELINES:
- Use contrarian hooks that challenge conventional marketing wisdom
- Reference historical figures or philosophical concepts in the opening
- Write in an intellectual but accessible tone
- NEVER use em-dashes. Use commas, periods, or regular hyphens instead
- Keep the article between 1,800-2,200 words (longer to accommodate research depth)
- End with a discussion question to drive engagement

STRUCTURE:
1. Hook (contrarian statement or provocative challenge to a specific common practice)
2. The Research (deep dive into methodology and findings, describe HOW studies were conducted)
3. The Numbers (specific data points, effect sizes, percentages from the research)
4. Why This Matters (practical implications for marketers)
5. Application (actionable recommendations grounded in the evidence)
6. The Bottom Line (memorable closing insight)
7. Discussion CTA

INLINE RESEARCH CHARTS/FIGURES:
- You will be provided with a list of AVAILABLE CHARTS AND FIGURES (cropped from Mohamed's actual research library)
- Select 1-2 of the most relevant charts or figures to embed inline within the article
- CRITICAL RULE: Only select a chart if the article text EXPLICITLY discusses the specific data or example shown in that chart. If a chart shows a McDonald's case study, the article MUST mention McDonald's. If a chart shows a specific experiment, the article MUST describe that experiment. The reader must be able to look at the chart and immediately understand why it is there based on the preceding paragraph.
- If none of the available charts directly match what the article discusses, return an EMPTY sectionImages array []. It is better to have no chart than an irrelevant one.
- Each sectionImage has "afterParagraph" (paragraph number after which to insert the image, counting from 1) and "bookPageIndex" (the index number from the available list, starting from 0)
- Place each chart RIGHT AFTER the paragraph that explicitly discusses the data shown in that chart
- Write the preceding paragraph so it references the specific finding visualized in the chart (e.g. "As shown in Figure X..." or "The McDonald's case study illustrates...")

FORMAT YOUR RESPONSE AS JSON with these exact keys:
{
  "title": "Attention-grabbing title that attacks a specific common practice or belief",
  "subtitle": "The metric/insight subhead",
  "article": "Full article text with proper paragraph breaks using double newlines. Must include detailed research methodology descriptions.",
  "teaserPost": "200-300 word LinkedIn feed post written as flowing, connected paragraphs (NOT isolated single sentences). Write it like a mini-essay that tells a story: start with a surprising hook paragraph (2-3 sentences), then a paragraph explaining the research finding that connects logically to the hook, then a paragraph with the practical implication. Each paragraph should flow naturally into the next. Use line breaks between paragraphs, NOT between every sentence. End with a CTA like 'Full article in the comments' or 'Link in comments'.",
  "twitterPost": "280 character max tweet with a specific number or finding that provokes curiosity",
  "hashtags": ["#HumanPsychologyAndMarketing", "plus 5 more relevant hashtags"],
  "thumbnailConcept": "A specific, concrete visual metaphor that captures the CENTRAL TENSION or SURPRISING INSIGHT of THIS specific article (not just the general topic). The image should make someone stop scrolling and think 'what is this about?'. BAD example for a brand-building article: 'a clock' (too generic, could be about anything). GOOD example for a brand-building vs short-term article: 'A small seedling growing through cracked concrete next to withered cut flowers in a glass vase, photographed from ground level with morning light'. The metaphor must reflect the article's specific argument. Describe a SCENE with camera angle, lighting, subject, and mood. Must be a single concrete image, not a collage. ABSOLUTELY NO TEXT, WORDS, LETTERS, NUMBERS, OR TYPOGRAPHY IN THE IMAGE.",
  "sectionImages": [
    {
      "afterParagraph": 3,
      "bookPageIndex": 0
    }
  ],
  "citations": ["List of sources cited in the article with author, title, year, and page numbers where available"]
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

    // Add available charts/figures for inline embedding
    const weekPages = bookPagesUrls[String(weekData.week)] || [];
    if (weekPages.length > 0) {
      userPrompt += `

AVAILABLE RESEARCH CHARTS/FIGURES (select 1-2 to embed inline):
${weekPages.map((p, i) => `[${i}] ${p.caption} (from ${p.book}, page ${p.page})`).join('\n')}`;
    }

    userPrompt += `

Requirements:
1. ONLY use information from the Research Brief above. Do not add external knowledge or statistics.
2. Use the specific quotes and findings provided word-for-word where possible.
3. Every citation must reference a book or paper from the Research Brief.
4. Connect to practical marketing applications (Google Ads, brand building, consumer behavior)
5. Write for an audience of marketing professionals who want evidence-based insights
6. Make it memorable and shareable
7. The teaser post MUST be written as connected, flowing paragraphs (2-3 paragraphs of 2-4 sentences each). Do NOT write isolated single sentences separated by line breaks. It should read like a compelling mini-essay, not a list of disconnected statements. End with "Link in comments" or similar CTA
8. The Twitter post should be punchy, contrarian, and under 280 characters
9. The citations list must ONLY include sources mentioned in the Research Brief
10. For EVERY study or experiment mentioned, describe: who ran it, how many participants/cases, what was measured, what the control vs experimental conditions were, and the specific numerical result
11. The thumbnailConcept must describe a SPECIFIC photographic scene (not abstract shapes or diagrams). Think editorial magazine photography. Describe camera angle, lighting, subject, mood. NEVER include any text elements.

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
        max_tokens: 7000,
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
          const imagePrompt = `${parsed.thumbnailConcept}. Photorealistic editorial photography style, cinematic lighting, shallow depth of field, 35mm lens. High-end magazine cover quality. Muted professional color palette with one accent color. CRITICAL: The image must contain ABSOLUTELY ZERO text, zero words, zero letters, zero numbers, zero symbols, zero typography of any kind. Pure visual imagery only.`;

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

      // Resolve book page screenshots for inline images
      if (parsed.sectionImages?.length > 0) {
        const weekPages = bookPagesUrls[String(weekData.week)] || [];
        parsed.sectionImages = parsed.sectionImages
          .map(img => {
            const pageData = weekPages[img.bookPageIndex];
            if (pageData && pageData.imageUrl) {
              return {
                afterParagraph: img.afterParagraph,
                imageUrl: pageData.imageUrl,
                caption: pageData.caption,
                book: pageData.book,
                page: pageData.page,
              };
            }
            return null;
          })
          .filter(Boolean);
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
