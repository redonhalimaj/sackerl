# Council board: SCKRL-911, Dependabot security fixes

## Round 0

- **Question:** Can the Dependabot advisories be cleared without breaking the web or mobile apps?
- **Acceptance:**
  - Critical advisories reach 0.
  - All checks pass, including the web build.
  - Web E2E passes against dev.
  - The mobile Metro bundle builds.
  - No Expo-pinned packages are overridden.
- **Seats:** DevOps (implementer, Sonnet 5) and QA (independent, Sonnet 5).

## Round 1

- **DevOps:** implemented in `2c04cdf`.
  - `next` 15.5.28, `vitest` 4.1.12, `vite` 6.
  - Scoped `pnpm.overrides`.
  - Audit: 111 findings (7 critical) → 5.
  - **Vote: AGREE.**
- **QA:** branch `qa/SCKRL-911` (`de56218`), merged onto stage1 with the lockfile regenerated.
  - turbo `--force` passes 18/18. The web build passes.
  - Web E2E: 82/82 against dev, cleanup clean.
  - `expo export` for iOS bundles OK.
  - Ask: bump Playwright (>=1.55.1).
  - **Vote: AGREE.**

## Council Proposal

- Merge into `feature/stage1-receipt-loop`.
- Accept the remaining development-tooling findings (zod, glob, deepmerge, minimatch, plus one more) as risk.
- Expo SDK 57 patch bump goes to a separate ticket.

## Chair weigh-in

- **Vote: AGREE.** Merged.
- The Chair applied QA's ask: `@playwright/test` 1.64.1. The audit is now 5 (1 low, 3 moderate, 1 high), all dev tooling.
- Web typecheck, lint and unit tests pass, and the offline E2E smoke passes after the bump.
- **Ratified 2026-11-02.**
