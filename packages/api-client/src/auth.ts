import {
  GoTrueClient,
  type AuthChangeEvent,
  type Session,
  type SupportedStorage,
} from '@supabase/auth-js';

export type ApiEnvironment = 'dev' | 'staging' | 'prod';

export type AuthProvider = 'supabase';

export type AuthRouteState = 'dashboard' | 'onboarding';

export type AuthSessionLike = {
  readonly user?: object | null;
};

export type EmailPasswordAuthInput = {
  readonly email: string;
  readonly password: string;
  readonly redirectTo?: string | undefined;
};

export type ForgotPasswordInput = {
  readonly email: string;
  readonly redirectTo?: string | undefined;
};

export type AppleIdentityTokenInput = {
  readonly identityToken: string;
  readonly nonce?: string | undefined;
};

export type SupabaseAuthConfig = {
  readonly anonKey: string | undefined;
  readonly storageKey?: string | undefined;
  readonly url: string | undefined;
};

export type SupabaseAuthClientOptions = Partial<ConstructorParameters<typeof GoTrueClient>[0]> & {
  readonly storage?: SupportedStorage | undefined;
};

export type SupabaseConfigValidation =
  | {
      readonly config: {
        readonly anonKey: string;
        readonly storageKey: string;
        readonly url: string;
      };
      readonly ok: true;
    }
  | {
      readonly missingKeys: readonly (keyof Pick<SupabaseAuthConfig, 'anonKey' | 'url'>)[];
      readonly ok: false;
    };

export class SupabaseConfigError extends Error {
  readonly missingKeys: readonly (keyof Pick<SupabaseAuthConfig, 'anonKey' | 'url'>)[];

  constructor(missingKeys: readonly (keyof Pick<SupabaseAuthConfig, 'anonKey' | 'url'>)[]) {
    super(`Missing Supabase auth config: ${missingKeys.join(', ')}`);
    this.name = 'SupabaseConfigError';
    this.missingKeys = missingKeys;
  }
}

function trimmed(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function validateSupabaseAuthConfig(config: SupabaseAuthConfig): SupabaseConfigValidation {
  const url = trimmed(config.url);
  const anonKey = trimmed(config.anonKey);
  const missingKeys: (keyof Pick<SupabaseAuthConfig, 'anonKey' | 'url'>)[] = [];

  if (!url) {
    missingKeys.push('url');
  }

  if (!anonKey) {
    missingKeys.push('anonKey');
  }

  if (missingKeys.length > 0) {
    return { missingKeys, ok: false };
  }

  return {
    config: {
      anonKey,
      storageKey: trimmed(config.storageKey) || 'sackerl-auth',
      url,
    },
    ok: true,
  };
}

export function assertSupabaseAuthConfig(
  config: SupabaseAuthConfig,
): Extract<SupabaseConfigValidation, { ok: true }>['config'] {
  const validation = validateSupabaseAuthConfig(config);

  if (!validation.ok) {
    throw new SupabaseConfigError(validation.missingKeys);
  }

  return validation.config;
}

export function createSackerlSupabaseClient(
  config: SupabaseAuthConfig,
  options: SupabaseAuthClientOptions = {},
): GoTrueClient {
  const resolvedConfig = assertSupabaseAuthConfig(config);
  const supabaseUrl = resolvedConfig.url.replace(/\/+$/, '');

  return new GoTrueClient({
    ...options,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    headers: {
      apikey: resolvedConfig.anonKey,
      Authorization: `Bearer ${resolvedConfig.anonKey}`,
      ...options.headers,
    },
    persistSession: true,
    storageKey: resolvedConfig.storageKey,
    url: `${supabaseUrl}/auth/v1`,
  });
}

export class SackerlAuthClient {
  readonly auth: GoTrueClient;

  constructor(auth: GoTrueClient) {
    this.auth = auth;
  }

  getSession() {
    return this.auth.getSession();
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.auth.onAuthStateChange(callback);
  }

  signUpWithEmail(input: EmailPasswordAuthInput) {
    return this.auth.signUp({
      email: input.email,
      password: input.password,
      ...(input.redirectTo ? { options: { emailRedirectTo: input.redirectTo } } : {}),
    });
  }

  signInWithEmail(input: EmailPasswordAuthInput) {
    return this.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
  }

  signInWithAppleIdentityToken(input: AppleIdentityTokenInput) {
    return this.auth.signInWithIdToken({
      provider: 'apple',
      token: input.identityToken,
      ...(input.nonce ? { nonce: input.nonce } : {}),
    });
  }

  sendPasswordReset(input: ForgotPasswordInput) {
    return input.redirectTo
      ? this.auth.resetPasswordForEmail(input.email, { redirectTo: input.redirectTo })
      : this.auth.resetPasswordForEmail(input.email);
  }

  signOut() {
    return this.auth.signOut();
  }
}

export function createSackerlAuthClient(
  config: SupabaseAuthConfig,
  options?: SupabaseAuthClientOptions,
): SackerlAuthClient {
  return new SackerlAuthClient(createSackerlSupabaseClient(config, options));
}

export function resolveAuthRouteState(session: AuthSessionLike | null | undefined): AuthRouteState {
  return session?.user ? 'dashboard' : 'onboarding';
}
