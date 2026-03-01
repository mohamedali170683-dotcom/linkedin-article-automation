import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

function blobKey(week) {
  return `catchlight-weekly-${week}.json`;
}

async function getWeekData(week) {
  try {
    const key = blobKey(week);
    const { blobs } = await list({ prefix: key });
    if (blobs.length > 0) {
      const response = await fetch(blobs[0].url);
      return await response.json();
    }
  } catch (e) {
    console.error(`Failed to read weekly data for week ${week}:`, e);
  }
  return null;
}

async function saveWeekData(week, data) {
  const key = blobKey(week);
  try {
    const { blobs } = await list({ prefix: key });
    for (const blob of blobs) await del(blob.url);
  } catch {}
  await put(key, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const week = parseInt(searchParams.get('week'), 10);

  if (!week || week < 1 || week > 52) {
    return NextResponse.json({ error: 'Week must be 1-52' }, { status: 400 });
  }

  const data = await getWeekData(week);
  if (data) {
    return NextResponse.json({ exists: true, data });
  }
  return NextResponse.json({ exists: false });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { weekNumber } = body;

    if (!weekNumber || weekNumber < 1 || weekNumber > 52) {
      return NextResponse.json({ error: 'weekNumber must be 1-52' }, { status: 400 });
    }

    const current = await getWeekData(weekNumber) || {
      weekNumber,
      lightTitle: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      article: null,
      promoPost: null,
      pills: [],
    };

    const updated = {
      ...current,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Deep merge article, promoPost, pills if they exist in both
    if (body.article && current.article) {
      updated.article = { ...current.article, ...body.article };
    }
    if (body.promoPost && current.promoPost) {
      updated.promoPost = { ...current.promoPost, ...body.promoPost };
    }

    await saveWeekData(weekNumber, updated);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save weekly data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
