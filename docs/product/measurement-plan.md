# Sackerl Product Measurement Plan

Last reviewed: 2026-09-06

Ticket: SCKRL-024

Status: Accepted; SCKRL-024 Done. Instrumentation is deferred to explicit engineering tickets.

## Purpose

Measure whether Sackerl helps a household maintain trustworthy food stock, use food in time, and
avoid unnecessary purchases. Metrics must reveal product and model quality without collecting raw
receipt content, product names, health data, or other unnecessary personal data.

## Data Rules

- Collect an event only when it supports a named metric or reliability investigation.
- Never send email, personal names, receipt text/images, store names, object URLs, access tokens,
  free-form item names, recipe notes, allergies, or health data to product analytics.
- Use bounded enums, counts, durations, versions, and reason codes.
- Use an environment-specific pseudonymous household analytics key when a household-level measure is
  required. Treat it as personal data, restrict access, and never expose the key back to clients.
- Use an ephemeral flow identifier to connect receipt pipeline stages. Do not use a receipt database
  identifier as an analytics property.
- Keep operational job logs separate from product analytics.
- Consent, access, deletion, provider, and regional-processing decisions must be approved before
  production instrumentation.

## Common Event Envelope

| Field                     | Rule                                                                        |
| ------------------------- | --------------------------------------------------------------------------- |
| `event_name`              | Versioned allow-listed event name                                           |
| `schema_version`          | Positive integer                                                            |
| `occurred_at`             | Server-normalized timestamp                                                 |
| `app_version`             | Release identifier                                                          |
| `platform`                | `ios`, `android`, or `web`                                                  |
| `environment`             | `dev`, `staging`, or `prod`                                                 |
| `locale`                  | Supported language/region code                                              |
| `household_analytics_key` | Server-derived pseudonymous key; omit when household linkage is unnecessary |
| `flow_key`                | Random short-lived key for one receipt or recommendation flow               |

## Event Vocabulary

| Event                            | Purpose                               | Allowed properties                                                                              |
| -------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `onboarding_completed`           | Activation and setup completion       | zone-count bucket, custom-zone boolean, duration bucket                                         |
| `manual_item_confirmed`          | Manual activation path                | category ID, zone key, quantity-unit enum, expiry-source enum                                   |
| `receipt_capture_started`        | Capture funnel denominator            | source enum: camera, gallery, PDF                                                               |
| `receipt_capture_completed`      | Capture reliability                   | source enum, duration bucket, retry-count bucket, media-type enum                               |
| `receipt_capture_failed`         | Recoverable acquisition failures      | source enum, safe error code, retry-count bucket                                                |
| `receipt_processing_completed`   | OCR reliability and latency           | provider/parser version, locale, duration bucket, attempt-count bucket, line-count bucket       |
| `receipt_processing_failed`      | OCR failure analysis                  | provider/parser version, safe error code, terminal boolean, attempt-count bucket                |
| `receipt_review_completed`       | Parser fidelity and correction effort | line-count bucket, accepted count, edited count, added count, ignored count, duration bucket    |
| `receipt_placement_completed`    | Core-loop completion                  | placed-count bucket, suggested-zone accepted count, overridden-zone count, expiry-source counts |
| `expiry_confirmed`               | Expiry trust                          | prior source enum, new source enum, override boolean, days-difference bucket                    |
| `stock_outcome_recorded`         | Consumption and waste outcome         | outcome enum, category ID, quantity-unit enum, quantity bucket, days-from-acquisition bucket    |
| `shopping_item_outcome_recorded` | Shopping-list usefulness              | origin enum, outcome enum, duplicate-avoided boolean                                            |
| `recommendation_feedback`        | Later recommendation usefulness       | recommendation kind/version, response enum, reason-code enum, confidence band                   |

Raw product names, receipt identifiers, receipt totals, exact timestamps tied to content, and
free-form error messages are not allowed event properties.

## Metric Definitions

| Metric                 | Definition                                                                                           | Source                                      | Stage |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----- |
| Activation             | Household completes one reviewed-and-placed receipt, or confirms five manual items within seven days | Product events plus inventory commands      | 1     |
| Capture reliability    | Completed receipt captures divided by started captures; also median retry-count bucket               | Capture events                              | 1     |
| Processing reliability | Terminal successful receipt jobs divided by all terminal jobs, by provider/parser version and locale | Operational job records, aggregated         | 1     |
| Parser field fidelity  | Reviewed fields left unchanged divided by reviewed fields; reported by field and version             | Review command aggregates                   | 1     |
| Core-loop completion   | Parsed receipt flows reaching reviewed and placed states                                             | Receipt lifecycle events                    | 1     |
| Inventory fidelity     | Sampled active stock rows confirmed without correction                                               | Future confirmation events                  | 2     |
| Expiry trust           | Confirmed-expiry coverage, estimate override rate, and false-positive reminder outcome rate          | Expiry facts and confirmation events        | 1-2   |
| Waste outcome          | Quantity and estimated value consumed versus discarded; never raw row count alone                    | Inventory events and later price facts      | 2-3   |
| Shopping value         | Suggested list items accepted, edited, dismissed, bought, and prevented as duplicates                | Shopping and recommendation feedback        | 3     |
| Budget value           | Planned versus actual spend and estimated avoidable duplicate-buy value                              | Reviewed prices, budgets, shopping outcomes | 3     |
| Recipe value           | Suggestions viewed, cooked, dismissed, and stock quantities actually consumed                        | Recommendation and inventory events         | 4     |
| Retention              | Weekly households completing a confirmed food-management action                                      | Pseudonymous household event aggregates     | 1+    |
| Safety                 | Cross-household exposure or explicit hard-constraint violations; target is zero                      | Security tests and safety evaluations       | All   |

## Quality Evaluation Versus Product Analytics

Deterministic quality evaluation uses versioned, de-identified fixtures and produces accuracy,
regression, latency, and cost reports. It does not use live household events as an unreviewed test
corpus. Product analytics measures flow completion and user corrections using bounded aggregates.

OCR quality is not proven by four language examples. SCKRL-810 must define a fixed evaluation set and
report line detection plus field accuracy per locale, store family, provider, and parser version.
Recommendation quality must first compare deterministic rules with accepted, edited, dismissed, and
completed outcomes before an AI model is introduced.

## Retention And Access

- Raw product events: 90 days by default.
- Pseudonymous weekly aggregates: 13 months by default for seasonality and retention comparison.
- Operational job records: retain safe status/error metadata for 90 days; receipt content follows
  ADR-0001 and is not copied into analytics.
- Evaluation fixtures: retained with version control only when de-identified and approved.
- Access is limited to named product, QA, and infrastructure roles with an audit trail.
- Account or household deletion removes linkable event data where technically and legally required;
  irreversible aggregates may remain only after privacy review.

Retention values are engineering defaults pending privacy/legal review before production.

## Implementation Gates

- SCKRL-010 selects error-reporting and analytics providers and documents consent/configuration.
- SCKRL-910 defines typed event schemas and server-side validation from this vocabulary.
- No telemetry ticket may add a free-form property without updating this plan and privacy review.
- Stage 3 buying intelligence cannot claim value until reviewed price data and inventory outcomes are
  sufficiently complete to calculate its metric denominator.
- Stage 6 health work requires a separate consent and sensitive-data measurement plan.
