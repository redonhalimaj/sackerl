import { randomUUID } from 'node:crypto';

import { test as base, expect, type APIRequestContext, type APIResponse } from '@playwright/test';

import { readE2eEnv, requireE2eEnv } from './env';
import { createSyntheticUser, type SyntheticUser } from './supabase-admin';

/** Shared per-run id, set by global-setup; falls back for single-file runs. */
export const RUN_ID = process.env.E2E_RUN_ID ?? `local${Date.now().toString(36)}`;

export type ApiClient = {
  readonly user: SyntheticUser;
  get(path: string): Promise<APIResponse>;
  post(path: string, body?: unknown): Promise<APIResponse>;
  patch(path: string, body?: unknown): Promise<APIResponse>;
  put(path: string, body?: unknown): Promise<APIResponse>;
  delete(path: string, body?: unknown): Promise<APIResponse>;
};

function bearerClient(request: APIRequestContext, user: SyntheticUser): ApiClient {
  const headers = { Authorization: `Bearer ${user.accessToken}` };
  return {
    delete: (path, body) => request.delete(path, { data: body, headers }),
    get: (path) => request.get(path, { headers }),
    patch: (path, body) => request.patch(path, { data: body, headers }),
    post: (path, body) => request.post(path, { data: body, headers }),
    put: (path, body) => request.put(path, { data: body, headers }),
    user,
  };
}

type Fixtures = {
  /** A fresh synthetic user for this test (no household set up yet). */
  owner: ApiClient;
  /** A second, unrelated synthetic user for outsider/denial checks. */
  outsider: ApiClient;
  /** Builds extra users when a spec needs more than two. */
  makeUser: (label: string) => Promise<ApiClient>;
};

/**
 * Backend-dependent fixtures. Specs that use them are skipped when no E2E target is configured,
 * so the suite stays runnable (design smoke only) on machines without Supabase.
 */
export const test = base.extend<Fixtures>({
  makeUser: async ({ request }, use, testInfo) => {
    test.skip(!readE2eEnv(), 'No E2E Supabase target configured (see docs/qa/e2e-web.md).');
    const env = requireE2eEnv();
    const make = async (label: string) =>
      bearerClient(
        request,
        await createSyntheticUser(
          env,
          RUN_ID,
          `${testInfo.workerIndex}-${label}-${randomUUID().slice(0, 8)}`,
        ),
      );
    await use(make);
  },
  outsider: async ({ makeUser }, use) => {
    await use(await makeUser('outsider'));
  },
  owner: async ({ makeUser }, use) => {
    await use(await makeUser('owner'));
  },
});

export { expect };

/** Asserts status and returns the parsed JSON body; includes the body in failure messages. */
export async function expectJson<T = Record<string, unknown>>(
  response: APIResponse,
  status: number,
): Promise<T> {
  const text = await response.text();
  expect(response.status(), `HTTP ${response.status()} body: ${text.slice(0, 500)}`).toBe(status);
  return (text ? JSON.parse(text) : {}) as T;
}
