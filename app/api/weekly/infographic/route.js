import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import { NotebookLMClient, ArtifactType, ArtifactState } from 'notebooklm-kit';

export const maxDuration = 120;

const POLL_INTERVAL_SOURCE = 2000;
const POLL_TIMEOUT_SOURCE = 30000;
const POLL_INTERVAL_ARTIFACT = 3000;
const POLL_TIMEOUT_ARTIFACT = 90000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function storeInfographic(weekNumber, imageBuffer, mimeType = 'image/png') {
  const prefix = `infographics/week-${weekNumber}`;

  // Clean up old infographic blobs for this week
  try {
    const { blobs } = await list({ prefix });
    for (const blob of blobs) await del(blob.url);
  } catch {}

  const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
  const blob = await put(`${prefix}.${ext}`, imageBuffer, {
    access: 'public',
    contentType: mimeType,
  });

  return blob.url;
}

export async function POST(request) {
  try {
    const { weekNumber, articleContent, infographicBrief, dataPoints } = await request.json();

    // Validate inputs
    if (!weekNumber || weekNumber < 1 || weekNumber > 52) {
      return NextResponse.json({ error: 'weekNumber must be 1-52' }, { status: 400 });
    }

    if (!infographicBrief) {
      return NextResponse.json(
        { error: 'infographicBrief is required. Generate the Tuesday pill first.' },
        { status: 400 }
      );
    }

    // Check NotebookLM credentials
    const authToken = process.env.NOTEBOOKLM_AUTH_TOKEN;
    const cookies = process.env.NOTEBOOKLM_COOKIES;

    if (!authToken || !cookies) {
      return NextResponse.json(
        {
          authError: true,
          error: 'NotebookLM credentials not configured. Set NOTEBOOKLM_AUTH_TOKEN and NOTEBOOKLM_COOKIES in your environment variables.',
        },
        { status: 401 }
      );
    }

    // Initialize NotebookLM client
    const client = new NotebookLMClient({
      authToken,
      cookies,
      autoRefresh: false, // Short-lived serverless, no need for refresh
    });

    let notebookId = null;

    try {
      await client.connect();

      // 1. Create notebook
      const notebook = await client.notebooks.create({
        title: `Catchlight Week ${weekNumber} Infographic`,
      });
      notebookId = notebook.projectId;

      // 2. Build source content from brief + data points + article excerpt
      const sourceContent = buildSourceContent(infographicBrief, dataPoints, articleContent);

      // 3. Add text source
      const source = await client.sources.addText(notebookId, {
        title: `Week ${weekNumber} Infographic Data`,
        content: sourceContent,
      });

      // 4. Wait for source processing
      const sourceReady = await waitForSource(client, notebookId, source.sourceId);
      if (!sourceReady) {
        return NextResponse.json(
          { error: 'Source processing timed out. Try again.' },
          { status: 504 }
        );
      }

      // 5. Create infographic artifact (portrait for LinkedIn)
      const artifact = await client.artifacts.infographic.create(notebookId, {
        title: `Catchlight Light #${weekNumber} Infographic`,
        instructions: infographicBrief,
        customization: {
          orientation: 2, // Portrait (optimal for LinkedIn feed)
          levelOfDetail: 2, // Standard
        },
      });

      // 6. Poll until artifact is ready
      const readyArtifact = await waitForArtifact(
        client, artifact.artifactId, notebookId
      );

      if (!readyArtifact) {
        return NextResponse.json(
          { error: 'Infographic generation timed out (~90s). Try again.' },
          { status: 504 }
        );
      }

      if (readyArtifact.state === ArtifactState.FAILED) {
        return NextResponse.json(
          { error: 'NotebookLM failed to generate the infographic. Try modifying the brief.' },
          { status: 500 }
        );
      }

      // 7. Get infographic image data
      const imageUrl = readyArtifact.imageUrl;
      if (!imageUrl) {
        return NextResponse.json(
          { error: 'No infographic image URL returned by NotebookLM.' },
          { status: 500 }
        );
      }

      // 8. Download image and store in Vercel Blob
      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) {
        return NextResponse.json(
          { error: `Failed to download infographic image: ${imgResponse.status}` },
          { status: 500 }
        );
      }

      const contentType = imgResponse.headers.get('content-type') || 'image/png';
      const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
      const blobUrl = await storeInfographic(weekNumber, imgBuffer, contentType);

      return NextResponse.json({
        success: true,
        infographicUrl: blobUrl,
      });

    } finally {
      // Cleanup: delete notebook to keep account tidy
      if (notebookId) {
        try {
          await client.notebooks.delete(notebookId);
        } catch (cleanupErr) {
          console.error('Notebook cleanup failed (non-blocking):', cleanupErr.message);
        }
      }
      client.dispose();
    }

  } catch (error) {
    console.error('Infographic generation failed:', error);

    // Detect auth errors
    const msg = error.message || '';
    if (msg.includes('401') || msg.includes('403') || msg.includes('auth') || msg.includes('Unauthorized')) {
      return NextResponse.json(
        {
          authError: true,
          error: 'NotebookLM authentication failed. Your tokens may have expired. Refresh NOTEBOOKLM_AUTH_TOKEN and NOTEBOOKLM_COOKIES from your browser.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function buildSourceContent(brief, dataPoints, articleContent) {
  let content = `INFOGRAPHIC BRIEF:\n${brief}\n\n`;

  if (dataPoints?.length > 0) {
    content += `KEY DATA POINTS:\n${dataPoints.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\n`;
  }

  // Include article excerpt (truncated to avoid source size limits)
  if (articleContent) {
    const excerpt = articleContent.substring(0, 4000);
    content += `SOURCE ARTICLE (excerpt):\n${excerpt}`;
  }

  return content;
}

async function waitForSource(client, notebookId, sourceId) {
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT_SOURCE) {
    try {
      const sources = await client.sources.list(notebookId);
      const src = sources.find(s => s.sourceId === sourceId);
      if (src && src.status !== 'PROCESSING' && src.status !== 'PENDING') {
        return true;
      }
    } catch {}
    await sleep(POLL_INTERVAL_SOURCE);
  }

  return false;
}

async function waitForArtifact(client, artifactId, notebookId) {
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT_ARTIFACT) {
    try {
      const artifact = await client.artifacts.get(artifactId, notebookId);
      if (artifact.state !== ArtifactState.CREATING) {
        return artifact;
      }
    } catch {}
    await sleep(POLL_INTERVAL_ARTIFACT);
  }

  return null;
}
