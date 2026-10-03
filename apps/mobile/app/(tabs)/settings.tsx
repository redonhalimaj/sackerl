import { colors, nativeTypography, space } from '@sackerl/tokens';
import { Logo } from '@sackerl/ui';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthSession } from '../../lib/auth-session';

const typography =
  Platform.OS === 'ios'
    ? nativeTypography.ios
    : Platform.OS === 'android'
      ? nativeTypography.android
      : nativeTypography.fallback;

export default function SettingsRoute() {
  const { session, signOut } = useAuthSession();
  const email = session?.user.email ?? 'Signed in';

  return (
    <View style={styles.screen}>
      <Logo />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.title}>Household settings</Text>
        <Text style={styles.copy}>{email}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void signOut();
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
    marginTop: space[6],
    paddingHorizontal: space[6],
    width: '100%',
  },
  buttonText: {
    color: colors.bg,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    lineHeight: typography.body.lineHeight,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 92,
  },
  copy: {
    color: colors.inkSoft,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
    marginTop: space[3],
    textAlign: 'center',
  },
  eyebrow: {
    color: colors.mute,
    fontFamily: typography.eyebrow.fontFamily,
    fontSize: typography.eyebrow.fontSize,
    fontWeight: typography.eyebrow.fontWeight,
    lineHeight: typography.eyebrow.lineHeight,
    textTransform: typography.eyebrow.textTransform,
  },
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
    paddingHorizontal: space[5],
    paddingTop: 72,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.title.fontFamily,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    lineHeight: typography.title.lineHeight,
    marginTop: space[2],
    textAlign: 'center',
  },
});
