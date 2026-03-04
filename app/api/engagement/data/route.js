import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

// Vercel Blob appends a random hash to pathnames (e.g. "key-aBcD.json"),
// so the list prefix must NOT include the extension.
function blobPrefix(week) {
  return `engagement-${week}`;
}

async function getEngagementData(week) {
  try {
    const prefix = blobPrefix(week);
    const { blobs } = await list({ prefix });
    if (blobs.length > 0) {
      const response = await fetch(blobs[0].url);
      return await response.json();
    }
  } catch (e) {
    console.error(`Failed to read engagement data for ${week}:`, e);
  }
  return null;
}

async function saveEngagementData(week, data) {
  const prefix = blobPrefix(week);
  try {
    const { blobs } = await list({ prefix });
    for (const blob of blobs) await del(blob.url);
  } catch {}
  await put(`${prefix}.json`, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');

  if (!week) {
    return NextResponse.json({ error: 'week param required (e.g. 2026-W10)' }, { status: 400 });
  }

  const data = await getEngagementData(week);
  if (data) {
    return NextResponse.json({ posts: data.posts || [], week: data.week || week });
  }
  return NextResponse.json({ posts: null });
}

export async function POST(request) {
  try {
    const { week, posts } = await request.json();

    if (!week) {
      return NextResponse.json({ error: 'week is required' }, { status: 400 });
    }
    if (!Array.isArray(posts)) {
      return NextResponse.json({ error: 'posts must be an array' }, { status: 400 });
    }

    await saveEngagementData(week, { posts, week, count: posts.length });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save engagement data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
