import type { SackerlAuthClient } from '@sackerl/api-client';
import { StrictMode } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type AuthCallback = Parameters<SackerlAuthClient['onAuthStateChange']>[0];
type Session = Parameters<AuthCallback>[1];
type ReadResult = { data: { session: Session }; error: { message: string } | null };
type SignOutResult = { error: { message: string } | null };

// Only the SDK facade is controlled; the provider and its consumer are mounted unchanged.
const sdk = vi.hoisted(() => ({
  getSession: vi.fn<() => Promise<ReadResult>>(),
  signOut: vi.fn<() => Promise<SignOutResult>>(),
  onAuthStateChange: vi.fn<(callback: AuthCallback) => unknown>(),
  callbacks: [] as AuthCallback[],
  unsubscribe: vi.fn(),
}));
vi.mock('./auth', () => ({ getMobileAuthClient: () => sdk }));
vi.mock('expo-router', () => ({}));

import { AuthSessionProvider, useAuthSession } from './auth-session';

let screen: ReactTestRenderer | undefined;
let consumer: ReturnType<typeof useAuthSession> | undefined;
const publications: unknown[] = [];

function snapshot() {
  if (!consumer) throw new Error('Session consumer is not mounted');
  return {
    actor: consumer.session?.user.id ?? null,
    token: consumer.session?.access_token ?? null,
    status: consumer.status,
    error: consumer.errorMessage,
  };
}

function Consumer() {
  consumer = useAuthSession();
  publications.push(snapshot());
  return null;
}

function session(actor = 'owner', token = `${actor}-token`): NonNullable<Session> {
  return {
    access_token: token,
    refresh_token: `${actor}-refresh`,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: actor,
      email: `${actor}@test.invalid`,
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '2026-10-11T00:00:00Z',
    },
  };
}

const result = (value: Session = session()): ReadResult => ({
  data: { session: value },
  error: null,
});
const failure = (message: string): ReadResult => ({
  data: { session: null },
  error: { message },
});
const ready = (value: Session) => ({
  actor: value?.user.id ?? null,
  token: value?.access_token ?? null,
  status: 'ready',
  error: undefined,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

async function mount(strict = false) {
  const provider = (
    <AuthSessionProvider>
      <Consumer />
    </AuthSessionProvider>
  );
  await act(async () => {
    screen = create(strict ? <StrictMode>{provider}</StrictMode> : provider);
    await Promise.resolve();
  });
}

async function emit(event: Parameters<AuthCallback>[0], value: Session, index = 0) {
  const callback = sdk.callbacks[index];
  if (!callback) throw new Error('Auth callback is not subscribed');
  await act(async () => {
    callback(event, value);
    await Promise.resolve();
  });
}

async function start(action: 'refreshSession' | 'signOut') {
  if (!consumer) throw new Error('Session consumer is not mounted');
  const handler = consumer[action];
  let completion!: Promise<void>;
  await act(async () => {
    completion = handler();
    await Promise.resolve();
  });
  return { completion };
}

async function unmount() {
  await act(() => screen?.unmount());
  screen = undefined;
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  consumer = undefined;
  publications.length = 0;
  sdk.callbacks.length = 0;
  sdk.getSession.mockReset().mockResolvedValue(result());
  sdk.signOut.mockReset().mockResolvedValue({ error: null });
  sdk.unsubscribe.mockReset();
  sdk.onAuthStateChange.mockReset().mockImplementation((callback) => {
    sdk.callbacks.push(callback);
    return { data: { subscription: { unsubscribe: sdk.unsubscribe } } };
  });
});
afterEach(async () => {
  await unmount();
  vi.unstubAllGlobals();
});

describe('AuthSessionProvider publication ordering', () => {
  it('publishes the current initial read and subsequent account/refresh/signout events', async () => {
    await mount();
    expect(snapshot()).toEqual(ready(session()));
    await emit('SIGNED_IN', session('member'));
    expect(snapshot()).toEqual(ready(session('member')));
    await emit('TOKEN_REFRESHED', session('member', 'new-token'));
    expect(snapshot()).toEqual(ready(session('member', 'new-token')));
    await emit('SIGNED_OUT', null);
    expect(snapshot()).toEqual(ready(null));
  });

  it.each(['returned', 'rejected'] as const)(
    'publishes a current initial %s error',
    async (kind) => {
      if (kind === 'returned') sdk.getSession.mockResolvedValue(failure('Initial read failed'));
      else sdk.getSession.mockRejectedValue(new Error('Initial read failed'));
      await mount();
      expect(snapshot()).toEqual({
        actor: null,
        token: null,
        status: 'error',
        error: 'Initial read failed',
      });
    },
  );

  it.each([
    ['SIGNED_IN', session('member')],
    ['SIGNED_OUT', null],
    ['TOKEN_REFRESHED', session('owner', 'refreshed-token')],
  ] as const)('retains a newer %s event after the initial read completes', async (event, next) => {
    const initial = deferred<ReadResult>();
    sdk.getSession.mockReturnValueOnce(initial.promise);
    await mount();
    expect(snapshot().status).toBe('loading');
    await emit(event, next);
    await act(async () => {
      initial.resolve(result());
      await initial.promise;
    });
    expect(snapshot()).toEqual(ready(next));
  });

  it.each(['returned', 'rejected'] as const)(
    'ignores an initial %s error after a newer event',
    async (kind) => {
      const initial = deferred<ReadResult>();
      sdk.getSession.mockReturnValueOnce(initial.promise);
      await mount();
      await emit('SIGNED_IN', session('member'));
      await act(async () => {
        if (kind === 'returned') initial.resolve(failure('Stale initial error'));
        else initial.reject(new Error('Stale initial error'));
        await initial.promise.catch(() => undefined);
      });
      expect(snapshot()).toEqual(ready(session('member')));
    },
  );

  it('retains an explicit refresh when the older initial read completes afterward', async () => {
    const initial = deferred<ReadResult>();
    sdk.getSession.mockReturnValueOnce(initial.promise);
    await mount();
    sdk.getSession.mockResolvedValueOnce(result(session('member')));
    const refresh = await start('refreshSession');
    await act(async () => refresh.completion);
    await act(async () => {
      initial.resolve(result());
      await initial.promise;
    });
    expect(snapshot()).toEqual(ready(session('member')));
  });

  it('publishes current explicit refresh results and returned errors', async () => {
    await mount();
    sdk.getSession.mockResolvedValueOnce(result(session('member')));
    let refresh = await start('refreshSession');
    await act(async () => refresh.completion);
    expect(snapshot()).toEqual(ready(session('member')));
    sdk.getSession.mockResolvedValueOnce(failure('Current refresh error'));
    refresh = await start('refreshSession');
    await act(async () => refresh.completion);
    expect(snapshot()).toEqual({
      ...ready(session('member')),
      status: 'error',
      error: 'Current refresh error',
    });
  });

  it.each(['result', 'error'] as const)(
    'ignores a refresh %s superseded by an account event',
    async (kind) => {
      await mount();
      const pending = deferred<ReadResult>();
      sdk.getSession.mockReturnValueOnce(pending.promise);
      const refresh = await start('refreshSession');
      await emit('SIGNED_IN', session('member'));
      await act(async () => {
        pending.resolve(kind === 'result' ? result() : failure('Stale refresh error'));
        await refresh.completion;
      });
      expect(snapshot()).toEqual(ready(session('member')));
    },
  );

  it.each(['result', 'error'] as const)(
    'lets the newer refresh %s win when requests complete in reverse order',
    async (kind) => {
      await mount();
      const older = deferred<ReadResult>();
      const newer = deferred<ReadResult>();
      sdk.getSession.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
      const first = await start('refreshSession');
      const second = await start('refreshSession');
      await act(async () => {
        newer.resolve(
          kind === 'result' ? result(session('member')) : failure('Latest refresh error'),
        );
        await second.completion;
      });
      const expected = snapshot();
      expect(expected).toEqual(
        kind === 'result'
          ? ready(session('member'))
          : { ...ready(session()), status: 'error', error: 'Latest refresh error' },
      );
      await act(async () => {
        older.resolve(result());
        await first.completion;
      });
      expect(snapshot()).toEqual(expected);
    },
  );

  it.each([false, true])(
    'preserves explicit refresh rejection semantics (superseded: %s)',
    async (superseded) => {
      await mount();
      const pending = deferred<ReadResult>();
      sdk.getSession.mockReturnValueOnce(pending.promise);
      const refresh = await start('refreshSession');
      if (superseded) await emit('SIGNED_IN', session('member'));
      const rejection = expect(refresh.completion).rejects.toThrow('Refresh rejected');
      await act(async () => {
        pending.reject(new Error('Refresh rejected'));
        await rejection;
      });
      expect(snapshot()).toEqual(ready(session(superseded ? 'member' : 'owner')));
    },
  );

  it('publishes a current signout error', async () => {
    await mount();
    sdk.signOut.mockResolvedValueOnce({ error: { message: 'Current signout error' } });
    const signout = await start('signOut');
    await act(async () => signout.completion);
    expect(snapshot()).toEqual({
      ...ready(session()),
      status: 'error',
      error: 'Current signout error',
    });
  });

  it.each(['event', 'refresh'] as const)(
    'ignores a signout error superseded by a newer %s',
    async (kind) => {
      await mount();
      const pending = deferred<SignOutResult>();
      sdk.signOut.mockReturnValueOnce(pending.promise);
      const signout = await start('signOut');
      if (kind === 'event') await emit('SIGNED_IN', session('member'));
      else {
        sdk.getSession.mockResolvedValueOnce(result(session('member')));
        const refresh = await start('refreshSession');
        await act(async () => refresh.completion);
      }
      await act(async () => {
        pending.resolve({ error: { message: 'Stale signout error' } });
        await signout.completion;
      });
      expect(snapshot()).toEqual(ready(session('member')));
    },
  );

  it('unsubscribes and does not publish late initial reads or callbacks after unmount', async () => {
    const initial = deferred<ReadResult>();
    sdk.getSession.mockReturnValueOnce(initial.promise);
    await mount();
    await unmount();
    const previous = [...publications];
    await emit('SIGNED_IN', session('member'));
    await act(async () => {
      initial.resolve(result());
      await initial.promise;
    });
    expect(sdk.unsubscribe).toHaveBeenCalledOnce();
    expect(publications).toEqual(previous);
  });

  it.each(['refreshSession', 'signOut'] as const)(
    'does not publish a pending %s result or start it again after unmount',
    async (action) => {
      await mount();
      const pending = deferred<ReadResult & SignOutResult>();
      if (action === 'refreshSession') sdk.getSession.mockReturnValueOnce(pending.promise);
      else sdk.signOut.mockReturnValueOnce(pending.promise);
      const work = await start(action);
      const captured = consumer![action];
      await unmount();
      const previous = [...publications];
      await act(async () => {
        pending.resolve(failure('Late operation error'));
        await work.completion;
      });
      expect(publications).toEqual(previous);
      sdk.getSession.mockClear();
      sdk.signOut.mockClear();
      await captured();
      expect(sdk.getSession).not.toHaveBeenCalled();
      expect(sdk.signOut).not.toHaveBeenCalled();
    },
  );

  it('ignores callbacks from a cleaned-up effect after StrictMode restarts it', async () => {
    await mount(true);
    expect(sdk.unsubscribe).toHaveBeenCalledOnce();
    expect(sdk.callbacks).toHaveLength(2);
    await emit('SIGNED_IN', session('member'), 1);
    await emit('SIGNED_IN', session(), 0);
    expect(snapshot()).toEqual(ready(session('member')));
  });
});
