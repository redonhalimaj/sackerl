# Codex / GPT QA handover: Stage 1 receipt loop (2026-11-04)

**From:** Claude Chair session (Opus 5.5). **To:** Codex / GPT, as the independent QA seat. **Owner direction
(2026-11-04):** Codex/GPT performs the Stage 1 QA. Claude sessions continue implementation afterwards, using what
Codex documents here.

Codex is **QA only** for this handover. It writes no product code. It reports findings for Claude to fix, which
keeps the implementer separate from QA.

## 1. Where things stand

**Integration branch:** `feature/stage1-receipt-loop`, pushed. HEAD `3884563` at the time of writing.
`origin/dev` already has PR #8 (merged at `6c07803`). Everything after that is on stage1 only.

| Ticket                                                                | State                                                                                          | Evidence                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SCKRL-311 atomic placement backend                                    | Merged and installed on dev                                                                    | [board](../council/SCKRL-311.md); web E2E against dev                                                                                                                                     |
| SCKRL-912 / 913 / 914 placement codes, SQL suite in CI, rollback doc  | Merged                                                                                         | status.md Decision Log                                                                                                                                                                    |
| SCKRL-907 web API E2E (Playwright)                                    | Merged                                                                                         | `docs/qa/e2e-web.md`; 89/89 against dev                                                                                                                                                   |
| SCKRL-908 mobile E2E (**Maestro**)                                    | Merged (5d12366)                                                                               | [board](../council/SCKRL-908.md); `docs/qa/e2e-mobile.md`                                                                                                                                 |
| SCKRL-305 placement screen                                            | Done, merged (68699b2)                                                                         | [board](../council/SCKRL-305.md); Maestro 10/10 and fault 3/3                                                                                                                             |
| SCKRL-304 / 312 review, expiry and Home resume                        | Done, owner decision A                                                                         | Remaining items are covered by the [manual checklist](../qa/stage1-manual-checklist.md)                                                                                                   |
| SCKRL-921 retailer alias spike                                        | Conditional GO                                                                                 | Needs 20–30 real receipts from the owner                                                                                                                                                  |
| SCKRL-924 Scan "Household not found" for a new user                   | **Ready for QA**: pushed branch `origin/fix/SCKRL-924-household-on-scan` (6c0a1a4); not merged | Maestro 11/11 (`20261104211210-m2iz`), fault 3/3 (`20261104212328-cehm`); [board](https://github.com/redonhalimaj/sackerl/blob/fix/SCKRL-924-household-on-scan/docs/council/SCKRL-924.md) |
| SCKRL-922 / 923 auth email overflow; shopping-list Add needs two taps | Open, not started                                                                              | Found by Maestro                                                                                                                                                                          |

## 2. Codex QA tasks, in order

### Q1. Independent review of the merged Stage 1 diff

Diff `origin/dev...origin/feature/stage1-receipt-loop`. Focus on:

- **Placement:** `apps/mobile/app/receipt-placement/[id].tsx` and `apps/mobile/lib/receipt-placement.ts`.
  - One idempotency key per attempt.
  - The same key and identical body on retry.
  - A new key only after a definite failure.
  - The pending attempt survives an app kill.
  - "Still confirming" never appears after confirmed success.
- **Home:** `apps/mobile/app/(tabs)/index.tsx:392`, `:629`. It must use `listUnplacedReceiptReviews`, so placed receipts don't show as pending.
- **Review CTA:** `apps/mobile/app/receipt-review/[id].tsx`. "Continue to placement" is enabled only for a clean, saved, fully reviewed review.
- **Fault hook:** `apps/mobile/lib/placement-fault-injection.ts`. It must be inert unless `__DEV__`, `APP_ENV=dev` and the fault flag are all set.
- **L3:** no writes to the receipt row after placement.

### Q2. Re-run the automated suites (needs a macOS host)

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test   # don't run turbo build and typecheck in one command
pnpm --filter @sackerl/web e2e:api                               # Playwright against dev, serial
MAESTRO_CLI_NO_ANALYTICS=1 node apps/mobile/e2e/run.mjs          # expect 10/10 (11/11 once 924 merges)
MAESTRO_CLI_NO_ANALYTICS=1 node apps/mobile/e2e/run.mjs --placement-fault   # expect 3/3; stop Metro on :8081 first
node apps/mobile/e2e/run.mjs --cleanup <runId>                   # only if a run crashed and left a user behind
```

**Prerequisites:**

- Maestro 2.12.1 (`brew install mobile-dev-inc/tap/maestro`).
- A booted iPhone simulator with Expo Go.
- Ignored `.env` and `apps/mobile/.env.local` files, with values from the owner. Never commit or print them.
- If typecheck complains about `/receipt-placement/[id]`, the ignored `apps/mobile/.expo/types/router.d.ts` is stale. Run `npx expo start` once to regenerate it.

### Q3. Stage 1 manual checklist

Run [docs/qa/stage1-manual-checklist.md](../qa/stage1-manual-checklist.md) with the owner. It has 11 checks: save conflicts, back with unsaved edits, VoiceOver, expiry choice, offline, and account isolation. Tick the boxes in that file and give the date.

### Q4. Known weak spots to probe

1. **Flow 56 "Try again":** the replay path has never run live, because Check status always resolved first. Unit and web tests cover it. Try to force the replay path manually.
2. **Flow 90 sign-out:** the sign-out tap is now `optional` because of a timing race. Confirm this doesn't hide a real failure.
3. **Flow 55 pending check:** it counts rows, so it only holds while fewer than 3 reviews are pending.
4. **SCKRL-924** (`origin/fix/SCKRL-924-household-on-scan`, diff against stage1): Scan and the shopping list call `ensureHousehold`, and a race on insert (409) now re-reads the existing row (`packages/api-client/src/profile.ts`). Verify a new user can go straight to Scan, that only one household is created, and check the `getHousehold` caller audit on its board. Known edge: if the household insert succeeds but the `household_members` insert fails, the membership row is never created. Fixing that needs an atomic RPC (SQL); flag it, don't fix it.

## 3. How to report back (what Claude reads next)

Write the results to **`docs/qa/codex-stage1-qa-2026-11.md`**:

- What you ran, with commit SHAs and run ids.
- Findings ranked blocking / high / medium / low. Each one needs `file:line`, a concrete failure scenario, and a suggested fix.
- The results of the checklist boxes.
- A vote: AGREE (Stage 1 ready to merge into `dev`) or OBJECT, with the reason.

Also add one row to the `status.md` Decision Log. **Do not edit product code**, so Claude stays the only writer, and
don't merge into `dev` or `main`. The owner and the Claude Chair do that.

## 4. Rules (unchanged)

- Board Council: unanimous seats, then the Chair weighs in, then decisions are logged ([memory and README](../council/)).
- Secrets live only in ignored `.env*` files. Real receipts go only in the ignored `.local/receipt-corpus/`.
- The repo is public, so CI on the self-hosted runner `sackerl-macbook` keeps its guard against PRs from forks.
- No scraping retailers without a separate legal decision.

## 5. Ready-to-paste prompt for Codex

> You are the independent QA seat for Sackerl Stage 1. Read `docs/agents/codex-qa-handover-2026-11-04.md` and the
> `status.md` Decision Log. Check out `origin/feature/stage1-receipt-loop`. Do Q1–Q4 in order without changing
> product code, and write the results to `docs/qa/codex-stage1-qa-2026-11.md` with file:line findings and an
> AGREE/OBJECT vote. Add one Decision Log row. Commit only those docs on a branch `qa/codex-stage1`, and push that
> branch for the owner.

## 6. After Codex: resume prompt for the next Claude session

> You are the Claude Chair for Sackerl (board Council, see memory `board-council-workflow`). Read `status.md` (latest
> Decision Log rows), `docs/qa/codex-stage1-qa-2026-11.md` and this handover. Steps:
>
> 1. Merge SCKRL-924 (`fix/SCKRL-924-household-on-scan`, 6c0a1a4) into stage1 if Codex's QA AGREEs, otherwise fix its findings first.
> 2. Fix each Codex finding, using worker sessions or agents, with an independent QA seat for each.
> 3. When Codex and the Chair both AGREE, propose merging stage1 into `dev`; the owner approves.
> 4. Then take SCKRL-922/923 and the next roadmap step from `PROGRAM.md` (308 receipt media, 307 real capture).
