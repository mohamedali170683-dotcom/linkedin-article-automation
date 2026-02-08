import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { title, subtitle, content, charts } = await request.json();

    const apiSecret = process.env.KIT_API_SECRET;

    if (!apiSecret) {
      return NextResponse.json({
        error: 'KIT_API_SECRET not configured in environment variables'
      }, { status: 500 });
    }

    // Build HTML content for the broadcast
    let htmlContent = '';

    // Add subtitle if present
    if (subtitle) {
      htmlContent += `<p style="font-style: italic; color: #666; font-size: 18px; margin-bottom: 24px;">${escapeHtml(subtitle)}</p>`;
    }

    // Split content into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    // Calculate chart insertion points (evenly distributed)
    const chartInsertPoints = charts && charts.length > 0
      ? charts.map((_, i) => Math.floor((i + 1) * paragraphs.length / (charts.length + 1)))
      : [];

    // Build HTML with charts inserted
    paragraphs.forEach((para, idx) => {
      // Handle section headers (lines starting and ending with **)
      if (para.startsWith('**') && para.endsWith('**')) {
        const headerText = para.replace(/\*\*/g, '');
        htmlContent += `<h2 style="font-size: 22px; font-weight: bold; margin-top: 32px; margin-bottom: 16px; color: #1a1a1a;">${escapeHtml(headerText)}</h2>`;
      } else {
        // Regular paragraph - handle inline bold
        let processedPara = escapeHtml(para);
        // Convert **text** to <strong>text</strong> after escaping
        processedPara = processedPara.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        htmlContent += `<p style="font-size: 16px; line-height: 1.7; margin-bottom: 16px; color: #333;">${processedPara}</p>`;
      }

      // Insert chart after this paragraph if needed
      const chartIdx = chartInsertPoints.indexOf(idx);
      if (chartIdx !== -1 && charts[chartIdx]) {
        const chart = charts[chartIdx];
        htmlContent += `
          <div style="text-align: center; margin: 32px 0;">
            <img src="${chart.imageUrl}" alt="${escapeHtml(chart.caption || '')}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
            ${chart.caption ? `<p style="font-size: 13px; color: #888; margin-top: 12px; font-style: italic;">${escapeHtml(chart.caption)}</p>` : ''}
          </div>
        `;
      }
    });

    // Create broadcast via Kit API
    // https://developers.kit.com/api-reference/v3/broadcasts
    const response = await fetch('https://api.convertkit.com/v3/broadcasts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_secret: apiSecret,
        subject: title,
        content: htmlContent,
        description: subtitle || `Article: ${title}`,
        // Not setting send_at means it creates a draft
      }),
    });

    const responseText = await response.text();
    console.log('Kit API Response:', response.status, responseText);

    if (!response.ok) {
      let errorMessage = `Kit API error (${response.status})`;
      let errorDetails = '';

      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = JSON.stringify(errorData, null, 2);
      } catch (e) {
        errorDetails = responseText;
      }

      console.error('Kit error details:', errorDetails);

      return NextResponse.json({
        error: errorMessage,
        details: errorDetails,
        status: response.status,
        hint: response.status === 401 ? 'Check your KIT_API_SECRET' :
              response.status === 403 ? 'API secret may be invalid' :
              response.status === 400 ? 'Request format issue' : null
      }, { status: 500 });
    }

    const data = JSON.parse(responseText);
    const broadcast = data.broadcast;

    return NextResponse.json({
      success: true,
      broadcastId: broadcast?.id,
      subject: broadcast?.subject,
      status: 'draft',
      message: 'Article saved as draft in Kit! Go to your Kit dashboard to review and send.',
      dashboardUrl: 'https://app.kit.com/broadcasts'
    });

  } catch (error) {
    console.error('Kit publish error:', error);
    return NextResponse.json({
      error: error.message,
      hint: 'Check server logs for more details'
    }, { status: 500 });
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
