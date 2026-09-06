# Done Ticket Truth Audit

Last updated: 2026-09-06

Status: Accepted; SCKRL-021 Done. This audit checks Done-ticket evidence against literal acceptance criteria and records follow-up tickets for production gaps.

## Scope

- SCKRL-301 Camera capture screen
- SCKRL-302 Receipt upload and storage
- SCKRL-303 OCR and line-item parsing
- Dependencies that affect SCKRL-304 Review and SCKRL-305 Placement

## Findings

| Severity                            | Ticket              | Evidence                                                                                                                                                                                                                                                                      | Finding                                                                                                                                                                                        | Follow-up               |
| ----------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Blocker for production receipt loop | SCKRL-301           | `apps/mobile/app/(tabs)/scan.tsx:132` builds `sackerl://receipt/...`; `apps/mobile/app/(tabs)/scan.tsx:168` persists that mock URL; `apps/mobile/app/(tabs)/scan.tsx:191` maps Gallery/PDF buttons to the same simulated path.                                                | The Done evidence validates the visual Scan shell and persistence handoff, not real camera/gallery/PDF acquisition. Literal acceptance says capture shoots a still and uploads to SCKRL-302.   | SCKRL-307               |
| Blocker for production receipt loop | SCKRL-302           | `supabase/migrations/20260621110000_sckrl_302_receipts.sql:10` creates `receipts`; `supabase/migrations/20260621110000_sckrl_302_receipts.sql:13` stores `image_url`; `packages/api-client/src/receipts.ts:258` only validates that the value is non-empty and <= 2048 chars. | The persistence foundation is real, but private binary media upload/storage is not implemented. Literal acceptance says captured image uploads to S3-compatible storage.                       | SCKRL-308               |
| Blocker for production receipt loop | SCKRL-303           | `apps/web/lib/receipt-parsing.ts:34` defines deterministic sample text; `apps/web/lib/receipt-parsing.ts:49` returns the sample for synthetic receipt URLs; `apps/web/lib/receipt-parsing.ts:153` defaults `OCR_PROVIDER` to deterministic.                                   | The parser foundation and provider boundary are real, but production OCR is not wired and no completion webhook/push exists. Literal acceptance requires provider OCR and completion emission. | SCKRL-309               |
| High                                | SCKRL-303/SCKRL-304 | `supabase/migrations/20260804100000_sckrl_303_receipt_parsing.sql:26` creates `receipt_items`; `packages/api-client/src/receipts.ts:50` exposes confidence and inferred fields, but no review state or correction provenance.                                                 | SCKRL-304 needs durable user review state separate from confidence before it can safely enable or block placement.                                                                             | SCKRL-310               |
| High                                | SCKRL-303/SCKRL-305 | `packages/api-client/src/receipts.ts:673` deletes existing receipt items before inserting replacements; insertion starts at `packages/api-client/src/receipts.ts:691`.                                                                                                        | Replacement is not guaranteed as one receipt-scoped transaction through the client path. Placement should not compound this with client-only batch item creation.                              | SCKRL-310 and SCKRL-023 |
| High                                | SCKRL-405/SCKRL-305 | Current item expiry stores one displayed date; SCKRL-405 estimates are saved into the same `expires_on` behavior as user-entered dates.                                                                                                                                       | Receipt-created stock would inherit expiry ambiguity unless exact, estimated, and confirmed dates become distinguishable.                                                                      | SCKRL-406               |
| Medium                              | Cross-journey QA    | `apps/mobile/package.json` and `apps/web/package.json` use `vitest run --passWithNoTests`; current QA evidence relies heavily on manual Expo Go and route smoke checks.                                                                                                       | Core journeys lack repeatable mobile E2E, integration, accessibility, and failure-path coverage.                                                                                               | SCKRL-906 to 909        |

## Status Recommendation

- Keep SCKRL-301, SCKRL-302, and SCKRL-303 as Done, but describe them as foundation tickets where production gaps are explicit.
- SCKRL-301, SCKRL-302, and SCKRL-303 remain Done as foundation tickets with explicit production follow-ups.
- SCKRL-021 and SCKRL-022 can move to Done after Orchestrator integration review.
- Do not move SCKRL-304 forward until SCKRL-020 and SCKRL-310 are Done.
- Do not move SCKRL-305 forward until SCKRL-304, SCKRL-406, and SCKRL-311 have acceptance evidence.
