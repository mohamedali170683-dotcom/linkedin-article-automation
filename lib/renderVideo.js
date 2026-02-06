/**
 * Video rendering utility using Remotion
 *
 * Note: Full server-side rendering requires:
 * 1. @remotion/renderer package (installed)
 * 2. Chrome/Chromium installed on the server
 * 3. Sufficient server resources (CPU/Memory)
 *
 * For Vercel deployment, we need to use Remotion Lambda or an external rendering service
 * because Vercel serverless functions have execution limits.
 *
 * Options:
 * A) Remotion Lambda (AWS) - Best for production, ~$0.01-0.05 per video
 * B) Render locally and upload - Good for development
 * C) Use a service like Creatomate or Shotstack - Easiest but more expensive
 */

// This function prepares the video data for rendering
export function prepareVideoData(title, content, charts, audioDuration) {
  // Split content into scenes (each scene = ~15-20 seconds of narration)
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  // Create scenes with ~100-150 words each (about 15-20 seconds of speaking)
  const scenes = [];
  let currentScene = '';
  let wordCount = 0;

  paragraphs.forEach((para, idx) => {
    const paraWords = para.split(' ').length;

    if (wordCount + paraWords > 120 && currentScene) {
      // Save current scene and start new one
      scenes.push({
        text: currentScene.trim(),
        chart: null, // Will assign charts below
      });
      currentScene = para;
      wordCount = paraWords;
    } else {
      currentScene += (currentScene ? '\n\n' : '') + para;
      wordCount += paraWords;
    }
  });

  // Don't forget the last scene
  if (currentScene) {
    scenes.push({
      text: currentScene.trim(),
      chart: null,
    });
  }

  // Assign charts to scenes (evenly distributed)
  if (charts && charts.length > 0) {
    const chartInterval = Math.floor(scenes.length / (charts.length + 1));
    charts.forEach((chart, i) => {
      const sceneIndex = Math.min((i + 1) * chartInterval, scenes.length - 1);
      if (scenes[sceneIndex]) {
        scenes[sceneIndex].chart = chart;
      }
    });
  }

  // Calculate frames based on audio duration (default 2 minutes if no audio)
  const durationSeconds = audioDuration || 120;
  const fps = 30;
  const durationInFrames = Math.ceil(durationSeconds * fps);

  return {
    title,
    scenes,
    durationInFrames,
    fps,
  };
}

// For development/testing: generate video metadata without actual rendering
export function generateVideoPreview(title, content, charts) {
  const videoData = prepareVideoData(title, content, charts);

  return {
    title: videoData.title,
    sceneCount: videoData.scenes.length,
    scenes: videoData.scenes.map((s, i) => ({
      index: i,
      textPreview: s.text.substring(0, 100) + '...',
      hasChart: !!s.chart,
    })),
    estimatedDuration: `${Math.ceil(videoData.durationInFrames / videoData.fps)} seconds`,
  };
}
