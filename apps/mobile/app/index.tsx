import { colors, nativeTypography, space } from '@sackerl/tokens';
import { Platform, Text, View } from 'react-native';

const typography =
  Platform.OS === 'ios'
    ? nativeTypography.ios
    : Platform.OS === 'android'
      ? nativeTypography.android
      : nativeTypography.fallback;

export default function IndexRoute() {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: colors.bg,
        flex: 1,
        justifyContent: 'center',
        padding: space[6],
      }}
    >
      <Text
        style={[
          typography.title,
          {
            color: colors.ink,
          },
        ]}
      >
        Sackerl
      </Text>
      <Text
        style={[
          typography.body,
          {
            color: colors.mute,
            marginTop: space[2],
            textAlign: 'center',
          },
        ]}
      >
        Framework scaffold ready. Product UI starts after the design handoff.
      </Text>
    </View>
  );
}
