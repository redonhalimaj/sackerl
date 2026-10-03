import { colors, nativeTypography, space } from '@sackerl/tokens';
import { Logo, PaperBag } from '@sackerl/ui';
import type { JSX } from 'react';
import { Platform, Text, View } from 'react-native';

const typography =
  Platform.OS === 'ios'
    ? nativeTypography.ios
    : Platform.OS === 'android'
      ? nativeTypography.android
      : nativeTypography.fallback;

export type ScreenScaffoldProps = {
  readonly eyebrow: string;
  readonly showBag?: boolean | undefined;
  readonly title: string;
};

export function ScreenScaffold({
  eyebrow,
  showBag = false,
  title,
}: ScreenScaffoldProps): JSX.Element {
  return (
    <View
      style={{
        backgroundColor: colors.bg,
        flex: 1,
        paddingHorizontal: space[5],
        paddingTop: 72,
      }}
    >
      <Logo />
      <View
        style={{
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingBottom: 92,
        }}
      >
        {showBag ? <PaperBag height={190} width={180} /> : null}
        <Text
          style={[
            typography.eyebrow,
            {
              color: colors.mute,
              marginTop: showBag ? space[4] : 0,
              textAlign: 'center',
            },
          ]}
        >
          {eyebrow}
        </Text>
        <Text
          style={[
            typography.title,
            {
              color: colors.ink,
              marginTop: space[2],
              textAlign: 'center',
            },
          ]}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}
