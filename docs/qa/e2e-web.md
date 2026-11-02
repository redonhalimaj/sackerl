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
  support/env.ts                  env loading and target guard (never prod)
  support/supabase-admin.ts       create and delete synthetic users by exact id; per-run ledger
  support/schema.ts               marks placement specs fixme when SCKRL-311 is missing on the target
  support/fixtures.ts             `test` with owner / outsider / makeUser fixtures, expectJson
  support/builders/*.ts           domain setup helpers (household, items, receipts, placement)
  api/*.e2e.ts                    API contract specs
  smoke/*.e2e.ts                  viewport smoke and the API side of the mobile placement CTA gate
```

Specs use the `.e2e.ts` suffix so Vitest (`pnpm test` / `turbo test`) never collects them; e2e
is not part of `turbo test`.

## Running

```bash
pnpm --filter @sackerl/web e2e:install     # once: Chromium
pnpm --filter @sackerl/web e2e             # backend specs skip; smoke runs
# Backend against the approved remote dev project (from a worktree, point at the main checkout's env):
E2E_BACKEND=1 E2E_ENV_DIR=<main checkout> E2E_ALLOWED_SUPABASE_HOSTS=<dev project host> \
  pnpm --filter @sackerl/web e2e
```

Backend specs run only with `E2E_BACKEND=1`. Credentials are read, never printed, from the
shell, `apps/web/e2e/.env.e2e`, `apps/web/.env.local` and the repo-root `.env` (all ignored).
`E2E_*` names win; `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` are fallbacks.

## Target and safety

- The owner-approved target is the **remote dev** Supabase project (2026-11-02). A local Supabase
  stack also works and is allowed by default (`127.0.0.1`/`localhost`).
- The real safeguard is the allow-list: a non-local host must be named in
  `E2E_ALLOWED_SUPABASE_HOSTS`. Any host or `E2E_TARGET_LABEL`/`APP_ENV`/`NEXT_PUBLIC_APP_ENV`
  containing "prod" is refused.
- Against a hosted target the run is serial (`workers: 1`). Parallel bursts of Auth admin user
  creation returned Cloudflare 521/500 from the dev project. An existing dev server is never reused
  on a hosted target, so the app and the tests always share one Supabase project.

## Fixtures and cleanup

- Each test creates its own users `e2e+<runId>-<worker>-<label>-<rand>@sackerl.test` via the Auth
  admin API, tagged with `user_metadata.e2e_run_id`. Each id is written to a per-run ledger
  (`e2e/.ledger/<runId>.jsonl`, ignored, outside Playwright's wiped `outputDir`) before sign-in.
- In a `finally` block, the fixture deletes exactly the users that test created. The global teardown
  re-sweeps every ledger on disk (this run and earlier failed runs) and fails the run if any delete
  fails. `E2E_KEEP_DATA=1` keeps the data and its ledger, and the next backend run sweeps it.
- Users are **never listed**. A delete also re-checks the `e2e+…@sackerl.test` pattern.
- Profiles, households and all household-owned rows cascade from `auth.users`.

## Placement

The placement specs call `requirePlacementSchema()`. When the target lacks `receipt_placements`, it
marks them **fixme** (expected-blocked) with the reason, instead of failing or passing silently.
Receipt-sourced stock can only be created through placement (SCKRL-311 lineage guard), so specs
that need receipt stock build it with the receipts builder and `POST /receipts/:id/placement`.

## Known product findings

- Malformed JSON on the items and shopping-list routes returns 500, not 400 (`request.json()`
  SyntaxError is not mapped). Placement and parse already return 400.

## Extending

1. Add `e2e/api/<feature>.e2e.ts`, import `{ test, expect, expectJson }` from
   `../support/fixtures`.
2. Put reusable setup in `e2e/support/builders/<feature>.ts`.
3. Cover the happy path, 401, outsider isolation and the main 400/409/422 cases.
4. Gate specs on migrations not yet everywhere with a schema probe like `support/schema.ts`.
5. When web product UI lands, add browser specs under `e2e/ui/` with a new project.

## Run record

| Date       | Target                        | Result                                                                                                             |
| ---------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 2026-11-02 | none (offline)                | 6 smoke passed, 77 backend skipped                                                                                 |
| 2026-11-02 | remote dev, SCKRL-311 applied | **82 passed / 0 failed / 0 skipped** (3.0 min, serial); teardown sweep: all run users confirmed absent, 0 failures |
