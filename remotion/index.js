import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import { ArticleVideo } from './ArticleVideo';

// Default props for preview
const defaultProps = {
  title: 'The Science of Decision Making',
  scenes: [
    { text: 'Your brain makes thousands of decisions every day, but only a tiny fraction involve conscious thought.', chart: null },
    { text: 'Research shows that System 1 thinking, our automatic mode, handles 95% of our daily choices.', chart: null },
    { text: 'For marketers, this means emotional and intuitive appeals often outperform rational arguments.', chart: null },
  ],
  audioUrl: null,
  charts: [],
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ArticleVideo"
        component={ArticleVideo}
        durationInFrames={30 * 60} // 60 seconds at 30fps, will be adjusted based on audio
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />
    </>
  );
};

registerRoot(RemotionRoot);
