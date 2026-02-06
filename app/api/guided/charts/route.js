import { NextResponse } from 'next/server';
import bookPagesUrls from '../../../lib/book-pages-urls.json';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');

  if (!week) {
    return NextResponse.json({ error: 'Week parameter required' }, { status: 400 });
  }

  const charts = bookPagesUrls[String(week)] || [];

  return NextResponse.json({ charts });
}
