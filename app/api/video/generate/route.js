import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request) {
  try {
    const { title, content, charts } = await request.json();

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsKey) {
      return NextResponse.json({
        error: 'ElevenLabs API key not configured'
      }, { status: 500 });
    }

    // Step 1: Create a condensed script for narration (2-3 min video = ~400-500 words)
    const script = createVideoScript(title, content);

    // Step 2: Generate voice narration with ElevenLabs
    const audioBuffer = await generateVoice(script, elevenLabsKey);

    if (!audioBuffer) {
      return NextResponse.json({
        error: 'Failed to generate voice narration'
      }, { status: 500 });
    }

    // Step 3: Save audio to blob storage
    const audioBlob = await put(
      `video-audio/${Date.now()}-narration.mp3`,
      audioBuffer,
      { access: 'public', contentType: 'audio/mpeg' }
    );

    // Step 4: For now, return audio URL
    // Full video rendering with Remotion will be added next
    return NextResponse.json({
      success: true,
      audioUrl: audioBlob.url,
      script: script,
      message: 'Voice narration generated! Full video rendering coming soon.',
      // Future: videoUrl will be returned when Remotion is integrated
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function createVideoScript(title, content) {
  // Extract key paragraphs for a 2-3 minute narration
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  // Take intro, a few middle sections, and conclusion
  // Aim for ~400 words (about 2.5 minutes at speaking pace)
  let script = '';

  // Opening
  script += `${title}. `;

  // Take first 2-3 paragraphs (intro)
  const intro = paragraphs.slice(0, 3).join(' ');
  script += intro + ' ';

  // Take key middle section (look for section headers or just middle content)
  const middleStart = Math.floor(paragraphs.length * 0.4);
  const middleEnd = Math.floor(paragraphs.length * 0.6);
  const middle = paragraphs.slice(middleStart, middleEnd).join(' ');
  script += middle + ' ';

  // Take conclusion (last 2 paragraphs)
  const conclusion = paragraphs.slice(-2).join(' ');
  script += conclusion;

  // Clean up the script
  script = script
    .replace(/\*\*/g, '') // Remove markdown bold
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Limit to ~500 words for a reasonable video length
  const words = script.split(' ');
  if (words.length > 500) {
    script = words.slice(0, 500).join(' ') + '...';
  }

  return script;
}

async function generateVoice(text, apiKey) {
  // Use a professional voice - "Antoni" is a good default male voice
  // Other options: "Rachel" (female), "Domi" (female), "Bella" (female)
  const voiceId = 'ErXwobaYiN019PkySvjV'; // Antoni - clear, professional male voice

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);

  } catch (error) {
    console.error('Voice generation error:', error);
    return null;
  }
}
