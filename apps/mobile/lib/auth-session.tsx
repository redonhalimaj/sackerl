import type { SackerlAuthClient } from '@sackerl/api-client';
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { getMobileAuthClient } from './auth';

type AuthSession = Awaited<ReturnType<SackerlAuthClient['getSession']>>['data']['session'];

type AuthSessionStatus = 'error' | 'loading' | 'ready';

type AuthSessionContextValue = {
  readonly client: SackerlAuthClient | undefined;
  readonly errorMessage: string | undefined;
  readonly refreshSession: () => Promise<void>;
  readonly session: AuthSession;
  readonly signOut: () => Promise<void>;
  readonly status: AuthSessionStatus;
};

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

export function AuthSessionProvider({ children }: PropsWithChildren): React.ReactElement {
  const [client, setClient] = useState<SackerlAuthClient | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [session, setSession] = useState<AuthSession>(null);
  const [status, setStatus] = useState<AuthSessionStatus>('loading');
  const sessionGenerationRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    mountedRef.current = true;
    const generation = ++sessionGenerationRef.current;
    const current = () => isMounted && generation === sessionGenerationRef.current;
    let unsubscribe: (() => void) | undefined;

    try {
      const authClient = getMobileAuthClient();
      setClient(authClient);

      authClient
        .getSession()
        .then(({ data, error }) => {
          if (!current()) {
            return;
          }

          if (error) {
            setErrorMessage(error.message);
            setStatus('error');
            return;
          }

          setSession(data.session);
          setStatus('ready');
        })
        .catch((error: unknown) => {
          if (!current()) {
            return;
          }

          setErrorMessage(error instanceof Error ? error.message : 'Unable to load auth session.');
          setStatus('error');
        });

      const {
        data: { subscription },
      } = authClient.onAuthStateChange((_event, nextSession) => {
        if (!isMounted) return;
        // A newer SDK event supersedes any session read or operation still pending.
        ++sessionGenerationRef.current;
        setSession(nextSession);
        setStatus('ready');
      });

      unsubscribe = () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      if (current()) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to initialize auth.');
        setStatus('error');
      }
    }

    return () => {
      isMounted = false;
      mountedRef.current = false;
      ++sessionGenerationRef.current;
      unsubscribe?.();
    };
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      client,
      errorMessage,
      refreshSession: async () => {
        if (!client || !mountedRef.current) {
          return;
        }

        const generation = ++sessionGenerationRef.current;
        const { data, error } = await client.getSession();
        if (!mountedRef.current || generation !== sessionGenerationRef.current) return;

        if (error) {
          setErrorMessage(error.message);
          setStatus('error');
          return;
        }

        setSession(data.session);
        setStatus('ready');
      },
      session,
      signOut: async () => {
        if (!client || !mountedRef.current) {
          return;
        }

        const generation = ++sessionGenerationRef.current;
        const { error } = await client.signOut();
        if (!mountedRef.current || generation !== sessionGenerationRef.current) return;

        if (error) {
          setErrorMessage(error.message);
          setStatus('error');
        }
      },
      status,
    }),
    [client, errorMessage, session, status],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function AuthRouteGate(): null {
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const router = useRouter();
  const segments = useSegments();
  const { session, status } = useAuthSession();
  const isAuthRoute = segments[0] === 'auth';
  const isOnboardingRoute = segments[0] === 'onboarding';
  const isStorageZonesRoute = segments[0] === 'storage-zones';
  const isLoggedOutRoute = isAuthRoute || isOnboardingRoute || isStorageZonesRoute;
  const isSignedIn = Boolean(session?.user);
  const returnToStorageZones = params.returnTo === '/storage-zones';

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!isSignedIn && !isLoggedOutRoute) {
      router.replace('/onboarding');
      return;
    }

    if (isSignedIn && (isAuthRoute || isOnboardingRoute)) {
      router.replace(isAuthRoute && returnToStorageZones ? '/storage-zones' : '/');
    }
  }, [
    isAuthRoute,
    isLoggedOutRoute,
    isOnboardingRoute,
    isSignedIn,
    returnToStorageZones,
    router,
    status,
  ]);

  return null;
}

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider.');
  }

  return context;
}
