import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');

    const { blobs } = await list({ prefix: 'articles/' });

    if (week) {
      const blob = blobs.find(b => b.pathname === `articles/week-${week}.json`);
      if (!blob) {
        return NextResponse.json({ found: false }, { status: 404 });
      }
      const response = await fetch(blob.url);
      const data = await response.json();
      return NextResponse.json({ found: true, article: data });
    }

    const summaries = blobs.map(b => ({
      pathname: b.pathname,
      uploadedAt: b.uploadedAt,
      week: b.pathname.match(/week-(\d+)/)?.[1]
    }));

    return NextResponse.json({ articles: summaries });
  } catch (error) {
    console.error('Articles fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { week, content, topic, generatedAt } = body;

    if (!week || !content) {
      return NextResponse.json({ error: 'Missing week or content' }, { status: 400 });
    }

    const blob = await put(
      `articles/week-${week}.json`,
      JSON.stringify({ week, topic, content, generatedAt }),
      { access: 'public', addRandomSuffix: false }
    );

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error('Article save error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
