import { defineConfig, devices } from '@playwright/test';

import { readE2eEnv } from './e2e/support/env';

const env = readE2eEnv();
const baseURL = env?.baseUrl ?? process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100';
const port = new URL(baseURL).port || '3100';
// Hosted Supabase returns Cloudflare 5xx under bursts of admin user creation; run serially there.
const hostedTarget =
  !!env && !['127.0.0.1', 'localhost'].includes(new URL(env.supabaseUrl).hostname);

/**
 * Web E2E. Specs live in e2e/** and use the `.e2e.ts` suffix so Vitest (`pnpm test`) never
 * collects them. Run with `pnpm --filter @sackerl/web e2e`.
 */
export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  globalSetup: './e2e/support/global-setup.ts',
  globalTeardown: './e2e/support/global-teardown.ts',
  outputDir: './e2e/.results',
  projects: [
    { name: 'api', testMatch: /api\/.*\.e2e\.ts$/ },
    {
      name: 'smoke-mobile',
      testMatch: /smoke\/.*\.e2e\.ts$/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  reporter: [['list'], ['html', { open: 'never', outputFolder: './e2e/.report' }]],
  retries: process.env.CI ? 1 : 0,
  testDir: './e2e',
  testMatch: /.*\.e2e\.ts$/,
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: {
    command: `pnpm exec next dev --port ${port}`,
    env: {
      ...(env
        ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: env.anonKey, NEXT_PUBLIC_SUPABASE_URL: env.supabaseUrl }
        : {}),
    },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    url: `${baseURL}/`,
  },
  ...(hostedTarget ? { workers: 1 } : process.env.CI ? { workers: 2 } : {}),
});
