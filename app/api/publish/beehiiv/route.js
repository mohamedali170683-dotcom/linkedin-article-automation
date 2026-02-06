import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { title, subtitle, content, charts } = await request.json();

    const apiKey = process.env.BEEHIIV_API_KEY;
    const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

    if (!apiKey) {
      return NextResponse.json({
        error: 'BEEHIIV_API_KEY not configured in environment variables'
      }, { status: 500 });
    }

    if (!publicationId) {
      return NextResponse.json({
        error: 'BEEHIIV_PUBLICATION_ID not configured in environment variables'
      }, { status: 500 });
    }

    // Build the post content with HTML formatting
    let htmlContent = '';

    // Add subtitle if present
    if (subtitle) {
      htmlContent += `<p style="font-style: italic; color: #666; font-size: 18px;">${subtitle}</p>`;
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
        const headerText = para.replace(/\*\*/g, '');
        htmlContent += `<h2 style="font-size: 24px; font-weight: bold; margin-top: 32px; margin-bottom: 16px;">${headerText}</h2>`;
      } else {
        // Regular paragraph - escape HTML entities
        const escapedPara = para
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); // Bold text
        htmlContent += `<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">${escapedPara}</p>`;
      }

      // Insert chart after this paragraph if needed
      const chartIdx = chartInsertPoints.indexOf(idx);
      if (chartIdx !== -1 && charts[chartIdx]) {
        const chart = charts[chartIdx];
        htmlContent += `
          <div style="text-align: center; margin: 32px 0;">
            <img src="${chart.imageUrl}" alt="${chart.caption || ''}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
            ${chart.caption ? `<p style="font-size: 12px; color: #888; margin-top: 8px; font-style: italic;">${chart.caption}</p>` : ''}
          </div>
        `;
      }
    });

    // Prepare the request body according to Beehiiv API
    const requestBody = {
      title: title,
      status: 'draft', // Create as draft so user can review
      content_tags: ['behavioral-science', 'marketing'],
      body_content: htmlContent,
    };

    console.log('Beehiiv API Request:', {
      url: `https://api.beehiiv.com/v2/publications/${publicationId}/posts`,
      body: { ...requestBody, body_content: '[HTML content...]' }
    });

    // Create post via Beehiiv API
    const response = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('Beehiiv API Response:', response.status, responseText);

    if (!response.ok) {
      let errorMessage = `Beehiiv API error (${response.status})`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }

      return NextResponse.json({
        error: errorMessage,
        status: response.status,
        hint: response.status === 401 ? 'Check your BEEHIIV_API_KEY' :
              response.status === 404 ? 'Check your BEEHIIV_PUBLICATION_ID' :
              response.status === 403 ? 'API key may not have write permissions. Check Beehiiv dashboard.' : null
      }, { status: 500 });
    }

    const data = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      postId: data.data?.id,
      webUrl: data.data?.web_url,
      status: data.data?.status,
      message: 'Article saved as draft in Beehiiv! Go to your Beehiiv dashboard to review and send.'
    });

  } catch (error) {
    console.error('Beehiiv publish error:', error);
    return NextResponse.json({
      error: error.message,
      hint: 'Check server logs for more details'
    }, { status: 500 });
  }
}
