import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { linkedinPost, twitterPost, hashtags, imageUrl } = await request.json();

    const lateApiKey = process.env.LATE_API_KEY;
    const linkedinAccountId = process.env.LATE_LINKEDIN_ACCOUNT_ID;
    const twitterAccountId = process.env.LATE_TWITTER_ACCOUNT_ID;

    if (!lateApiKey) {
      return NextResponse.json({ error: 'Late.dev API key not configured' }, { status: 500 });
    }

    const results = {
      linkedin: null,
      twitter: null
    };

    const platforms = [];

    if (linkedinAccountId && linkedinPost) {
      const fullPost = `${linkedinPost}\n\n${hashtags.join(' ')}`;
      platforms.push({
        platform: 'linkedin',
        accountId: linkedinAccountId,
        customContent: fullPost
      });
    }

    if (twitterAccountId && twitterPost) {
      platforms.push({
        platform: 'twitter',
        accountId: twitterAccountId,
        customContent: twitterPost
      });
    }

    if (platforms.length === 0) {
      return NextResponse.json({
        error: 'No platform accounts configured. Set LATE_LINKEDIN_ACCOUNT_ID and/or LATE_TWITTER_ACCOUNT_ID.'
      }, { status: 400 });
    }

    const postBody = {
      content: linkedinPost || twitterPost,
      platforms,
      publishNow: false,
      hashtags: hashtags || [],
    };

    // Include image in post if available
    if (imageUrl) {
      postBody.media = [{ url: imageUrl, type: 'image' }];
    }

    const response = await fetch('https://getlate.dev/api/v1/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lateApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Late.dev API error:', errorText);
      return NextResponse.json({ error: 'Failed to schedule posts via Late.dev' }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      results: data,
      message: 'Posts scheduled via Late.dev'
    });

  } catch (error) {
    console.error('Late.dev publish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
