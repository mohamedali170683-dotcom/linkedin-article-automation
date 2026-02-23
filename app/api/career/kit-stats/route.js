import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const apiSecret = process.env.KIT_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json({ error: 'KIT_API_SECRET not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const broadcastId = searchParams.get('broadcastId');

    // If specific broadcast ID, get its stats
    if (broadcastId) {
      const res = await fetch(`https://api.convertkit.com/v3/broadcasts/${broadcastId}/stats?api_secret=${apiSecret}`);
      if (!res.ok) {
        return NextResponse.json({ error: `Kit API error (${res.status})` }, { status: 500 });
      }
      const data = await res.json();
      return NextResponse.json({ stats: data.broadcast });
    }

    // Otherwise, get recent broadcasts with stats
    const res = await fetch(`https://api.convertkit.com/v3/broadcasts?api_secret=${apiSecret}`);
    if (!res.ok) {
      return NextResponse.json({ error: `Kit API error (${res.status})` }, { status: 500 });
    }
    const data = await res.json();

    // Get subscriber count
    const subRes = await fetch(`https://api.convertkit.com/v3/subscribers?api_secret=${apiSecret}&sort_order=desc&page=1`);
    let subscriberCount = 0;
    if (subRes.ok) {
      const subData = await subRes.json();
      subscriberCount = subData.total_subscribers || 0;
    }

    return NextResponse.json({
      broadcasts: (data.broadcasts || []).slice(0, 10).map(b => ({
        id: b.id,
        subject: b.subject,
        createdAt: b.created_at,
        sentAt: b.send_at,
        stats: b.stats || null,
      })),
      subscriberCount,
    });
  } catch (error) {
    console.error('Kit stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
