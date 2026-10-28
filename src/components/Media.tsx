import { StyleProp, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../lib/theme';

// A proof: a photo, or a looping muted video with the system controls.
export function ProofMedia({ uri, type, style, controls = true, autoPlay = true }: {
  uri: string; type: 'image' | 'video'; style?: StyleProp<ViewStyle>; controls?: boolean; autoPlay?: boolean;
}) {
  const t = useTheme();
  if (type === 'image') return <Image source={{ uri }} style={[{ backgroundColor: t.nuvola }, style as object]} contentFit="cover" transition={150} />;
  return <Video uri={uri} style={style} controls={controls} autoPlay={autoPlay} />;
}

function Video({ uri, style, controls, autoPlay }: { uri: string; style?: StyleProp<ViewStyle>; controls: boolean; autoPlay: boolean }) {
  const t = useTheme();
  const player = useVideoPlayer(uri, p => {
    p.loop = true;
    p.muted = true;
    if (autoPlay) p.play();
  });
  return (
    <View style={[{ backgroundColor: t.nuvola, overflow: 'hidden' }, style]}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls={controls} />
    </View>
  );
}
