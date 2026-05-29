import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createSackerlAuthClient,
  type SackerlAuthClient,
  type SupabaseAuthConfig,
} from '@sackerl/api-client';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export const mobileSupabaseAuthConfig = {
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  storageKey: 'sackerl-mobile-auth',
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
} satisfies SupabaseAuthConfig;

let mobileAuthClient: SackerlAuthClient | undefined;

export function getMobileAuthClient(): SackerlAuthClient {
  mobileAuthClient ??= createSackerlAuthClient(mobileSupabaseAuthConfig, {
    detectSessionInUrl: false,
    storage: AsyncStorage,
  });

  return mobileAuthClient;
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  return Platform.OS === 'ios' && AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple() {
  if (!(await isAppleSignInAvailable())) {
    throw new Error('Apple Sign-In is available only on supported iOS devices.');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple Sign-In did not return an identity token.');
  }

  return getMobileAuthClient().signInWithAppleIdentityToken({
    identityToken: credential.identityToken,
  });
}
