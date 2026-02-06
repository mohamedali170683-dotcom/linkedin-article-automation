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

    // Build content blocks (Beehiiv's preferred format)
    const blocks = [];

    // Add subtitle as first paragraph if present
    if (subtitle) {
      blocks.push({
        type: 'paragraph',
        content: subtitle
      });
    }

    // Split content into paragraphs and create blocks
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    // Calculate chart insertion points (evenly distributed)
    const chartInsertPoints = charts && charts.length > 0
      ? charts.map((_, i) => Math.floor((i + 1) * paragraphs.length / (charts.length + 1)))
      : [];

    paragraphs.forEach((para, idx) => {
      // Handle section headers (lines starting and ending with **)
      if (para.startsWith('**') && para.endsWith('**')) {
        blocks.push({
          type: 'heading',
          level: 2,
          content: para.replace(/\*\*/g, '')
        });
      } else {
        // Regular paragraph - handle inline bold
        const cleanPara = para.replace(/\*\*(.+?)\*\*/g, '$1');
        blocks.push({
          type: 'paragraph',
          content: cleanPara
        });
      }

      // Insert chart after this paragraph if needed
      const chartIdx = chartInsertPoints.indexOf(idx);
      if (chartIdx !== -1 && charts[chartIdx]) {
        const chart = charts[chartIdx];
        blocks.push({
          type: 'image',
          url: chart.imageUrl,
          caption: chart.caption || ''
        });
      }
    });

    // Prepare the request body according to Beehiiv API v2
    // Using minimal required fields first
    const requestBody = {
      title: title,
      status: 'draft',
      blocks: blocks
    };

    console.log('Beehiiv API Request:', {
      url: `https://api.beehiiv.com/v2/publications/${publicationId}/posts`,
      bodyPreview: {
        title: requestBody.title,
        status: requestBody.status,
        blocksCount: blocks.length
      }
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
      let errorDetails = '';

      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = JSON.stringify(errorData, null, 2);
      } catch (e) {
        errorDetails = responseText;
      }

      console.error('Beehiiv error details:', errorDetails);

      return NextResponse.json({
        error: errorMessage,
        details: errorDetails,
        status: response.status,
        hint: response.status === 401 ? 'Check your BEEHIIV_API_KEY' :
              response.status === 404 ? 'Check your BEEHIIV_PUBLICATION_ID' :
              response.status === 403 ? 'API key may not have write permissions' :
              response.status === 400 ? 'Request format issue - check server logs' : null
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
