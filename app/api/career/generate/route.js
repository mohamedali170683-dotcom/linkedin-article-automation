import { NextResponse } from 'next/server';
import { MOHAMED_CONTEXT, PILLARS } from '../../../lib/career-data';

export async function POST(request) {
  try {
    const { title, pillar, requirement, targetRoles } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const pillarInfo = PILLARS.find(p => p.id === pillar);

    let jdContext = '';
    if (targetRoles && targetRoles.length > 0) {
      jdContext = `\n\nThis content should also support applications to these target roles:\n${targetRoles.map(r => `- ${r.title} at ${r.company}: requires ${r.requirements?.slice(0, 3).join(', ')}`).join('\n')}`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: `You are a LinkedIn ghostwriter for Mohamed Ali Mohamed. ${MOHAMED_CONTEXT}

Write in first person, 500-800 words. No hashtags in body text. End with a question to drive engagement. After the post body, include a [HASHTAGS] section with 3-5 relevant hashtags. Make every claim specific with numbers or named examples.`,
        messages: [{
          role: 'user',
          content: `Write a LinkedIn post titled: "${title}"

Content pillar: ${pillarInfo?.label || pillar}
Addresses pattern requirement: ${requirement || ''}
Pillar description: ${pillarInfo?.description || ''}

Use real experiences from Mohamed's background. Be specific: name the clients (Deutsche Bank, Nestle, IKEA, Allianz), reference the AI products by name, use real numbers.${jdContext}`,
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Generate API error:', errorText);
      return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content.find(b => b.type === 'text')?.text || '';
    return NextResponse.json({ draft: text });
  } catch (error) {
    console.error('Career content generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
