import { AbsoluteFill, Audio, Img, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

// Main video composition
export const ArticleVideo = ({ title, scenes, audioUrl, charts }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate scene durations based on total duration
  const sceneCount = scenes.length;
  const framesPerScene = Math.floor(durationInFrames / sceneCount);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
        }}
      />

      {/* Audio track */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* Title intro sequence */}
      <Sequence from={0} durationInFrames={fps * 4}>
        <TitleScene title={title} />
      </Sequence>

      {/* Content scenes */}
      {scenes.map((scene, index) => (
        <Sequence
          key={index}
          from={fps * 4 + index * framesPerScene}
          durationInFrames={framesPerScene}
        >
          <ContentScene
            text={scene.text}
            chart={scene.chart}
            sceneIndex={index}
          />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence from={durationInFrames - fps * 3} durationInFrames={fps * 3}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

// Title scene component
const TitleScene = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const scale = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            color: 'white',
            lineHeight: 1.2,
            maxWidth: 1000,
            textShadow: '0 4px 30px rgba(0,0,0,0.5)',
          }}
        >
          {title}
        </h1>
        <div
          style={{
            marginTop: 40,
            width: 100,
            height: 4,
            backgroundColor: '#3b82f6',
            margin: '40px auto 0',
            borderRadius: 2,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Content scene component
const ContentScene = ({ text, chart, sceneIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const slideIn = interpolate(frame, [0, fps * 0.5], [50, 0], {
    extrapolateRight: 'clamp',
  });

  const chartOpacity = interpolate(frame, [fps * 0.5, fps * 0.8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        padding: 80,
        flexDirection: chart ? 'row' : 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 60,
      }}
    >
      {/* Text content */}
      <div
        style={{
          flex: 1,
          opacity: textOpacity,
          transform: `translateY(${slideIn}px)`,
        }}
      >
        <p
          style={{
            fontSize: 36,
            color: 'white',
            lineHeight: 1.6,
            maxWidth: chart ? 600 : 900,
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}
        >
          {text}
        </p>
      </div>

      {/* Chart image if provided */}
      {chart && (
        <div
          style={{
            flex: 1,
            opacity: chartOpacity,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            }}
          >
            <Img
              src={chart.imageUrl}
              style={{
                maxWidth: 500,
                maxHeight: 400,
                objectFit: 'contain',
              }}
            />
            {chart.caption && (
              <p
                style={{
                  fontSize: 14,
                  color: '#666',
                  textAlign: 'center',
                  marginTop: 12,
                  fontStyle: 'italic',
                }}
              >
                {chart.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Outro scene
const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: 32,
            color: '#94a3b8',
            marginBottom: 20,
          }}
        >
          Subscribe for more insights
        </p>
        <p
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: 'white',
          }}
        >
          Behavioral Science & Marketing
        </p>
      </div>
    </AbsoluteFill>
  );
};
