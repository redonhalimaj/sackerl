# Web E2E (Playwright)

Owner: Web E2E seat (w2). Updated 2026-11-02.

Web currently has no product UI. It consists of Next.js API route handlers authenticated with a
Supabase Bearer token (`apps/web/lib/api-auth.ts`) plus the `design-*` pages. The suite therefore
has two parts:

- **`api` project:** Playwright `request` API-contract specs for auth/me, household,
  items/stock CRUD with expiry, receipts create/parse/review, suggestions, shopping list, and
  placement (`GET/POST /receipts/:id/placement`, `GET /receipts/pending-placement`). It covers
  401 denial, outsider isolation and validation errors.
- **`smoke-mobile` project:** a Pixel 7 viewport smoke and screenshots of `/` and the design pages.
  It needs no backend.

The disabled "Continue to placement" CTA exists only on mobile
(`apps/mobile/app/receipt-review/[id].tsx`) and belongs to the Mobile E2E seat. Web covers the
placement API it will eventually call.

## Layout

```
apps/web/playwright.config.ts    projects, webServer (next dev on :3100), global setup/teardown
apps/web/e2e/
  .env.e2e.example                variable names only; copy to .env.e2e (ignored)
  support/env.ts                  env loading and target guard (local only by default; never prod)
  support/supabase-admin.ts       synthetic users e2e+<runId>-<label>@sackerl.test, cleanup
  support/fixtures.ts             `test` with owner / outsider / makeUser fixtures, expectJson
  support/builders/*.ts           domain setup helpers (household, items, receipts)
  api/*.e2e.ts                    API contract specs
  smoke/*.e2e.ts                  viewport smoke
  maintenance/cleanup.e2e.ts      removes leftover synthetic users from aborted runs
```

Specs use the `.e2e.ts` suffix so Vitest (`pnpm test` / `turbo test`) never collects them; e2e
is not part of `turbo test`.

## Running

```bash
pnpm --filter @sackerl/web e2e:install     # once: Chromium
pnpm --filter @sackerl/web e2e             # api + smoke-mobile
pnpm --filter @sackerl/web e2e:api
pnpm --filter @sackerl/web e2e:smoke
pnpm --filter @sackerl/web e2e:cleanup     # remove leftovers from any run
```

Without `apps/web/e2e/.env.e2e` (or the equivalent shell variables), backend specs are
**skipped** and only the smoke runs.

## Target and safety

- The default target is a **local Supabase** stack with all `supabase/migrations` applied.
  No `supabase/config.toml` exists in the repo yet. Setting one up (Supabase CLI and Docker) is
  outside this seat's file ownership and waits on the owner's decision.
- `assertSafeTarget` allows only `127.0.0.1`/`localhost`/`host.docker.internal`. A hosted
  dev project must be listed in `E2E_ALLOWED_SUPABASE_HOSTS`, and only after owner approval.
  Any host or label containing "prod" is refused.
- A service-role key is required to create and delete synthetic users. Keep it only in the ignored
  `.env.e2e`, and never print or commit it.

## Fixtures and cleanup

Each test gets fresh users via the Auth admin API, tagged with `user_metadata.e2e_run_id` and
emails under `@sackerl.test`. Global teardown deletes the run's users (skipped with
`E2E_KEEP_DATA=1`). Profiles, households and all household-owned rows cascade from `auth.users`
deletion per the migrations. If a later migration adds a restricting FK (e.g. append-only
placement events), teardown failures will surface it, and cleanup must be extended.

## Extending

1. Add `e2e/api/<feature>.e2e.ts`, import `{ test, expect, expectJson }` from
   `../support/fixtures`.
2. Put reusable setup in `e2e/support/builders/<feature>.ts`.
3. Cover the happy path, 401, outsider isolation and the main 400/409/422 cases.
4. When web product UI lands, add browser specs under `e2e/ui/` with a new project.

## Status

See the latest run record at the end of this file.
