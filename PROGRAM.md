# Sackerl Product And Delivery Program

Last reviewed: 2026-09-06

Status: Program direction. This document does not change ticket states.

## How To Use This Document

This document connects the current Sackerl implementation to the longer product vision. It is the
program-level guide for sequencing, architecture, product safety, and agent ownership.

- `status.md` remains the source of truth for live ticket state.
- `features.md` remains the source of truth for accepted `SCKRL-XXX` ticket scope.
- `epic.md` remains the high-level map of the current backlog.
- The Orchestrator and Business Process Analyst must turn the work packages below into explicit
  `SCKRL-XXX` tickets before implementation begins.
- A work package in this file is not permission to implement unrelated scope.

## Product Direction

Sackerl should become a household consumption intelligence product that helps people know what they
have, use it in time, and make better next-buy decisions. Food is the first domain because it has a
clear recurring loop, measurable waste, expiry pressure, and strong user value.

The target loop is:

1. Plan what may be needed.
2. Buy products and capture the transaction.
3. Review uncertain receipt data.
4. Place stock in real household locations.
5. Consume, move, adjust, or discard stock.
6. Learn household cadence, preferences, prices, and storage choices.
7. Recommend what to use, cook, buy, delay, or skip.
8. Require user confirmation and learn from the response.

The near-term product promise should remain narrow and credible:

> Know what food is at home, where it is, what to use next, and what not to buy twice.

Budget-aware buying, personalized recipes, conversational storage help, nutrition, and general
household storage are later layers. They depend on trustworthy data from the food loop.

## Honest Baseline Assessment

Sackerl is a coherent and working vertical prototype. It is not yet a production V1 and it does not
yet contain AI or a learning system in the meaningful product sense.

The strongest work is the product structure: mobile-first navigation, a consistent visual system,
Supabase authentication and row-level security, household stock CRUD, storage zones, expiry views,
recipe and shopping-list prototypes, migrations, shared TypeScript clients, and a repeatable CI
baseline. The repository currently passes format, lint, typecheck, unit tests, and production builds.

The main weakness is that the documented completion state is ahead of the real behavior. Receipt
capture creates a synthetic URI, OCR uses deterministic sample text unless text is supplied, and the
receipt journey stops before review and placement. The current data model stores inventory snapshots
and coarse removal outcomes, not enough history to learn purchase frequency, consumption rate,
prices, budget performance, or storage habits reliably.

The right next move is not to add an LLM. It is to complete the core receipt-to-stock loop and build
the event and provenance data needed for useful recommendations.

## Capability Map

| Area                         | Current state           | What works now                                                                      | Material gap                                                                                              |
| ---------------------------- | ----------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Repo and design system       | Strong foundation       | pnpm/Turbo, strict TypeScript, CI, tokens, UI primitives, Expo and Next builds      | No release environments, monitoring, or automated app journeys                                            |
| Authentication and household | Working prototype       | Email auth, Apple token exchange boundary, profile, one household, RLS              | Account lifecycle, privacy controls, export/deletion, production Apple setup                              |
| Stock and locations          | Working prototype       | Add, list, edit, move, soft-remove, categories, configurable zones                  | No product identity, stock lot lineage, partial consumption, adjustments, or event history                |
| Expiry                       | Partial                 | Category-by-zone default dates, expiring list, snooze, used/composted outcome       | Estimated and exact dates are indistinguishable; no confidence, provenance, or confirmation state         |
| Receipt capture and upload   | Simulation              | Scan UI and durable receipt row                                                     | No camera/file bytes, object storage, upload validation, retry, or lifecycle policy                       |
| OCR and parsing              | Development foundation  | Provider interface, deterministic DE/EN/FR/IT text parsing, persisted receipt items | No real OCR provider, queue, webhook/push completion, production fixtures, or accuracy evaluation         |
| Receipt review and placement | Not implemented         | Contracts and designs exist                                                         | SCKRL-304 and SCKRL-305 are required to close the main product loop                                       |
| Receipt history              | Backend foundation      | Receipts can be listed                                                              | No user-facing history or correction reopening flow                                                       |
| Recipes                      | Heuristic prototype     | 50 seeded recipes and name-based stock coverage score                               | No ingredient quantities, steps, nutrition, allergens, substitutions, licensing, or stock depletion logic |
| Shopping list                | Working prototype       | Manual, recipe, and receipt-history entries; check and remove                       | No trip, retailer, price, budget, cadence, or planned purchase date                                       |
| Notifications                | Not implemented         | Expiring screen can be opened manually                                              | No device registration, preferences, scheduling, delivery, inbox, or outcome measurement                  |
| Buying intelligence          | Not implemented         | Latest receipt-sourced names can be suggested                                       | No purchase ledger, price history, consumption model, budget, forecast, confidence, or feedback loop      |
| Storage learning/dialogue    | Not implemented         | User selects and changes zones                                                      | No record of suggested versus chosen locations or household-specific learned rules                        |
| Dietary and health support   | Not implemented         | Basic vegetarian filter heuristic                                                   | No dietary profile, allergy hard filters, nutrition source, consent, or safety review                     |
| General household storage    | Not implemented         | Custom food storage zone labels                                                     | Food-specific item, expiry, category, and recipe assumptions are still embedded in the model              |
| Web companion                | API and demo foundation | Next route handlers and design-system routes                                        | No authenticated product shell or end-user desktop experience                                             |

## Review Findings That Drive The Program

1. **The primary value loop is incomplete.** The scan screen writes `sackerl://` mock URLs and does
   not capture or upload a file. The OCR boundary returns a fixed sample for those URLs. Review,
   placement, and receipt history remain unimplemented.
2. **Expiry truth is not represented.** An estimated date is saved into the same `expires_on` field
   as a user-entered date. The system cannot tune notification urgency based on whether the date is
   printed, estimated, inferred, or confirmed.
3. **There is no learning-grade ledger.** `items` represents the current stock row and `removed_on`
   plus `removal_reason` represents a final outcome. It does not preserve acquisition, partial use,
   quantity correction, move, opening, expiry correction, or recommendation-response events.
4. **Receipt data is too thin for budget intelligence.** Receipt items do not retain line total,
   unit price, discount, tax, SKU/barcode, normalized product, brand, pack size, or retailer product
   identity.
5. **Recipe suggestions are discovery, not meal planning.** Matching is based on normalized words and
   ingredient presence. Quantities and expiry urgency are ignored. `Cooked it` removes every matched
   item rather than consuming the amount used by a recipe.
6. **Diet filters are not safety controls.** Vegetarian and dinner classifications are heuristics.
   Allergies must never be implemented as a probabilistic text filter or inferred silently from
   behavior.
7. **Mutation ownership is split.** Mobile clients access Supabase PostgREST directly while similar
   Next route handlers also exist. This is acceptable for early CRUD, but learning events,
   recommendations, OCR jobs, and stock transitions need one server-owned transactional command
   path.
8. **Automated coverage is concentrated in shared clients.** Shared packages have useful unit tests,
   but mobile and web have no test files. There is no automated end-to-end receipt, stock, expiry, or
   recipe journey.
9. **Delivery documentation has drifted.** `status.md` is newer than `README.md`, `CLAUDE.md`, and the
   baseline summary in `AGENTS.md`. The active queue also omits several defined next tickets. This
   makes a green status look more complete than the actual product.
10. **Several very large screen files increase change risk.** Core mobile screens combine fetching,
    domain decisions, navigation, and rendering in files approaching or exceeding 1,000 lines. New
    work should extract feature hooks and focused components only when touching those areas.

## Product And Safety Guardrails

- Facts and predictions must be stored separately. Every expiry, category, storage, and buying
  suggestion needs a source, confidence, and confirmation state where relevant.
- The user remains the final authority. Sackerl recommends; it does not autonomously buy, charge,
  discard, or silently alter stock.
- Allergies are hard exclusions. A model result cannot override an explicit allergy or medical
  restriction.
- Do not infer allergies, illnesses, pregnancy, or other sensitive health facts from shopping
  behavior.
- Nutrition and exercise guidance requires explicit opt-in, evidence sources, clear limitations, and
  separate privacy treatment. It must not present itself as diagnosis or medical care.
- AI output must explain the important factors, expose uncertainty, and allow `accept`, `edit`,
  `dismiss`, and `not relevant` feedback.
- A deterministic baseline must exist before an AI model is introduced. This gives QA an oracle and
  proves whether the model adds value.
- Store only data needed for a defined user benefit. Receipt image retention must be configurable and
  documented.
- Keep food as the product focus until the food loop demonstrates repeated use and reliable data.
  General household storage is a separate product expansion, not a small category change.

## Recommended Domain Evolution

Keep Supabase/Postgres and evolve the current schema incrementally. Do not rewrite the working
foundation and do not introduce full event sourcing. Add an append-only operational ledger beside
read-optimized current-state tables.

### Core Records

- `products`: canonical household-independent product identity where known.
- `product_aliases`: retailer text and user corrections mapped to canonical products, with locale.
- `receipts`: transaction header, store, currency, total, capture source, and processing provenance.
- `receipt_items`: raw text plus normalized product, quantity, pack size, line price, unit price,
  discounts, confidence, and review state.
- `inventory_lots`: the current stock representation evolved from `items`, linked to receipt lines
  where applicable.
- `inventory_events`: acquired, adjusted, moved, opened, consumed, discarded, expired, corrected.
- `expiry_facts`: value, source (`printed`, `user`, `estimated`, `model`), confidence, confirmed time,
  and superseded value.
- `locations`: household hierarchy and optional storage properties such as cold, frozen, dry, humid,
  indoor, or outdoor. Preserve current zone keys during migration.
- `recommendations`: versioned recommendation, inputs summary, reason codes, confidence, and expiry.
- `recommendation_feedback`: accepted, edited, dismissed, completed, and outcome.
- `budget_profiles`: currency, period, amount, optional pay-cycle boundaries, and category limits.
- `shopping_plans`: a planned trip/window separate from the persistent shopping list.
- `notification_preferences` and `notification_deliveries`: consent, schedule, delivery, open, and
  outcome state.

### Recipe And Preference Records

- Recipes need structured ingredients with quantities, instructions, servings, tags, source, and
  license information.
- Nutrition and allergen facts must come from an identified source and carry provenance.
- Household taste preferences and each person's dietary constraints must remain distinct.
- A household recipe can be excluded when any participating person has a hard constraint.

## Architecture Direction

1. Keep Expo, Next.js, Supabase Auth, Postgres, and RLS for the next program stages.
2. Keep direct client reads where they remain simple and protected by RLS.
3. Move multi-record commands and learning-sensitive transitions behind one server-owned API or
   transactional Postgres function. Examples are receipt finalization, recipe consumption, stock
   adjustment, recommendation acceptance, and parsed-item replacement.
4. Store actual receipt media in a private object-storage bucket with signed access, size/type checks,
   deletion policy, and household-scoped authorization.
5. Run OCR and reminders through idempotent background jobs with attempt state, retry limits, and
   observable failures. Do not run production OCR as a long synchronous request.
6. Version parsers, rules, prompts, and models. Persist the version that produced each suggestion.
7. Create an offline evaluation harness before adding an LLM. Use de-identified fixtures and measure
   accuracy, correction rate, unsafe recommendation rate, latency, and cost.
8. Do not add a vector database until a measured retrieval problem requires it.

## Delivery Program

Durations are indicative planning ranges, not commitments. Each work package must be split into
small `SCKRL-XXX` tickets with testable acceptance criteria before implementation.

### Stage 0: Restore Product Truth

Indicative scope: one sprint.

Outcome: everyone can distinguish working product behavior from scaffolding, and the next slice is
based on current evidence.

| Work package                      | Primary owner            | Supporting owners | Deliverable                                                                                 |
| --------------------------------- | ------------------------ | ----------------- | ------------------------------------------------------------------------------------------- |
| P0.1 Product-owner QA triage      | Business Process Analyst | QA, Orchestrator  | Findings grouped into defects, usability gaps, and new scope                                |
| P0.2 Ticket truth audit           | Orchestrator             | QA                | Follow-up tickets for simulated or partially accepted behavior; current docs reconciled     |
| P0.3 Core journey test plan       | QA                       | Frontend, Backend | Repeatable onboarding, manual stock, receipt, expiry, recipe, and shopping-list test matrix |
| P0.4 Architecture decision record | Infrastructure           | Backend, DevOps   | Decision on command API, background jobs, media storage, event ledger, and data retention   |
| P0.5 Product measurement plan     | Business Process Analyst | QA, Backend       | Activation, fidelity, waste, recommendation, and retention definitions without PII          |

Exit criteria:

- Product-owner findings are represented by explicit tickets.
- "Done" notes clearly state any production gap and link to its follow-up ticket.
- The next receipt-to-stock slice has one agreed data contract and QA plan.
- Provider decisions blocking telemetry and storage are made or time-boxed.

### Stage 1: Complete The Reliable Food Loop

Indicative scope: two to four sprints.

Outcome: a user can capture a real receipt, review uncertain lines, place items, receive useful expiry
reminders, and correct mistakes without losing data.

| Work package                             | Primary owner  | Supporting owners        | Deliverable                                                                                       |
| ---------------------------------------- | -------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| P1.1 Real camera/gallery/PDF acquisition | Frontend       | Infrastructure, QA       | Device capture and import with permission, cancellation, retry, and manual fallback               |
| P1.2 Private receipt media pipeline      | Infrastructure | Backend, DevOps          | Authorized object storage, validation, signed access, retention, and cleanup                      |
| P1.3 Asynchronous OCR pipeline           | Backend        | Infrastructure, QA       | Idempotent job, real provider adapter, retries, parser version, and failure recovery              |
| P1.4 Receipt data upgrade                | Backend        | Business Process Analyst | Review state, line pricing, product linkage, correction provenance, and transactional replacement |
| P1.5 SCKRL-304 review screen             | Frontend       | Backend, QA              | Editable lines, confidence, raw text, add/remove, and explicit resolution of uncertain items      |
| P1.6 SCKRL-305 placement                 | Frontend       | Backend, QA              | Suggested zones, drag and tap alternatives, confirmation, and atomic stock creation               |
| P1.7 SCKRL-306 receipt history           | Frontend       | Backend, QA              | Receipt list, image/result detail, correction rules, and auditability                             |
| P1.8 Expiry provenance and confirmation  | Backend        | Frontend, QA             | Exact versus estimated dates, confidence, user confirmation, and safe notification semantics      |
| P1.9 SCKRL-411/412/421 notifications     | Backend        | Frontend, DevOps, QA     | Token registration, preferences, local-time job, combined push, inbox, and delivery telemetry     |
| P1.10 App journey automation             | QA             | DevOps, Frontend         | Automated API integration tests plus critical mobile end-to-end smoke journeys                    |

Exit criteria:

- A real receipt image produces reviewed and placed inventory without synthetic data.
- Reprocessing is idempotent and cannot erase good parsed lines after a failed insert.
- Every created stock lot can be traced to manual entry or a reviewed receipt line.
- Estimated expiry is visibly distinguishable from confirmed exact expiry.
- Reminder opt-in, quiet behavior, and deep links pass device QA.

### Stage 2: Build The Learning Data Spine

Indicative scope: two to three sprints.

Outcome: Sackerl records enough trustworthy history to calculate household patterns without an AI
model.

| Work package                    | Primary owner  | Supporting owners            | Deliverable                                                                                    |
| ------------------------------- | -------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| P2.1 Product normalization      | Backend        | Business Process Analyst, QA | Canonical products, locale-aware aliases, user correction mapping, and merge rules             |
| P2.2 Inventory event ledger     | Backend        | Infrastructure, QA           | Quantity-safe acquisition, adjustment, move, use, discard, and correction events               |
| P2.3 Partial consumption        | Frontend       | Backend, QA                  | Consume a quantity without deleting the full lot; unit conversion rules are explicit           |
| P2.4 Price and retailer history | Backend        | Business Process Analyst     | Comparable unit prices, discounts, currency, store identity, and data-quality flags            |
| P2.5 Storage-choice feedback    | Backend        | Frontend                     | Suggested zone, chosen zone, override reason, and per-household learned preference evidence    |
| P2.6 Privacy controls           | Infrastructure | Frontend, Backend, DevOps    | Consent, retention, receipt-image deletion, account export, account deletion, and audit checks |
| P2.7 Data-quality dashboard     | QA             | Backend, Orchestrator        | Coverage and correction metrics by source, locale, store, and parser version                   |

Exit criteria:

- Stock can be reconstructed or reconciled from events and current lots.
- Purchase intervals, consumption intervals, unit prices, and waste quantities can be calculated.
- User corrections improve aliases without silently changing other households.
- Privacy export and deletion cover database rows, receipt media, and derived recommendation data.

### Stage 3: Budget-Aware Buying Intelligence

Indicative scope: two to four sprints after sufficient pilot history exists.

Outcome: Sackerl can recommend what to buy, delay, reduce, or skip with a reason and confidence.

Start with deterministic forecasting. Suggested inputs include current stock, consumption rate,
purchase cadence, planned shopping date, expiry risk, household size, unit price history, budget
remaining, and explicit staples.

| Work package                             | Primary owner            | Supporting owners            | Deliverable                                                                                       |
| ---------------------------------------- | ------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| P3.1 Budget and shopping-cycle model     | Business Process Analyst | Backend, Frontend            | Period, currency, amount, optional pay cycle, category constraints, and user-editable assumptions |
| P3.2 Baseline demand forecast            | Backend                  | QA                           | Explainable cadence and depletion estimates with cold-start behavior                              |
| P3.3 Buy/skip recommendation engine      | Backend                  | Business Process Analyst, QA | Suggested quantity, expected cost, reason codes, confidence, and freshness window                 |
| P3.4 Recommendation experience           | Frontend                 | Backend, QA                  | Accept, edit, dismiss, not relevant, and "why this" interaction                                   |
| P3.5 Offline evaluation                  | QA                       | Backend, Infrastructure      | Backtests against held-out household events; cost, error, and false-positive thresholds           |
| P3.6 Optional language-model explanation | Backend                  | Infrastructure, QA           | Model gateway that explains structured recommendations but cannot invent the decision inputs      |

Exit criteria:

- The deterministic engine beats simple "buy the last seen items" behavior in backtests.
- Every recommendation shows the data and assumptions that materially affected it.
- Users can correct quantities, timing, budget, and staple status.
- No purchase or payment occurs without a separate explicit user action.

### Stage 4: Personalized Recipes And Meal Timing

Indicative scope: two to four sprints.

Outcome: recipes use quantities, expiry urgency, budget, shopping schedule, tastes, and hard dietary
constraints instead of ingredient-name overlap alone.

| Work package                            | Primary owner | Supporting owners                        | Deliverable                                                                             |
| --------------------------------------- | ------------- | ---------------------------------------- | --------------------------------------------------------------------------------------- |
| P4.1 Licensed structured recipe catalog | Backend       | Business Process Analyst, Infrastructure | Ingredients with quantities, instructions, servings, tags, source, and license          |
| P4.2 Quantity-aware stock matching      | Backend       | QA                                       | Coverage, substitutions, expiry weighting, and non-destructive quantity allocation      |
| P4.3 Taste and dietary profile          | Frontend      | Backend, Business Process Analyst        | Likes, dislikes, diet, cuisine, time, servings, and explicit per-person hard exclusions |
| P4.4 "Cook before next shop" planner    | Backend       | Frontend, QA                             | Meal suggestions that prioritize use-soon stock within the planned shopping window      |
| P4.5 Recipe outcome feedback            | Frontend      | Backend                                  | Cooked, skipped, disliked, substituted, and leftover outcomes                           |

Exit criteria:

- Recipe completion consumes only the confirmed quantities from selected stock lots.
- Explicit dietary and allergy constraints are tested as hard exclusions.
- Recommendations explain expiry, stock coverage, budget, and preference tradeoffs.
- Recipe data has a documented source and usage license.

### Stage 5: Household Storage Assistant

Indicative scope: two to three sprints.

Outcome: Sackerl learns where a household puts things and asks concise questions when confidence is
low.

| Work package                              | Primary owner | Supporting owners                 | Deliverable                                                                             |
| ----------------------------------------- | ------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| P5.1 Learned placement rules              | Backend       | QA                                | Household-specific category/product-to-location preferences with support and confidence |
| P5.2 Placement explanation and correction | Frontend      | Backend                           | "Usually stored in..." suggestion, one-tap override, and remembered choice              |
| P5.3 Constrained dialogue flow            | Frontend      | Backend, Business Process Analyst | Questions only for unresolved product, quantity, expiry, or location fields             |
| P5.4 Model/rule evaluation                | QA            | Infrastructure                    | Correction rate, unnecessary-question rate, latency, cost, and safe fallback            |

The dialogue layer should call typed tools and return structured proposals. It must not directly edit
inventory without user confirmation.

### Stage 6: Nutrition And Wellness Safety Layer

Start only after privacy, data provenance, and recipe constraints are mature.

Outcome: optional nutrition-aware suggestions that respect explicit preferences and allergies without
claiming medical authority.

Required work before implementation:

- Product and legal decision on whether health-related data is collected at all.
- Explicit consent, purpose limitation, export, deletion, and access controls for sensitive data.
- Vetted nutrition and allergen sources with regional product coverage.
- Hard-constraint test suite with zero tolerated known-allergen recommendation breaches.
- Clear boundary between general wellness goals and medical advice.
- Human-reviewed content policy for weight, eating disorders, pregnancy, chronic illness, and minors.

Gym routine integration should remain a separate discovery initiative. It is not required to prove
Sackerl's food-management value and would create a different safety and product domain.

### Stage 7: General Household Storage

Start only after food retention and data quality meet agreed targets.

Outcome: validate whether Sackerl's location and reminder strengths transfer to non-food household
items.

Run discovery before changing the core product:

1. Interview users about medicines, cleaning supplies, toiletries, tools, documents, seasonal items,
   and consumables.
2. Select one adjacent domain with frequent replenishment and clear value.
3. Define domain-specific rules for quantity, safety, expiry, ownership, and reminders.
4. Generalize `locations`, product identity, and inventory events while keeping food behavior in a
   food module.
5. Test the adjacent domain as an opt-in pilot before repositioning the app.

Do not force all household objects into the food model. Medicines, hazardous cleaners, documents,
and durable goods have materially different safety and lifecycle rules.

## Agent Operating Plan

### Model Assignment And Routing

`TEAM.md` is the canonical source for team composition and model routing. The matrix below records the assignment in program context.

| Role                     | Model          | Reasoning | Why this tier                                                                                                            |
| ------------------------ | -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| Orchestrator             | `gpt-5.6-sol`  | `xhigh`   | Highest cross-program reasoning, dependency management, conflict resolution, and final integration responsibility        |
| Business Process Analyst | `gpt-5.6-luna` | `high`    | High-volume discovery synthesis and ticket refinement within Orchestrator-approved product boundaries                    |
| Frontend                 | `gpt-5.6-luna` | `high`    | Bounded UI implementation and iteration after interaction rules and contracts are stable                                 |
| Backend                  | `gpt-5.5`      | `xhigh`   | Complex schema evolution, transactional correctness, OCR/jobs, event data, and recommendation logic                      |
| Infrastructure           | `gpt-5.5`      | `xhigh`   | High-impact architecture, security, privacy, provider, reliability, and data-retention decisions                         |
| DevOps                   | `gpt-5.6-luna` | `high`    | Repeatable, bounded automation and deployment work derived from approved infrastructure decisions                        |
| QA                       | `gpt-5.5`      | `high`    | Adversarial validation, cross-layer regression analysis, data-quality evaluation, and health/recommendation safety gates |

Routing policy:

- The Orchestrator must use the documented model and effort when spawning a role-specific agent if the runtime supports selection.
- No model substitution is silent. Record an unavailable model or effort as a delivery constraint and obtain an explicit routing decision.
- Luna work must start from stable acceptance criteria and contracts. Escalate unresolved architecture, security, privacy, transactional integrity, health safety, or recommendation policy to a GPT-5.5 specialist and the Orchestrator.
- GPT-5.5 specialists own complex reasoning in their domain but do not broaden product scope. Cross-domain tradeoffs return to the Orchestrator.
- Sol performs integration and stage-gate judgment. It should delegate bounded specialist execution rather than absorb every implementation task.

### Orchestrator

- Own sequencing, dependencies, status transitions, and integration.
- Route every delegated ticket using the model assignment above and include the required reasoning effort in the delegation request.
- Allow one primary owner per ticket and avoid overlapping file ownership.
- Keep a stage gate closed until QA records evidence for its exit criteria.
- Reconcile `AGENTS.md`, `CLAUDE.md`, `README.md`, `features.md`, and `status.md` after accepted merges.
- Reject "AI" tickets without an input contract, deterministic fallback, evaluation metric, and user
  correction path.

### Business Process Analyst

- Resolve the open product decisions below before corresponding engineering tickets become Ready.
- Keep Luna work bounded to product analysis and ticket refinement; escalate safety, architecture, and cross-program tradeoffs to the Orchestrator.
- Define the purchase, stock, consumption, waste, shopping, recipe, and recommendation journeys.
- Specify terms precisely: product, package, quantity, lot, purchase, use, waste, budget, planned buy,
  and recommendation acceptance.
- Turn each program work package into small tickets with business rules and edge cases.

### Infrastructure

- Produce ADRs for media storage, asynchronous jobs, transactional commands, data retention, privacy,
  and model-provider boundaries.
- Review Backend proposals that change trust boundaries, data lifecycle, RLS, background processing, or external providers before implementation.
- Preserve EU-region hosting and least-privilege access.
- Design for retries, idempotency, backups, restore testing, and provider replacement.
- Avoid new infrastructure until a stage requires it.

### Backend

- Own schemas, migrations, command APIs, normalization, event capture, OCR, scheduling, and
  recommendation logic.
- Publish versioned contracts and fixtures before Frontend begins dependent work.
- Keep user corrections and prediction provenance durable.
- Make multi-record state transitions atomic.
- Ship deterministic baselines and fixtures before model integrations.

### Frontend

- Own mobile-first correction, placement, preference, budget, feedback, and explanation experiences.
- Start from accepted contracts and escalate domain ambiguity instead of embedding new business rules in screens.
- Keep drag alternatives, accessible labels, error recovery, and visible uncertainty.
- Separate data hooks, domain state, and screen rendering when modifying oversized screens.
- Never hide a model decision behind confident copy when the confidence is low.

### DevOps

- Establish staging and production deployment paths, migration automation, environment promotion,
  release tagging, monitoring, and rollback.
- Implement approved infrastructure decisions and escalate changes that alter security or production topology.
- Add secret scanning, dependency review, backup checks, and scheduled-job observability.
- Keep provider keys server-only and prevent production builds from selecting mock providers.

### QA

- Write the test strategy before implementation begins for every stage.
- Review acceptance criteria before implementation and reject criteria that cannot prove the user outcome or program exit gate.
- Own real receipt fixtures across target languages and stores, including degraded images and failure
  paths.
- Add API integration, migration replay, mobile end-to-end, accessibility, notification, privacy, and
  offline/retry coverage.
- Evaluate recommendation accuracy and safety against fixed datasets, not screenshots alone.
- Report model quality by version and cohort without exposing personal data.

## Handoff Order For Every New Capability

1. Orchestrator confirms the program stage, dependencies, primary owner, model, reasoning effort, and file or layer boundary.
2. Business Process Analyst defines the user outcome, rules, exclusions, and success measure.
3. QA challenges the acceptance criteria and defines required evidence before implementation.
4. Infrastructure records any new storage, job, provider, privacy, security, or deployment decision.
5. Backend publishes data contracts, migration plan, deterministic behavior, and fixtures.
6. Frontend implements the complete correction and recovery experience against stable contracts.
7. DevOps wires the approved environment, observability, deployment, and rollback path.
8. QA validates acceptance criteria and the stage-level regression suite independently from implementation.
9. Orchestrator performs integration review, updates status, and records durable knowledge after acceptance.

## Immediate Recommended Queue

This order minimizes rework after the current product-owner QA pause:

1. Triage the broad current-version QA feedback into explicit tickets.
2. Audit Done tickets against their literal acceptance criteria and create follow-ups for real
   capture, upload, OCR completion signaling, and app-level tests.
3. Decide the minimal receipt-line, expiry-provenance, and inventory-event schema needed before
   placement creates more data.
4. Implement real receipt acquisition, private media storage, and an idempotent OCR job.
5. Implement SCKRL-304 Review with durable correction state.
6. Implement SCKRL-305 Placement with both drag and tap paths and atomic item creation.
7. Implement SCKRL-306 Receipt history.
8. Implement push preferences, registration, daily reminders, and notification inbox.
9. Add product normalization, partial consumption, and the inventory event ledger.
10. Begin budget and buying-pattern discovery only after the resulting data can be measured.

Premium gating and the web companion should not outrank the reliable food loop unless a concrete
commercial or user-research result changes that priority.

## Program Metrics

Metrics should be defined before telemetry implementation and should avoid PII.

| Goal                 | Example measure                                                                    |
| -------------------- | ---------------------------------------------------------------------------------- |
| Activation           | Household completes first reviewed receipt or adds and confirms five stock items   |
| Capture reliability  | Successful real receipt ingestion rate and median retry count                      |
| Parser quality       | Correct lines and fields after review, by locale/store/parser version              |
| Inventory fidelity   | Percentage of sampled stock that users confirm is still accurate                   |
| Core-loop completion | Parsed receipts that reach reviewed and placed stock                               |
| Expiry trust         | Exact/confirmed coverage, estimate override rate, and reminder false-positive rate |
| Waste reduction      | Quantity and estimated value consumed versus discarded, not raw item count alone   |
| Shopping value       | Accepted, edited, dismissed, and completed recommendations                         |
| Budget value         | Planned versus actual spend and avoidable duplicate-buy value                      |
| Recipe value         | Suggested recipes cooked, ingredients consumed, substitutions, and dismissals      |
| Retention            | Weekly active households completing a food-management action                       |
| Safety               | Known hard-constraint violations; target is zero                                   |

## Open Product Decisions

These questions should be resolved progressively, not all before the next sprint:

1. Is the initial customer an individual, couple, family, shared flat, or cost-sensitive household?
2. Is Austria/DACH the launch market, with German as the first complete product locale?
3. Does "payment model" mean the household's pay cycle and available budget, payment-card transaction
   import, or Sackerl's subscription model? These are three different programs.
4. What is the first budget unit: weekly groceries, monthly groceries, category envelope, or money
   available until the next pay date?
5. How much inventory confirmation effort will users tolerate after each shop and during the week?
6. Should exact expiry be captured from receipt text, package camera/barcode, or manual entry first?
7. Which receipt OCR provider, object storage, queue, push provider, telemetry, and error-reporting
   services are approved for dev, staging, and production?
8. How long should receipt images and raw receipt text be retained by default?
9. Does one household need multiple members and per-person dietary profiles before personalized
   recipes launch?
10. Which explicit allergies and dietary restrictions are in scope, and who validates the source
    data and safety rules?
11. What evidence must buying or recipe recommendations show to earn user trust?
12. What product signal would justify expanding beyond food, and which adjacent household category
    should be tested first?
13. What is the monetization hypothesis, and which proven user value is premium?
14. Is offline use a launch requirement for stock viewing and updates?

## Definition Of Done Additions

For future tickets, "Done" should mean:

- Literal acceptance criteria pass with the intended real provider or behavior, not only a mock.
- A mock-only foundation is named as such and has an explicit production follow-up ticket.
- Relevant unit, integration, journey, accessibility, and failure-path tests pass.
- Migrations replay from a clean database and have a rollback or forward-fix plan.
- New events, personal data, retention, and deletion behavior are documented.
- Operational failures are observable without logging receipt text, health data, or other PII.
- User-facing predictions show provenance or uncertainty where it changes user decisions.
- QA evidence and remaining risks are recorded in `status.md` before the ticket is closed.
