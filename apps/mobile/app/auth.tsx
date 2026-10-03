import { colors, nativeTypography, space } from '@sackerl/tokens';
import { Logo } from '@sackerl/ui';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isAppleSignInAvailable, signInWithApple } from '../lib/auth';
import { useAuthSession } from '../lib/auth-session';

type AuthMode = 'reset' | 'signIn' | 'signUp';

const typography =
  Platform.OS === 'ios'
    ? nativeTypography.ios
    : Platform.OS === 'android'
      ? nativeTypography.android
      : nativeTypography.fallback;

export default function AuthRoute() {
  const insets = useSafeAreaInsets();
  const { client, errorMessage: sessionError, status } = useAuthSession();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | undefined>();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    isAppleSignInAvailable()
      .then(setAppleAvailable)
      .catch(() => {
        setAppleAvailable(false);
      });
  }, []);

  const title =
    mode === 'signUp'
      ? 'Create your Sackerl'
      : mode === 'reset'
        ? 'Reset password'
        : 'Welcome back';
  const copy =
    mode === 'signUp'
      ? 'Use an email and password. Supabase will send a confirmation email.'
      : mode === 'reset'
        ? 'Enter your email and we will send a reset link.'
        : 'Sign in to continue to your household stock.';

  async function handleEmailSubmit() {
    if (!client) {
      setMessage(sessionError ?? 'Auth is not ready yet.');
      return;
    }

    setIsSubmitting(true);
    setMessage(undefined);

    try {
      if (mode === 'reset') {
        const { error } = await client.sendPasswordReset({ email });

        if (error) {
          throw error;
        }

        setMessage('Password reset email sent.');
        return;
      }

      if (!password) {
        setMessage('Enter a password.');
        return;
      }

      const { error } =
        mode === 'signUp'
          ? await client.signUpWithEmail({ email, password })
          : await client.signInWithEmail({ email, password });

      if (error) {
        throw error;
      }

      setMessage(mode === 'signUp' ? 'Check your email to confirm your account.' : 'Signed in.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Auth request failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAppleSignIn() {
    setIsSubmitting(true);
    setMessage(undefined);

    try {
      const { error } = await signInWithApple();

      if (error) {
        throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Apple Sign-In failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, space[6]),
            paddingTop: Math.max(insets.top, space[10]),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Logo />
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Sackerl account</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.copy}>{copy}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.muteSoft}
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />

          {mode === 'reset' ? null : (
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.muteSoft}
              secureTextEntry
              style={styles.input}
              textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
              value={password}
            />
          )}

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting || status === 'loading'}
            onPress={() => {
              void handleEmailSubmit();
            }}
            style={[
              styles.primaryButton,
              isSubmitting || status === 'loading' ? styles.disabled : null,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'signUp'
                  ? 'Create account'
                  : mode === 'reset'
                    ? 'Send reset link'
                    : 'Sign in'}
              </Text>
            )}
          </Pressable>

          {appleAvailable ? (
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => {
                void handleAppleSignIn();
              }}
              style={styles.inkButton}
            >
              <Text style={styles.inkButtonText}>Sign in with Apple</Text>
            </Pressable>
          ) : null}
        </View>

        {(message ?? sessionError) ? (
          <View style={styles.message}>
            <Text style={styles.messageText}>{message ?? sessionError}</Text>
          </View>
        ) : null}

        <View style={styles.links}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setMessage(undefined);
            }}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>
              {mode === 'signIn' ? 'Create an account' : 'I already have an account'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode(mode === 'reset' ? 'signIn' : 'reset');
              setMessage(undefined);
            }}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>
              {mode === 'reset' ? 'Back to sign in' : 'Forgot password?'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.bg,
    flexGrow: 1,
    paddingHorizontal: space[5],
  },
  copy: {
    color: colors.inkSoft,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
    marginTop: space[3],
  },
  disabled: {
    opacity: 0.58,
  },
  eyebrow: {
    color: colors.mute,
    fontFamily: typography.eyebrow.fontFamily,
    fontSize: typography.eyebrow.fontSize,
    fontWeight: typography.eyebrow.fontWeight,
    lineHeight: typography.eyebrow.lineHeight,
    textTransform: typography.eyebrow.textTransform,
  },
  form: {
    gap: space[3],
    marginTop: space[8],
  },
  header: {
    marginTop: space[10],
  },
  inkButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 999,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: space[6],
  },
  inkButtonText: {
    color: colors.bg,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    lineHeight: typography.body.lineHeight,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    height: 54,
    lineHeight: typography.body.lineHeight,
    paddingHorizontal: space[4],
  },
  keyboard: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  linkButton: {
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  linkText: {
    color: colors.mute,
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  links: {
    alignItems: 'center',
    gap: space[2],
    marginTop: space[5],
  },
  message: {
    backgroundColor: colors.sageSoft,
    borderRadius: 14,
    marginTop: space[4],
    padding: space[4],
  },
  messageText: {
    color: colors.sageDeep,
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderColor: colors.ink,
    borderRadius: 999,
    borderWidth: 1.5,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: space[6],
  },
  primaryButtonText: {
    color: colors.ink,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    lineHeight: typography.body.lineHeight,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.headline.fontFamily,
    fontSize: typography.headline.fontSize,
    fontWeight: typography.headline.fontWeight,
    lineHeight: typography.headline.lineHeight,
    marginTop: space[2],
  },
});
