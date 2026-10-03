import { colors, nativeFont, nativeTypography, space } from '@sackerl/tokens';
import { Logo, PaperBag } from '@sackerl/ui';
import { useRouter } from 'expo-router';
import type { JSX } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const typography =
  Platform.OS === 'ios'
    ? nativeTypography.ios
    : Platform.OS === 'android'
      ? nativeTypography.android
      : nativeTypography.fallback;

const fontFamily =
  Platform.OS === 'ios'
    ? nativeFont.ios
    : Platform.OS === 'android'
      ? nativeFont.android
      : nativeFont.fallback;

function ArrowRight(): JSX.Element {
  return (
    <Svg
      accessibilityElementsHidden
      fill="none"
      height={18}
      importantForAccessibility="no-hide-descendants"
      stroke={colors.ink}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      width={18}
    >
      <Path d="M5 12h14" />
      <Path d="m12 5 7 7-7 7" />
    </Svg>
  );
}

export default function OnboardingRoute(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: 280,
            paddingTop: Math.max(insets.top + space[4], 62),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Logo size={20} />
          <Text accessibilityLabel="Available languages" style={styles.locale}>
            EN · DE · FR · IT
          </Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>A friendly pantry assistant</Text>
          <Text accessibilityRole="header" style={styles.headline}>
            Know what's{'\n'}at home.{'\n'}
            <Text style={styles.headlineAccent}>Waste less.</Text>
          </Text>
          <Text style={styles.copy}>
            Scan a receipt, drop your groceries into your real kitchen, and get a quiet nudge before
            food expires.
          </Text>
        </View>

        <View
          accessibilityLabel="A paper bag with groceries dropping into it"
          accessibilityRole="image"
          style={styles.bagFrame}
        >
          <PaperBag height={260} width={240} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.actions,
          {
            paddingBottom: Math.max(insets.bottom + space[4], 38),
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            router.push('/storage-zones');
          }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Get started</Text>
          <ArrowRight />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            router.push('/auth');
          }}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    backgroundColor: colors.bg,
    bottom: 0,
    gap: space[2],
    left: 0,
    paddingHorizontal: space[6],
    paddingTop: space[4],
    position: 'absolute',
    right: 0,
  },
  bagFrame: {
    alignItems: 'center',
    marginTop: space[10],
  },
  copy: {
    color: colors.inkSoft,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
    marginTop: 22,
    maxWidth: 310,
  },
  eyebrow: {
    color: colors.mute,
    fontFamily: typography.eyebrow.fontFamily,
    fontSize: typography.eyebrow.fontSize,
    fontWeight: typography.eyebrow.fontWeight,
    lineHeight: typography.eyebrow.lineHeight,
    marginBottom: 18,
    textTransform: typography.eyebrow.textTransform,
  },
  headline: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 51,
  },
  headlineAccent: {
    color: colors.sageDeep,
    fontFamily: fontFamily.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  hero: {
    paddingHorizontal: space[7],
    paddingTop: space[16],
  },
  locale: {
    color: colors.mute,
    fontFamily: typography.meta.fontFamily,
    fontSize: 11,
    fontWeight: typography.meta.fontWeight,
    letterSpacing: 0,
    lineHeight: 16,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderColor: colors.ink,
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: space[3],
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: space[6],
    shadowColor: colors.amber,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
  },
  primaryButtonText: {
    color: colors.ink,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    lineHeight: typography.body.lineHeight,
  },
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  scrollContent: {
    backgroundColor: colors.bg,
    flexGrow: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    minHeight: 42,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.mute,
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    fontWeight: typography.caption.fontWeight,
    lineHeight: 20,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 24,
    paddingHorizontal: space[7],
  },
});
