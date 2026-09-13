# SCKRL-506 recipe expiry QA notes

Date: 2026-09-13

Status: Accepted by independent focused QA.

## Accepted QA boundary

SCKRL-506 is a narrow recipe recommendation gate for the current legacy `items.expires_on` field. It excludes stock that is not date-eligible on the request calendar day. Source-aware expiry provenance, warning labels, package evidence, notifications, nutrition, custom recipes, and AI behavior remain outside this ticket.

The current pilot calendar policy is Europe/Vienna. The scorer and client factories must derive one calendar day per request from an injectable clock and an explicit IANA time zone. Tests should not depend on the machine's local time zone.

## Required adversarial coverage

- The pure scorer must require an explicit valid calendar day and reject or fail closed on invalid dates. It must not read the current clock internally; parsing an explicitly supplied date is allowed.
- Stock with `expires_on` before the request day must not count toward coverage, `matchedItemIds`, list suggestions, or recipe detail matched IDs.
- Stock expiring exactly on the request day remains eligible.
- Future-dated stock remains eligible.
- Missing, `null`, empty, and malformed expiry values are ineligible for recipe support.
- A list request with no eligible matches returns no suggestions even when `minScore` is `0`.
- A direct recipe detail request remains available with score `0`, no matched IDs, and every ingredient reported missing when all matching stock is expired or unknown.
- The old phone-test scenario must be fixed directly: an item dated 2026-06-26 must not support a recipe on 2026-09-13.
- List and detail scoring must agree for the same recipe, same stock, same clock, and same time zone.
- Matched item IDs must contain only eligible item IDs; expired or unknown matching names must not leak into the detail action path.
- Vienna midnight must be deterministic: around UTC/Vienna day boundaries, eligibility uses the configured Europe/Vienna calendar day.
- Vienna DST coverage must include at least one spring-forward or fall-back transition so a UTC timestamp maps to the intended local calendar date.
- Leap-day parsing must be explicit: 2028-02-29 is valid, while invalid calendar dates are rejected or treated as ineligible according to the implementation contract.
- The mobile and web recipe client factories must visibly configure Europe/Vienna for the current Austrian pilot.

## Acceptance evidence

Implementation review on 2026-09-13 confirmed the SCKRL-506 contract landed in `packages/api-client/src/recipes.ts`:

- `RecipeStockItem` includes `expiresOn`, and recipe stock queries select `id,name,expires_on`.
- `scoreRecipeAgainstStock(recipe, stockItems, today)` validates `today`, filters stock before ingredient matching, and keeps expired, null, missing, empty, timestamp-shaped, unpadded, and impossible dates out of `matchedIngredients` and `matchedItemIds`.
- `listSuggestions` captures one calendar day per request, suppresses zero-coverage suggestions even at `minScore: 0`, and then applies the minimum score, sorting, and limit.
- `getSuggestion` uses the same scored path and can return a valid recipe detail with zero coverage and all ingredients missing.
- The shared recipes client requires `calendarTimeZone`, accepts an injectable clock, and the mobile/web factories explicitly pass `Europe/Vienna`.

Focused validation run by QA:

```sh
pnpm --filter @sackerl/api-client test -- recipes.test.ts
```

Result: `src/recipes.test.ts` passed with 29 tests.

```sh
pnpm --filter @sackerl/api-client typecheck
```

Result: API-client typecheck passed.

The tests cover the reported 2026-06-26 stock item against 2026-09-13, today/yesterday/future eligibility, null/missing/empty/malformed dates, invalid and valid leap days, minScore-zero empty-list suppression, detail zero-coverage behavior, list/detail equality, one clock read per request, invalid time-zone and clock failures, Vienna midnight, and Vienna fall-back repeated-hour timestamps.

No schema, media, OCR, notification, nutrition, custom-recipe, AI, source-aware expiry-label, or live-device behavior was validated for this ticket.
