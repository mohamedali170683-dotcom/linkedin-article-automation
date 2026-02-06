import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { title, subtitle, content, charts } = await request.json();

    const apiKey = process.env.BEEHIIV_API_KEY;
    const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

    if (!apiKey || !publicationId) {
      return NextResponse.json({
        error: 'Beehiiv API key or Publication ID not configured'
      }, { status: 500 });
    }

    // Build the post content with HTML formatting
    let htmlContent = '';

    // Add subtitle if present
    if (subtitle) {
      htmlContent += `<p><em>${subtitle}</em></p>`;
    }

    // Split content into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    // Calculate chart insertion points (evenly distributed)
    const chartInsertPoints = charts && charts.length > 0
      ? charts.map((_, i) => Math.floor((i + 1) * paragraphs.length / (charts.length + 1)))
      : [];

    // Build HTML with charts inserted
    paragraphs.forEach((para, idx) => {
      // Handle section headers (lines starting with **)
      if (para.startsWith('**') && para.endsWith('**')) {
        htmlContent += `<h2>${para.replace(/\*\*/g, '')}</h2>`;
      } else {
        htmlContent += `<p>${para}</p>`;
      }

      // Insert chart after this paragraph if needed
      const chartIdx = chartInsertPoints.indexOf(idx);
      if (chartIdx !== -1 && charts[chartIdx]) {
        htmlContent += `
          <figure style="text-align: center; margin: 24px 0;">
            <img src="${charts[chartIdx].imageUrl}" alt="${charts[chartIdx].caption || ''}" style="max-width: 100%; border-radius: 8px;" />
            <figcaption style="font-size: 12px; color: #666; margin-top: 8px; font-style: italic;">
              ${charts[chartIdx].caption || ''}
            </figcaption>
          </figure>
        `;
      }
    });

    // Create post via Beehiiv API
    const response = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        subtitle: subtitle || undefined,
        status: 'draft', // Create as draft first so user can review
        content_tags: ['behavioral-science', 'marketing'],
        body_content: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Beehiiv API error:', errorText);
      return NextResponse.json({
        error: 'Failed to publish to Beehiiv',
        details: errorText
      }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      postId: data.data?.id,
      webUrl: data.data?.web_url,
      status: data.data?.status,
      message: 'Article saved as draft in Beehiiv. Review and publish from your Beehiiv dashboard.'
    });

  } catch (error) {
    console.error('Beehiiv publish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
