import { colors, nativeFont } from '@sackerl/tokens';
import { useEffect, useState, type JSX } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dismissPlacementToast, subscribePlacementToast } from '../lib/placement-toast';

const fontFamily = Platform.OS === 'ios' ? nativeFont.ios.sans : nativeFont.android.sans;

export function PlacementToastHost(): JSX.Element | null {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => subscribePlacementToast(setMessage), []);
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(dismissPlacementToast, 4000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;
  return (
    <Pressable
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${message}. Dismiss`}
      accessibilityRole="alert"
      onPress={dismissPlacementToast}
      style={[styles.toast, { bottom: Math.max(insets.bottom, 12) + 84 }]}
      testID="receipt-placement.toast"
    >
      <Text style={styles.text}>{message}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.card, fontFamily, fontSize: 15, fontWeight: '700' },
  toast: {
    alignSelf: 'center',
    backgroundColor: colors.ink,
    borderRadius: 999,
    left: 16,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
    position: 'absolute',
    right: 16,
  },
});
