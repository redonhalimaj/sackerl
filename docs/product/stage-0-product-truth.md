# Stage 0 Product Truth Audit

Last reviewed: 2026-09-06

Tickets: SCKRL-020, SCKRL-021

Status: SCKRL-021 Done. SCKRL-020 remains Ready for current product-owner feedback.

## Decision

SCKRL-301, SCKRL-302, and SCKRL-303 remain historically Done because their documented scaffold,
schema, deterministic parsing, and runtime checks are real. They are not production-complete receipt
features. Their production gaps are now explicit follow-up tickets and SCKRL-304/305 remain gated by
the contracts in ADR-0001.

## Evidence Matrix

| Ticket    | Verified foundation                                                                   | Production or literal acceptance gap                                                               | Follow-up      |
| --------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------- |
| SCKRL-301 | Scan shell, controls, manual fallback, navigation, and prior Expo Go visual QA        | No camera bytes, gallery/PDF picker, permission flow, coverage detection, or real upload           | SCKRL-307      |
| SCKRL-302 | Receipt schema, status enum, RLS, client CRUD, authenticated dev persistence          | Synthetic `sackerl://` reference; no private object, content validation, signed access, or cleanup | SCKRL-308      |
| SCKRL-303 | Receipt-item schema, confidence bands, deterministic parser, routes, and dev readback | Synchronous sample text; no real provider, durable retry, completion signal, or safe reprocessing  | SCKRL-309, 310 |
| SCKRL-405 | Deterministic category-and-zone expiry estimator and unit coverage                    | Estimated and user-entered values share one field without durable provenance or confirmation       | SCKRL-406      |
| App QA    | 69 shared-package unit tests plus recorded manual and authenticated runtime checks    | Mobile and web have zero test files; no repeatable cross-application journey                       | SCKRL-022, 906 |
| Placement | Batch item insert exists                                                              | No reviewed-line lineage, inventory event, idempotency key, or all-or-nothing receipt finalization | SCKRL-311      |

## Source Evidence

- `apps/mobile/app/(tabs)/scan.tsx` creates a synthetic receipt URI for camera, gallery, and PDF.
- `apps/mobile/package.json` has no camera, image picker, or document picker dependency.
- `apps/web/lib/receipt-parsing.ts` returns deterministic sample text for synthetic URIs, runs in the
  request, and leaves real provider adapters unwired.
- `packages/api-client/src/receipts.ts` replaces receipt items with separate delete and insert REST
  calls; an insert failure can leave the prior good parse deleted.
- `supabase/migrations/20260804100000_sckrl_303_receipt_parsing.sql` stores confidence but no review,
  correction, active parse generation, reviewer, or parser-version state.
- `supabase/migrations/20260531203000_sckrl_201_item_data_model.sql` stores one `expires_on` value and
  no receipt-line lineage or expiry provenance.
- `apps/mobile` and `apps/web` test scripts use `--passWithNoTests` and currently find no test files.

## Classification

### Defects

- Parsed-line replacement is not atomic and can erase a prior good parse after an insert failure.
- The Expiring screen filter control is visible without an implemented action.

The parse-replacement defect belongs to SCKRL-310. The inert filter needs product-owner confirmation
of intended behavior during SCKRL-020 before a separate UI ticket is accepted.

### Usability Gaps

- Receipt capture reports an upload although it persists no media bytes.
- The receipt flow does not navigate to processing, review, placement, or recovery states.
- Expiry UI can label a value as estimated while persistence cannot preserve that distinction.

### Documentation Drift

- Historical Done status described valid foundations but previously lacked explicit production-gap
  links. `status.md` now identifies the scope and follow-up ticket for SCKRL-301 through SCKRL-303.
- Green mobile/web test commands previously did not make their zero-test state visible in the main
  project handoff. SCKRL-022 and SCKRL-906 now make that limitation explicit.

### New Scope

No AI, nutrition, buying-pattern, notification, or general-storage implementation is released by
this audit. Those remain staged in `PROGRAM.md` and require learning-grade events plus stage gates.

## Receipt-To-Stock Prerequisites

SCKRL-304 cannot move to Ready until SCKRL-310 publishes the durable review contract and QA accepts
its fixtures and failure semantics.

SCKRL-305 cannot move to Ready until:

- SCKRL-304 provides a completed reviewed receipt.
- SCKRL-406 provides expiry facts and confirmation semantics.
- SCKRL-311 provides idempotent, atomic placement, receipt-line lineage, and inventory events.

Real user receipt completion additionally requires SCKRL-307, SCKRL-308, and SCKRL-309.

## Product-Owner QA Intake

SCKRL-020 remains open because no current-version findings were supplied with this launch. Record
each observation with:

| Field           | Expected content                                                   |
| --------------- | ------------------------------------------------------------------ |
| Journey         | Screen and task being attempted                                    |
| Environment     | iOS/Android/web, device, app version, and dev/staging              |
| Observation     | What happened, without credentials or private receipt content      |
| Expected result | What the user expected                                             |
| Reproduction    | Minimal repeatable steps                                           |
| Impact          | Blocker, major, moderate, or minor                                 |
| Evidence        | Screenshot or log reference stored safely, not pasted with secrets |
| Classification  | Defect, usability gap, documentation drift, or proposed new scope  |

The Business Process Analyst deduplicates these observations and proposes tickets. The Orchestrator
accepts ownership, dependencies, and severity before implementation begins.
