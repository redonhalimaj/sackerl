# Sackerl program roadmap

Notion-ready page prepared for the Sackerl program workspace.

**Snapshot:** 2026-09-29

**Publication state:** Prepared locally; Notion creation rejected by workspace block limit on 2026-09-27.

**Target parent:** [Sackerl](https://app.notion.com/p/Sackerl-05812383fdeb466391e5613d9d5f3c9a)

**Published roadmap URL:** Pending workspace capacity

**Notion database URL:** No new database created; existing databases preserved

This page is a planning view over the repository's accepted program and live ticket state. It does
not create tickets, change ticket states, claim a release, or replace `PROGRAM.md`, `features.md`,
or `status.md`. Statuses below are intentionally qualitative; no progress percentages or delivery
dates are implied.

## Your feedback in the program

The [September 13 triage](phone-feedback-triage-2026-09-13.md) maps the original phone findings
into tickets; [September 29 simulator findings](simulator-findings-2026-09-29.md) records the latest
screenshots and recovery issues. Recording a request does not mean it is implemented.

| Requested outcome                                                 | Tracking                | Current delivery                                 |
| ----------------------------------------------------------------- | ----------------------- | ------------------------------------------------ |
| Keep overdue/unknown stock out of recipe matching                 | SCKRL-506               | Done locally                                     |
| Distinguish estimated and confirmed expiry                        | SCKRL-406               | Review; runtime gates remain                     |
| Yellow estimate warning, red overdue warning and explicit discard | SCKRL-407               | Todo                                             |
| Snooze without changing expiry                                    | SCKRL-408               | Todo                                             |
| Overdue push reminders, controls and notification inbox           | SCKRL-411/412/421       | Specified, not implemented; Stage 1              |
| Optional package date photo/barcode                               | SCKRL-409               | Later backlog after media/identity foundations   |
| Personal recipes and collection sharing                           | SCKRL-507/508           | Later Stage 4 / discovery                        |
| iPhone-style swipe interactions                                   | SCKRL-902               | Todo; Stage 1 bounded gesture/accessibility work |
| Optional nutrition/calories                                       | SCKRL-930               | Stage 6 discovery                                |
| AI assistance                                                     | PROGRAM.md later stages | Planned; core food loop first                    |

## Program stages

| Stage                                    | Purpose and outcome                                                                                                                                          | Current state                                                                                                              | Entry or exit gate                                                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Restore product truth                | Reconcile what is real, scaffolded, simulated, and still missing; establish QA, architecture, and measurement evidence.                                      | Complete locally. SCKRL-020 through SCKRL-024 are Done locally; SCKRL-025 code overview is also Done locally.              | Exit evidence is the accepted product-owner triage, truth audit, core journey matrix, reliable food-loop ADR, and measurement plan.                                                                               |
| 1 — Complete the reliable food loop      | Capture a real receipt, review uncertain lines, place stock atomically, preserve expiry provenance, deliver controllable reminders, and recover from errors. | In progress. SCKRL-310 and SCKRL-506 are Done locally; SCKRL-406 is Review; SCKRL-908 is In Progress; SCKRL-304 is Review. | Exit only after a real receipt reaches reviewed and placed stock, lineage and idempotency are evidenced, expiry states are clear, and reminder/device gates pass.                                                 |
| 2 — Build the learning data spine        | Record trustworthy product, inventory, price, storage-choice, correction, and privacy history without depending on an AI model.                              | Planned; gated on Stage 1 evidence and a reliable history of real household use.                                           | Entry requires Stage 1 completion. Exit requires reconstructable stock/events, calculable household patterns, correction-safe normalization, and privacy export/deletion covering source and derived data.        |
| 3 — Budget-aware buying intelligence     | Produce explainable deterministic buy, delay, reduce, or skip suggestions from stock, cadence, expiry, price, and budget history.                            | Planned; gated on sufficient pilot history from Stage 2.                                                                   | Entry requires sufficient trustworthy history. Exit requires backtest evidence against a simple baseline, visible assumptions, user correction, and no autonomous purchase/payment.                               |
| 4 — Personalized recipes and meal timing | Use quantities, expiry urgency, budget, shopping schedule, tastes, and hard dietary constraints in recipe planning.                                          | Planned; gated on mature recipe/data contracts and Stage 3 evidence.                                                       | Exit requires quantity-safe, non-destructive consumption, hard constraint tests, explainable tradeoffs, and licensed recipe data.                                                                                 |
| 5 — Household storage assistant          | Learn household storage preferences and ask concise questions when placement confidence is low.                                                              | Planned; gated on food-loop reliability and the Stage 4 direction.                                                         | Entry requires the earlier stages and typed, user-confirmed proposal flows. Program evidence includes learned placement evaluation, correction rate, unnecessary-question rate, latency, cost, and safe fallback. |
| 6 — Nutrition and wellness safety layer  | Add optional nutrition-aware suggestions only with explicit consent, provenance, regional sources, and a clear non-medical boundary.                         | Planned; gated.                                                                                                            | No implementation before the product/legal decision, sensitive-data controls, vetted sources, and a zero-tolerance known-allergen test suite are accepted.                                                        |
| 7 — General household storage            | Test whether location and reminder strengths transfer to one adjacent non-food domain.                                                                       | Planned; gated discovery.                                                                                                  | Begin with interviews and one opt-in pilot domain. Generalize only after domain-specific quantity, safety, ownership, expiry, and reminder rules are defined; do not force all objects into the food model.       |

Stages 2–7 are future work. They are direction and gates, not authorization to implement every
listed record or feature. The immediate product promise remains: know what food is at home, where it
is, and what to use next.

## Stage 1 delivery path

The mobile-first delivery plan uses three checkpoints inside Stage 1. The alpha is an intermediate
checkpoint and does not waive the Stage 1 exit gate.

| Checkpoint            | Outcome                                                                                                                                                | Dependencies and sequencing                                                                                                                                                                                                                                                                                                                                                            | Exit evidence                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Internal mobile alpha | The owner can take a real supported receipt through acquisition, review, placement, restart, and maintenance without duplicate or unexplained changes. | SCKRL-310 review data is Done locally. SCKRL-406 must clear Review before SCKRL-311 can establish atomic placement. SCKRL-308 publishes private-media upload behavior before SCKRL-307; SCKRL-309 follows private media. SCKRL-304 source is in Review against its accepted SCKRL-020/SCKRL-310 contract; SCKRL-305 depends on SCKRL-304 and SCKRL-311. SCKRL-909 grows with the loop. | Real image to durable reviewed stock; explicit approval and receipt-line lineage; idempotent retries and rollback; recovery for denied permission, interrupted upload, OCR failure, manual fallback, and unfinished receipts; distinct unknown/estimated/confirmed expiry; safe manual actions; household authorization and private-media evidence; recorded platform/device evidence. |
| Small mobile beta     | A small number of households complete repeated shopping cycles without developer assistance.                                                           | Finish remaining Stage 1 acquisition, history/recovery, reminders, notification inbox, device/provider validation, staging builds, release configuration, account/media deletion, retention, error reporting, and backup/restore checks. Existing scope includes SCKRL-411, SCKRL-412, SCKRL-421, and SCKRL-920; do not infer additional ticket IDs from this page.                    | iOS and Android are tested independently before claiming both; opt-out, repeat suppression, local-time delivery, snooze, deep links, recovery, privacy, rollback, and release evidence pass. Use the measurement plan for receipt completion, correction effort, failures, review/placement time, and repeat confirmed stock actions.                                                  |
| Web companion         | After the mobile loop passes beta, provide shared-account sign-in, stock by location, expiring items, and a printable shopping list on web.            | Start with SCKRL-701 and SCKRL-715 plus separately scoped stock/expiry screens. Add SCKRL-711 only after the mobile receipt pipeline is proven and web review/placement scope is explicit.                                                                                                                                                                                             | Web uses the same private media, asynchronous processing, review, provenance, and finalization contracts. Public production promotion remains a separate release action.                                                                                                                                                                                                               |

Stage 1 remains closed to a production claim until all of the following are evidenced: real receipt
acquisition and private storage, durable OCR completion and retry behavior, review-state persistence,
atomic placement with receipt-line lineage, expiry provenance and confirmation, reminder controls and
device QA, and the applicable API/mobile journey checks. Deterministic fixtures and local builds are
useful development evidence but do not substitute for the real-receipt or device gates.

## Current queue

This is the useful next queue as of the snapshot date. It reflects the live states and roles in
`status.md`; dependencies are shown so the page can be maintained as a Notion board or table.

| Ticket    | State       | Primary owner  | Dependency / next evidence                                                                                                                                                                                                                                                          |
| --------- | ----------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SCKRL-406 | Review      | Backend        | Source corrections and independent source review are complete; 194 workspace tests pass. Corrected SQL replay and authenticated simulator/PostgREST acceptance remain pending. Both related migrations remain unapplied by Codex; the owner's hosted migration state is unverified. |
| SCKRL-908 | In Progress | QA             | Finish current mobile journey smoke coverage: development-build/Maestro path, isolated fixtures, authenticated journeys, failure handling, and accessibility checks. SCKRL-906 is Done locally.                                                                                     |
| SCKRL-308 | Ready       | Infrastructure | Publish private Supabase Storage upload, validation, signed access, retention, and cleanup contract. This unblocks real acquisition.                                                                                                                                                |
| SCKRL-304 | Review      | Frontend       | Review route and Scan entry are implemented; independent source QA, 44 mobile tests and iOS export pass. Connected edit/save and native visual/accessibility gates remain. Owner screenshots show only Scan-to-no-generation fallback, not parsed-line editing.                     |
| SCKRL-311 | Todo        | Backend        | Build idempotent, all-or-nothing receipt placement after SCKRL-406; preserve lineage, expiry facts, acquisition events, and retry safety.                                                                                                                                           |
| SCKRL-407 | Todo        | Frontend       | Add source-aware expiry warnings and overdue interaction after SCKRL-406; preserve explicit discard confirmation and accessible tap paths.                                                                                                                                          |
| SCKRL-408 | Todo        | Backend        | Separate reminder snooze state from expiry after SCKRL-406; publish the contract before reminder delivery.                                                                                                                                                                          |
| SCKRL-307 | Blocked     | Frontend       | Start after SCKRL-308 publishes the upload contract; implement real camera/gallery/PDF acquisition, cancellation, retry, permission recovery, and manual fallback.                                                                                                                  |
| SCKRL-309 | Todo        | Backend        | Start after private media exists; add durable OCR attempts/jobs, provider failure handling, retries, parser/provider versions, and client-visible completion.                                                                                                                       |
| SCKRL-907 | Todo        | QA             | Add authenticated API journey coverage after the accepted SCKRL-906 harness: household, stock, receipt parsing, recipes, shopping lists, authorization, invalid data, retries, and cleanup.                                                                                         |
| SCKRL-909 | Todo        | QA             | Extend receipt-to-stock automation after SCKRL-304/305 and SCKRL-307 through SCKRL-311 are complete; include drag and tap placement and duplicate-retry failures.                                                                                                                   |

Completed local anchors for this queue include SCKRL-020–024, SCKRL-025, SCKRL-310, SCKRL-506,
and SCKRL-906. “Done locally” is retained in the wording because it does not mean merged or
released.

## State and release vocabulary

| Term                     | Meaning in this program                                                                                                                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Done                     | The scoped ticket is implemented locally and its required local or independent validation has passed. A ticket may still need migration application, hosted runtime checks, device evidence, merge, or release work.                                           |
| Merged                   | The accepted change is merged into `main` and the durable repository documentation has been updated. Merged does not by itself certify a mobile or production release.                                                                                         |
| Release-ready / released | The relevant stage exit and release evidence have passed: supported builds, runtime/provider/device validation, privacy and recovery checks, operational rollback/release configuration, and required QA sign-off. Production promotion is an explicit action. |

For the current SCKRL-406 review, Codex has not applied the pending migrations. The owner ran the
adversarial SQL fixture in hosted Supabase and encountered `23503`: its synthetic household was
missing. The suite requires the disposable-database legacy seed before migration 406; this is not
a request to seed hosted household data. Clear prerequisite checks and corrected instructions are
now included. The owner's actual hosted migration state remains unverified. Authenticated
PostgREST and simulator journeys remain pending; source review, 194 tests, typecheck/lint, iOS
bundle export and the refreshed code-map check pass.

## Proposed Notion structure

Create one parent page named **Sackerl program roadmap** with these linked views:

1. **Program stages** — one row for each stage 0–7, with outcome, current state, entry gate, exit evidence, and stage owner/roles.
2. **Delivery checkpoints** — Alpha, Beta, and Web companion rows linked to their stage and ticket records.
3. **Ticket roadmap database** — the live queue and later accepted tickets.
4. **Evidence register** — QA reports, ADRs, measurement plans, migrations, device runs, release checks, and links to their source documents.
5. **Decisions and blockers** — open decisions, dependency blockers, owner, next evidence, and review date.

Recommended **Ticket roadmap** properties:

| Property          | Type          | Use                                                                                    |
| ----------------- | ------------- | -------------------------------------------------------------------------------------- |
| Ticket            | Title         | `SCKRL-XXX` and short name.                                                            |
| Status            | Select        | Todo, Ready, In Progress, Review, QA, Blocked, Done, Merged.                           |
| Stage             | Select        | Stage 0 through Stage 7.                                                               |
| Owner             | Person/select | Primary role owner from `TEAM.md`.                                                     |
| Supporting roles  | Multi-select  | QA, Backend, Frontend, Infrastructure, DevOps, Business Process Analyst, Orchestrator. |
| Tickets           | Relation      | Related or prerequisite SCKRL records.                                                 |
| Dependency        | Relation/text | Blocking ticket, accepted contract, migration, provider, or device prerequisite.       |
| Exit evidence     | Relation/text | QA report, test run, runtime/device evidence, ADR, migration replay, or release check. |
| Last verified     | Date          | Last repository status snapshot, without inventing delivery dates.                     |
| Release relevance | Select        | Foundation, Alpha, Beta, Web companion, Future gated.                                  |
| Source            | URL/text      | Repository path or Notion link. Leave Notion URL unknown until published.              |

Recommended **Stage** properties are `Stage`, `Outcome`, `State`, `Entry gate`, `Exit evidence`,
`Current tickets`, `Owner roles`, `Dependencies`, and `Source`. Keep stage rows separate from ticket
rows so a completed ticket cannot be mistaken for a completed program gate.

## Source notes

This page was prepared from `AGENTS.md`, `CLAUDE.md`, `TEAM.md`, `PROGRAM.md`, `status.md`,
`features.md`, and `docs/product/mobile-first-delivery-plan.md`. When older prose conflicts with
the live handoff, the current ticket table and latest checkpoint in `status.md` take precedence.

The owner supplied the target parent page above and authorized roadmap creation. On 2026-09-27,
Codex connected directly to the locally configured Notion MCP server, read the target page and
checked its existing child content. Existing `Sackerl Tickets` and `Sacker — Issues` databases
were left unchanged. The prepared child roadmap uses native headings, expandable stage/checkpoint
details and a ticket snapshot table; it does not create or synchronize a ticket database.

Notion rejected page creation with HTTP 403 `restricted_resource`: the workspace has used all
of its free blocks (`block_creation` limit). Authentication and read access work; publication is
pending workspace capacity. No successful creation receipt was returned. Before retrying, inspect
the parent for an existing roadmap to avoid duplicates. This artifact remains the publication source.
