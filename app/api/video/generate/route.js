import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prepareVideoData, generateVideoPreview } from '../../../../lib/renderVideo';

export async function POST(request) {
  try {
    const { title, content, charts } = await request.json();

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsKey) {
      return NextResponse.json({
        error: 'ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to your environment variables.'
      }, { status: 500 });
    }

    // Step 1: Create a condensed script for narration (2-3 min video = ~400-500 words)
    const script = createVideoScript(title, content);

    // Step 2: Generate voice narration with ElevenLabs
    console.log('Generating voice narration...');
    const audioBuffer = await generateVoice(script, elevenLabsKey);

    if (!audioBuffer) {
      return NextResponse.json({
        error: 'Failed to generate voice narration. Check your ElevenLabs API key and quota.'
      }, { status: 500 });
    }

    // Step 3: Save audio to blob storage
    const timestamp = Date.now();
    const audioBlob = await put(
      `video-audio/${timestamp}-narration.mp3`,
      audioBuffer,
      { access: 'public', contentType: 'audio/mpeg' }
    );

    // Step 4: Prepare video data (scenes, timing, etc.)
    const videoData = prepareVideoData(title, content, charts);
    const preview = generateVideoPreview(title, content, charts);

    // Step 5: For now, return audio + video preview
    // Full video rendering would require Remotion Lambda or similar service
    return NextResponse.json({
      success: true,
      audioUrl: audioBlob.url,
      script: script,
      videoPreview: preview,
      message: 'Voice narration generated successfully! Audio is ready for download.',
      // Instructions for manual video creation
      instructions: {
        step1: 'Download the audio file from audioUrl',
        step2: 'Use the script and scene breakdown to create slides',
        step3: 'Combine audio + slides in your video editor (CapCut, Canva, etc.)',
        note: 'Automated video rendering coming soon with Remotion Lambda integration',
      }
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function createVideoScript(title, content) {
  // Extract key paragraphs for a 2-3 minute narration
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  let script = '';

  // Opening with title
  script += `${title}. `;

  // Take first 2-3 paragraphs (intro) - clean markdown
  const intro = paragraphs.slice(0, 3)
    .map(p => p.replace(/\*\*/g, ''))
    .join(' ');
  script += intro + ' ';

  // Take key middle section
  const middleStart = Math.floor(paragraphs.length * 0.35);
  const middleEnd = Math.floor(paragraphs.length * 0.65);
  const middle = paragraphs.slice(middleStart, middleEnd)
    .map(p => p.replace(/\*\*/g, ''))
    .join(' ');
  script += middle + ' ';

  // Take conclusion (last 2 paragraphs)
  const conclusion = paragraphs.slice(-2)
    .map(p => p.replace(/\*\*/g, ''))
    .join(' ');
  script += conclusion;

  // Clean up the script
  script = script
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n/g, ' ')  // Remove newlines
    .trim();

  // Limit to ~450 words for a ~3 minute video
  const words = script.split(' ');
  if (words.length > 450) {
    script = words.slice(0, 450).join(' ');
    // Try to end on a complete sentence
    const lastPeriod = script.lastIndexOf('.');
    if (lastPeriod > script.length - 100) {
      script = script.substring(0, lastPeriod + 1);
    }
  }

  return script;
}

async function generateVoice(text, apiKey) {
  // Professional voice options:
  // - "ErXwobaYiN019PkySvjV" = Antoni (male, clear)
  // - "21m00Tcm4TlvDq8ikWAM" = Rachel (female, warm)
  // - "AZnzlk1XvdvUeBnXmlld" = Domi (female, confident)
  // - "EXAVITQu4vr4xnSDxMaL" = Bella (female, soft)
  // - "MF3mGyEYCl7XYWbV9V6O" = Elli (female, young)
  // - "TxGEqnHWrfWFTfGW9XjX" = Josh (male, deep)
  // - "pNInz6obpgDQGcFmaJgB" = Adam (male, deep)

  const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - deep, authoritative male voice

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
          model_id: 'eleven_multilingual_v2', // Best quality model
          voice_settings: {
            stability: 0.5,        // Balance between variation and consistency
            similarity_boost: 0.8, // How closely to match the original voice
            style: 0.2,           // Some expressiveness
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);

  } catch (error) {
    console.error('Voice generation error:', error);
    return null;
  }
}
