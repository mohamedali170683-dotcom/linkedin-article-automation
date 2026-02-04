import { NextResponse } from 'next/server';
import { getCurrentWeek, getWeekData } from '../../lib/calendar';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentWeek = getCurrentWeek();
    const weekData = getWeekData(currentWeek);

    console.log(`Running weekly cron for Week ${currentWeek}: ${weekData.topic}`);

    // Step 1: Generate the article
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000';
    const generateResponse = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week: currentWeek })
    });

    if (!generateResponse.ok) {
      throw new Error('Failed to generate article');
    }

    const generatedData = await generateResponse.json();
    const content = generatedData.content;

    // Step 2: Save to blob storage
    try {
      await fetch(`${baseUrl}/api/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week: currentWeek,
          topic: weekData.topic,
          content,
          generatedAt: new Date().toISOString()
        })
      });
    } catch (saveError) {
      console.error('Failed to save article to blob:', saveError);
    }

    // Step 3: Publish teaser posts via Late.dev
    const publishResponse = await fetch(`${baseUrl}/api/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkedinPost: content.teaserPost,
        twitterPost: content.twitterPost,
        hashtags: content.hashtags
      })
    });

    const publishResult = await publishResponse.json();

    return NextResponse.json({
      success: true,
      week: currentWeek,
      topic: weekData.topic,
      generatedAt: new Date().toISOString(),
      content: {
        title: content.title,
        subtitle: content.subtitle,
        article: content.article,
        hashtags: content.hashtags,
        citations: content.citations
      },
      publishStatus: publishResult,
      message: `Week ${currentWeek} content generated, saved, and teaser posts scheduled`
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { week } = await request.json();
    const weekData = getWeekData(week);

    if (!weekData) {
      return NextResponse.json({ error: 'Invalid week' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
    const generateResponse = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week })
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      throw new Error(`Generation failed: ${errorText}`);
    }

    const generatedData = await generateResponse.json();

    return NextResponse.json({
      success: true,
      ...generatedData
    });

  } catch (error) {
    console.error('Manual trigger error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
