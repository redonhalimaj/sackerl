import { colors, nativeTypography, space } from '@sackerl/tokens';
import { Logo } from '@sackerl/ui';
import { type Household } from '@sackerl/api-client';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuthSession } from '../../lib/auth-session';
import { getMobileProfileClient } from '../../lib/profile';

const typography =
  Platform.OS === 'ios'
    ? nativeTypography.ios
    : Platform.OS === 'android'
      ? nativeTypography.android
      : nativeTypography.fallback;

export default function SettingsRoute() {
  const { session, signOut } = useAuthSession();
  const email = session?.user.email ?? 'Signed in';
  const [household, setHousehold] = useState<Household | null>(null);
  const [calendarInput, setCalendarInput] = useState('');
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [retry, setRetry] = useState(0);
  const requestGeneration = useRef(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      requestGeneration.current += 1;
      setIsSaving(false);
      setLoadState('loading');
      setHousehold(null);
      setMessage(undefined);

      async function loadHousehold() {
        if (!session?.user) {
          if (active) setLoadState('ready');
          return;
        }
        try {
          const loaded = await getMobileProfileClient().getHousehold({
            accessToken: session.access_token,
            user: { id: session.user.id, email: session.user.email },
          });
          if (active) {
            setHousehold(loaded);
            setCalendarInput(loaded?.calendarTimeZone ?? '');
            setLoadState('ready');
          }
        } catch (error) {
          if (active) {
            setMessage(
              error instanceof Error ? error.message : 'Unable to load household settings.',
            );
            setLoadState('error');
          }
        }
      }
      void loadHousehold();
      return () => {
        active = false;
        requestGeneration.current += 1;
      };
    }, [session, retry]),
  );

  async function saveCalendar() {
    if (!session?.user || household?.role !== 'owner' || isSaving || loadState !== 'ready') return;
    setIsSaving(true);
    setMessage(undefined);
    const generation = requestGeneration.current;
    try {
      const updated = await getMobileProfileClient().updateHouseholdCalendar(
        {
          accessToken: session.access_token,
          user: { id: session.user.id, email: session.user.email },
        },
        { calendarTimeZone: calendarInput },
      );
      if (generation === requestGeneration.current) {
        setHousehold(updated);
        setCalendarInput(updated.calendarTimeZone);
        setMessage('Household calendar saved.');
      }
    } catch (error) {
      if (generation === requestGeneration.current) {
        setMessage(
          error instanceof Error ? error.message : 'Unable to save the household calendar.',
        );
      }
    } finally {
      if (generation === requestGeneration.current) setIsSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Logo />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.title}>Household settings</Text>
        <Text style={styles.copy}>{email}</Text>
        <View style={styles.calendarCard}>
          <Text style={styles.fieldLabel}>Household calendar</Text>
          <Text style={styles.copy}>
            Choose the time zone where your household lives. Recipe suggestions use this calendar,
            even when your phone travels.
          </Text>
          {loadState === 'loading' ? (
            <ActivityIndicator accessibilityLabel="Loading household calendar" />
          ) : null}
          {loadState === 'ready' && household ? (
            <>
              <TextInput
                accessibilityLabel="Household time zone"
                autoCapitalize="none"
                autoCorrect={false}
                editable={household.role === 'owner' && !isSaving}
                onChangeText={(value) => {
                  setCalendarInput(value);
                  setMessage(undefined);
                }}
                placeholder="Europe/Vienna"
                style={styles.input}
                value={calendarInput}
              />
              <Text style={styles.copy}>
                {household.role === 'owner'
                  ? 'Use a time zone such as Europe/Vienna, Europe/London or America/New_York.'
                  : 'The household owner can change this setting.'}
              </Text>
              {household.role === 'owner' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isSaving }}
                  disabled={isSaving}
                  onPress={() => {
                    void saveCalendar();
                  }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>{isSaving ? 'Saving…' : 'Save calendar'}</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
          {loadState === 'ready' && !household ? (
            <Text style={styles.copy}>No household is available yet.</Text>
          ) : null}
          {message ? (
            <Text accessibilityLiveRegion="polite" style={styles.copy}>
              {message}
            </Text>
          ) : null}
          {loadState === 'error' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setRetry((value) => value + 1)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Retry loading settings</Text>
            </Pressable>
          ) : null}
        </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    alignSelf: 'stretch',
    marginTop: space[5],
  },
  fieldLabel: {
    color: colors.ink,
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.ink,
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
    minHeight: 48,
    marginTop: space[3],
    paddingHorizontal: space[3],
  },
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
    flexGrow: 1,
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
    flexGrow: 1,
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
