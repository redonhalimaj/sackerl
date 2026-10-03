import { describe, expect, it } from 'vitest';

import {
  SupabaseConfigError,
  assertSupabaseAuthConfig,
  resolveAuthRouteState,
  validateSupabaseAuthConfig,
} from './auth';

describe('Supabase auth config', () => {
  it('reports missing public Supabase config keys', () => {
    expect(validateSupabaseAuthConfig({ anonKey: '', url: '   ' })).toEqual({
      missingKeys: ['url', 'anonKey'],
      ok: false,
    });
  });

  it('trims values and applies the default storage key', () => {
    expect(
      validateSupabaseAuthConfig({
        anonKey: ' anon ',
        url: ' https://sackerl.supabase.co ',
      }),
    ).toEqual({
      config: {
        anonKey: 'anon',
        storageKey: 'sackerl-auth',
        url: 'https://sackerl.supabase.co',
      },
      ok: true,
    });
  });

  it('throws a typed error when config is incomplete', () => {
    expect(() => assertSupabaseAuthConfig({ anonKey: undefined, url: undefined })).toThrow(
      SupabaseConfigError,
    );
  });
});

describe('auth route state', () => {
  it('routes anonymous sessions to onboarding', () => {
    expect(resolveAuthRouteState(null)).toBe('onboarding');
  });

  it('routes authenticated sessions to the dashboard', () => {
    expect(resolveAuthRouteState({ user: { id: 'user_123' } })).toBe('dashboard');
  });
});
