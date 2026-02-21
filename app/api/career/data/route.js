import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

const BLOB_KEY = 'career-data.json';

async function getData() {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY });
    if (blobs.length > 0) {
      const response = await fetch(blobs[0].url);
      return await response.json();
    }
  } catch (e) {
    console.error('Failed to read career data:', e);
  }
  return { apps: [], metrics: {}, posts: {} };
}

async function saveDataToBlob(data) {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY });
    for (const blob of blobs) await del(blob.url);
  } catch {}
  await put(BLOB_KEY, JSON.stringify(data), {
    access: 'public',
    contentType: 'application/json',
  });
}

export async function GET() {
  const data = await getData();
  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const current = await getData();
    const updated = { ...current, ...body };
    await saveDataToBlob(updated);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save career data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
