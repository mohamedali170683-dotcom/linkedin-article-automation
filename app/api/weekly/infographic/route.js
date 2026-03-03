import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import {
  NotebookLMClient,
  ArtifactType,
  ArtifactState,
  SourceStatus,
  fetchInfographic,
} from 'notebooklm-kit';

export const maxDuration = 300;

const POLL_INTERVAL_SOURCE = 2000;
const POLL_TIMEOUT_SOURCE = 40000;
const POLL_INTERVAL_ARTIFACT = 4000;
const POLL_TIMEOUT_ARTIFACT = 240000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(step, detail) {
  console.log(`[infographic] ${step}: ${detail}`);
}

async function storeInfographic(weekNumber, imageBuffer, mimeType = 'image/png') {
  const prefix = `infographics/week-${weekNumber}`;

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
  const startTime = Date.now();

  try {
    const { weekNumber, articleContent, infographicBrief, dataPoints } = await request.json();

    if (!weekNumber || weekNumber < 1 || weekNumber > 52) {
      return NextResponse.json({ error: 'weekNumber must be 1-52' }, { status: 400 });
    }

    if (!infographicBrief) {
      return NextResponse.json(
        { error: 'infographicBrief is required. Generate the Tuesday pill first.' },
        { status: 400 }
      );
    }

    const authToken = process.env.NOTEBOOKLM_AUTH_TOKEN;
    const cookies = process.env.NOTEBOOKLM_COOKIES;

    if (!authToken || !cookies) {
      return NextResponse.json(
        { authError: true, error: 'NotebookLM credentials not configured.' },
        { status: 401 }
      );
    }

    const client = new NotebookLMClient({
      authToken,
      cookies,
      autoRefresh: false,
    });

    let notebookId = null;

    try {
      log('connect', 'Connecting to NotebookLM...');
      await client.connect();
      log('connect', `Done (${Date.now() - startTime}ms)`);

      // 1. Create notebook
      log('notebook', 'Creating notebook...');
      const notebook = await client.notebooks.create({
        title: `Catchlight Week ${weekNumber} Infographic`,
      });
      notebookId = notebook.projectId;
      log('notebook', `Created ${notebookId} (${Date.now() - startTime}ms)`);

      // 2. Build source content
      const sourceContent = buildSourceContent(infographicBrief, dataPoints, articleContent);
      log('source', `Content built: ${sourceContent.length} chars`);

      // 3. Add text source
      log('source', 'Adding text source...');
      const sourceResult = await client.sources.addFromText(notebookId, {
        title: `Week ${weekNumber} Infographic Data`,
        content: sourceContent,
      });
      const sourceId = typeof sourceResult === 'string' ? sourceResult : sourceResult.sourceId;
      log('source', `Added ${sourceId} (${Date.now() - startTime}ms)`);

      // 4. Wait for source processing
      log('source', 'Waiting for source processing...');
      const sourceReady = await waitForSource(client, notebookId, sourceId);
      log('source', `Ready: ${sourceReady} (${Date.now() - startTime}ms)`);

      if (!sourceReady) {
        return NextResponse.json(
          { error: 'Source processing timed out. Try again.' },
          { status: 504 }
        );
      }

      // 5. Create infographic artifact
      log('artifact', 'Creating infographic (portrait)...');
      const artifact = await client.artifacts.infographic.create(notebookId, {
        title: `Catchlight Light #${weekNumber} Infographic`,
        instructions: infographicBrief,
        customization: {
          orientation: 2, // Portrait
          levelOfDetail: 2, // Standard
        },
      });
      log('artifact', `Created ${artifact.artifactId}, state=${artifact.state} (${Date.now() - startTime}ms)`);

      // 6. Poll until artifact is ready
      let readyArtifact = artifact;
      if (artifact.state === ArtifactState.CREATING) {
        log('artifact', 'Polling for completion...');
        readyArtifact = await waitForArtifact(client, artifact.artifactId, notebookId);
      }

      if (!readyArtifact) {
        return NextResponse.json(
          { error: `Infographic generation timed out after ${Math.round((Date.now() - startTime) / 1000)}s.` },
          { status: 504 }
        );
      }

      if (readyArtifact.state === ArtifactState.FAILED) {
        return NextResponse.json(
          { error: 'NotebookLM failed to generate the infographic. Try modifying the brief.' },
          { status: 500 }
        );
      }

      log('artifact', `Ready! (${Date.now() - startTime}ms)`);

      // 7. Use fetchInfographic with downloadImage: true to get authenticated image bytes
      log('image', 'Fetching infographic image with auth cookies...');
      const rpcClient = await client.getRPCClient();
      const infographicData = await fetchInfographic(
        rpcClient,
        readyArtifact.artifactId,
        notebookId,
        { downloadImage: true, cookies }
      );

      log('image', `Got image: url=${!!infographicData.imageUrl}, data=${!!infographicData.imageData}, mime=${infographicData.mimeType}`);

      if (!infographicData.imageData) {
        // Fallback: try downloading from imageUrl with cookies as header
        if (infographicData.imageUrl) {
          log('image', 'imageData missing, trying authenticated fetch...');
          const imgRes = await fetch(infographicData.imageUrl, {
            headers: { 'Cookie': cookies },
          });

          if (imgRes.ok) {
            const ct = imgRes.headers.get('content-type') || 'image/png';
            const imgBuf = Buffer.from(await imgRes.arrayBuffer());
            log('image', `Fallback download: ${imgBuf.length} bytes, type=${ct}`);

            if (imgBuf.length > 1000 && !ct.includes('html')) {
              const blobUrl = await storeInfographic(weekNumber, imgBuf, ct);
              return NextResponse.json({ success: true, infographicUrl: blobUrl });
            }
          }
        }

        return NextResponse.json(
          { error: 'Could not download infographic image. The image URL requires Google auth.' },
          { status: 500 }
        );
      }

      // 8. Store image in Vercel Blob
      const mimeType = infographicData.mimeType || 'image/png';
      const imgBuffer = Buffer.from(infographicData.imageData);
      log('image', `Storing ${imgBuffer.length} bytes as ${mimeType}`);

      const blobUrl = await storeInfographic(weekNumber, imgBuffer, mimeType);
      log('done', `Stored at ${blobUrl} (total: ${Date.now() - startTime}ms)`);

      return NextResponse.json({
        success: true,
        infographicUrl: blobUrl,
      });

    } finally {
      if (notebookId) {
        try {
          await client.notebooks.delete(notebookId);
          log('cleanup', 'Notebook deleted');
        } catch (cleanupErr) {
          log('cleanup', `Failed: ${cleanupErr.message}`);
        }
      }
      client.dispose();
    }

  } catch (error) {
    console.error('Infographic generation failed:', error);

    const msg = error.message || '';
    if (msg.includes('401') || msg.includes('403') || msg.includes('auth') || msg.includes('Unauthorized')) {
      return NextResponse.json(
        { authError: true, error: 'NotebookLM auth failed. Refresh tokens in Vercel env vars.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: msg || 'Unknown error', elapsed: `${Date.now() - startTime}ms` },
      { status: 500 }
    );
  }
}

function buildSourceContent(brief, dataPoints, articleContent) {
  let content = `INFOGRAPHIC BRIEF:\n${brief}\n\n`;

  if (dataPoints?.length > 0) {
    content += `KEY DATA POINTS:\n${dataPoints.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\n`;
  }

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
      if (src && src.status !== SourceStatus.PROCESSING && src.status !== SourceStatus.UNKNOWN) {
        return src.status === SourceStatus.READY;
      }
    } catch (e) {
      log('source-poll', `Error: ${e.message}`);
    }
    await sleep(POLL_INTERVAL_SOURCE);
  }

  return false;
}

async function waitForArtifact(client, artifactId, notebookId) {
  const start = Date.now();
  let pollCount = 0;

  while (Date.now() - start < POLL_TIMEOUT_ARTIFACT) {
    try {
      const artifact = await client.artifacts.get(artifactId, notebookId);
      pollCount++;
      log('artifact-poll', `#${pollCount} state=${artifact.state} (${Date.now() - start}ms)`);

      if (artifact.state !== ArtifactState.CREATING) {
        return artifact;
      }
    } catch (e) {
      pollCount++;
      log('artifact-poll', `#${pollCount} Error: ${e.message}`);
    }
    await sleep(POLL_INTERVAL_ARTIFACT);
  }

  return null;
}
