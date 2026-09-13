# SCKRL-506 recipe expiry eligibility

Status: Done locally, 2026-09-13. Independent QA and Sol integration accepted; see
[QA evidence](../qa/sckrl-506-recipe-expiry-qa.md).

SCKRL-506 prevents overdue or undated stock from powering recipe suggestions. The immediate
trigger was feedback from September 13 testing where a stock item with a June 26 expiry date still
matched a recipe recommendation.

## Policy

Recipe scoring only counts active stock items whose `expires_on` value is a valid Gregorian
`YYYY-MM-DD` date on or after the recommendation calendar day. Items with expired, null, missing, or
malformed expiry dates remain in stock, but they do not cover recipe ingredients and their item IDs
do not appear in recipe match details.

The recipe list suppresses zero-coverage recipes even when callers pass `minScore: 0`, so a
household with no eligible matching stock receives no "from your stock" suggestions. Recipe detail
can still return a valid recipe with `score: 0`, all ingredients missing, and no matched item IDs.

This ticket does not delete overdue items, label food as safe, add notification behavior, change
storage schema, or add OCR/provider flows. EFSA's consumer guidance distinguishes use-by dates as a
safety concept and best-before dates as a quality concept; Sackerl does not guarantee safety from a
stored or estimated date alone. See
[EFSA date-marking guidance](https://www.efsa.europa.eu/en/news/use-or-best-new-tool-support-food-operators).

## Calendar

The shared recipes client derives today's date once per list/detail request from an injected clock
and a required IANA `calendarTimeZone`. The mobile and web app factories currently pass
`Europe/Vienna` visibly for the Austrian pilot.

This is a temporary pilot assumption. SCKRL-406 should replace the fixed app factory timezone with a
household calendar-timezone setting so recommendation eligibility follows the household rather than
the deployed app default.

## Acceptance

- `scoreRecipeAgainstStock(recipe, stockItems, today)` requires a strict ISO calendar date and
  filters stock by expiry inside the exported scorer.
- Stock rows selected for recipe scoring include `id`, `name`, and `expires_on`.
- Today and future dates are eligible; yesterday, null, missing, or malformed dates are not.
- List and detail responses use the same eligibility boundary, with expired item IDs absent from
  `matchedIngredients` and `matchedItemIds`.
- Tests cover direct scorer enforcement, Gregorian leap dates, today/yesterday boundaries, Vienna
  midnight against UTC, DST, unknown dates, zero-coverage list suppression, and list/detail parity.
