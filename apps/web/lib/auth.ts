import {
  createSackerlAuthClient,
  type SackerlAuthClient,
  type SupabaseAuthConfig,
} from '@sackerl/api-client';

export const webSupabaseAuthConfig = {
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  storageKey: 'sackerl-web-auth',
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
} satisfies SupabaseAuthConfig;

let webAuthClient: SackerlAuthClient | undefined;

export function getWebAuthClient(): SackerlAuthClient {
  webAuthClient ??= createSackerlAuthClient(webSupabaseAuthConfig);

  return webAuthClient;
}
