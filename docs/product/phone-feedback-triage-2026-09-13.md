# Phone-test feedback triage — 2026-09-13

Status: SCKRL-020 triage accepted by independent QA and integrated on 2026-09-13.

This note converts the owner's current phone-test observations in [`feedback.md`](../../feedback.md) into defects, usability gaps, and proposed scope. The raw feedback remains unchanged. The follow-ups are recorded in `features.md` and `status.md`; the bounded SCKRL-506 correctness fix is now accepted locally. The remaining ideas are separately staged backlog work.

The test environment supplied with the feedback is a phone UI test (iPhone-style interactions were requested) on 2026-09-13. The exact device, build, account, and environment were not recorded, so those details remain open QA metadata rather than inferred facts.

## Decision and immediate order

The first correctness issue is recipe matching against overdue stock. It is scoped as SCKRL-506 and owned by Backend. It is an immediate Stage 1 alpha concern because the current recipe contract scores ingredient-name coverage from active stock and does not apply expiry eligibility. Backend and the Orchestrator accepted the narrow legacy-date eligibility contract below. It makes no claim that an app estimate proves food is safe.

The next data/UI slice is the already accepted SCKRL-406 expiry provenance contract, followed by the proposed SCKRL-407 warning and status interaction. The existing SCKRL-411, SCKRL-412, and SCKRL-421 notification work should absorb overdue reminder delivery, preferences, deep links, and inbox behavior. SCKRL-408 should correct the known snooze behavior before reminders are exposed to external testers.

The package evidence idea, custom recipes, recipe sharing, swipe navigation, nutrition, and AI remain backlog proposals. They should not be pulled into the immediate receipt-to-stock or expiry correctness slice.

## Safety boundary used for triage

The supplied food-safety references distinguish a printed “use by”/consumption date, which is about safety, from “best before,” which is about quality. EFSA describes that distinction and the need for clear date information in its [date-marking tool announcement](https://www.efsa.europa.eu/en/news/use-or-best-new-tool-support-food-operators). AGES similarly states that a best-before overrun does not by itself mean a food is unsafe, while food past a consumption date should not be eaten in its [food-waste guidance](https://www.ages.at/ages/presse/news/detail/tag-gegen-lebensmittelverschwendung).

The product consequences are:

- Expiry facts must distinguish printed source, user entry, estimate, and any future model proposal. SCKRL-406 already owns that data boundary.
- Recipe matching uses a Backend-owned eligibility result. The immediate gate excludes overdue or unknown dates; richer source-aware behavior follows SCKRL-406. The UI must not infer safety from a color, date arithmetic, barcode, or category default.
- An estimated date is a planning signal and should be shown as uncertain. The product must not promise a minimum safe lifetime from purchase date or storage zone.
- A barcode can help identify a product or match package evidence; it cannot prove an expiry date. A package photo or OCR result remains evidence for user review until the Backend/QA contract says otherwise.
- “Trash,” “Used,” and “Compost” remain explicit user-confirmed actions. A reminder may ask the user to review or discard an item, but it must not silently delete stock or claim that the user already discarded it.
- Nutrition, calorie, dietary, and AI behavior remain subject to the health and recommendation gates in `PROGRAM.md`; this note proposes scope and decisions only.

## Observation-to-routing map

| ID  | Actual user observation                                                                                                                                                      | Classification and priority                                               | Inferred implementation cause or uncertainty                                                                                                                                                                                              | Routing                                                                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O1  | The home experience showed recipe stock even though the item date was June 26 and the test date was September 13. The user expected no recipe suggestion from overdue stock. | Defect; P0 correctness/trust                                              | The owner reports this outcome. The likely cause is that SCKRL-501 scores suggestions from active stock without an expiry eligibility check. This is an implementation inference, not a claim that the test inspected the API.         | New SCKRL-506, Backend, Stage 1 alpha. Depends on SCKRL-501 and accepted SCKRL-020 triage; the immediate legacy-date gate does not wait for SCKRL-406.                                    |
| O2  | A newly added product should show an estimated expiry, with a yellow warning that invites the user to enter the exact package date.                                          | Usability gap with an existing data foundation gap; P1 alpha trust        | SCKRL-405 supplies category/zone estimation. The current item model does not persist source and confirmation separately, which is the documented SCKRL-406 gap.                                                                           | Existing SCKRL-406, Backend, then new SCKRL-407, Frontend, Stage 1. SCKRL-407 depends on SCKRL-406 and SCKRL-908 for journey/accessibility coverage.              |
| O3  | Overdue items should be red and carry a double-exclamation indicator.                                                                                                        | Usability gap/new scope; P1 safety communication                          | The current Expiring screen derives an “overdue” label from one date and uses urgency styling, but has no source-aware warning state or double-indicator interaction.                                                                     | New SCKRL-407, Frontend with Backend contract support, Stage 1. It overlaps SCKRL-406; color must not be the only status signal.                                  |
| O4  | Push notifications should ask the user to move overdue products to trash, while preserving good-faith indication that the user has done so.                                  | New scope constrained by existing notification work; P1 after correctness | SCKRL-411/412/421 already cover token registration, daily reminders, and notification history but do not yet define overdue wording, consent, snooze, deduplication, or a discard confirmation.                                           | Refine SCKRL-411/412/421, Backend, Stage 1 beta. SCKRL-407 owns the in-app warning; notification delivery must deep-link to review/action and never mutate stock. |
| O5  | Add optional package-detail capture near expiry: expiration-date photo and optional barcode, while avoiding a burdensome flow.                                               | New scope; P2 later                                                       | Real media acquisition/storage are themselves incomplete (SCKRL-307/308). Product identity, evidence provenance, OCR, and retention contracts are not yet available.                                                                      | New SCKRL-409, Infrastructure primary with Backend/Frontend/QA, Stage 2 or later. Depends on SCKRL-307, SCKRL-308, SCKRL-406, and a product-identity decision.    |
| O6  | Create a personal recipe book that stays dynamic with suggestions and highlights personal recipes.                                                                           | New scope; P2 later                                                       | Current SCKRL-501 is a seeded heuristic catalog and SCKRL-505 is a detail/action screen. There is no household recipe record, structured quantity contract, source/license field, or priority rule.                                       | New SCKRL-507, Backend primary with Frontend, Stage 4 personalized recipes. Depends on SCKRL-501 plus structured recipe and recipe-outcome decisions.             |
| O7  | Later, share recipes as album-like collections and vote on them without turning the product into social media.                                                               | New scope/discovery; P3 later                                             | No current sharing, membership, moderation, privacy, licensing, or ranking model exists. The album metaphor is a product direction, not an implementation requirement.                                                                    | New SCKRL-508 discovery, Business Process Analyst/Orchestrator decision owner with Backend/Frontend support, Stage 4+ after core loop and recipe provenance.      |
| O8  | The UI uses navigation buttons; the user also wants the smooth iPhone-style left/right swipe behavior.                                                                       | Usability gap; P1 mobile polish                                           | The Phase 2 handoff already specifies swipe actions on Expiring rows, but the current tested surface exposes visible buttons. The feedback does not establish whether it means row actions, horizontal paging, or screen back navigation. | New SCKRL-902, Frontend, Stage 1 mobile polish. Depends on a bounded interaction decision and SCKRL-908; buttons/tap and VoiceOver paths remain required.         |
| O9  | Nutrition/calorie information should be optional, surfaced as a question or opt-in from suggested or custom recipes.                                                         | New scope; P3 safety-gated                                                | Nutrition, allergen data, consent, and health copy are explicitly absent from the current product. No policy should be inferred from this request.                                                                                        | New SCKRL-930 discovery, Backend with Orchestrator/QA health-policy review, Stage 6. Depends on privacy, source, consent, and hard-constraint decisions.          |
| O10 | AI support across the app is desired in a later stage.                                                                                                                       | New scope/deferred direction; P3                                          | `PROGRAM.md` requires a deterministic baseline, typed inputs, evaluation metrics, explainability, and user correction before AI. No AI implementation is authorized by this feedback.                                                     | Backlog discovery only; no immediate implementation ticket. Revisit after Stage 2 data quality and the relevant Stage 4/5 deterministic capability has evidence.  |

## Ticket-ready follow-ups

### SCKRL-506 — Exclude ineligible stock from recipe suggestions

**Classification:** defect, P0 correctness. **Primary owner:** Backend. **Stage:** Stage 1.

The accepted scope is in [features.md](../../features.md): the pure scorer requires an explicit
calendar day; only valid dates on/after that day contribute to matching. Past, null, missing and
invalid dates are excluded from all match IDs. No eligible matches means no stock-backed list
suggestions, even at minimum score zero; direct recipe detail can remain available with zero matches.

One day is derived per request from an injected clock and explicit IANA zone. Mobile and web
configure `Europe/Vienna` visibly for the current Austrian pilot, preventing UTC/local-midnight
drift. Household time-zone persistence and source-aware date labels remain SCKRL-406 follow-ups.
Neither this gate nor a future date certifies food safety. Stock is never deleted by matching.

**Depends on:** SCKRL-501 and accepted SCKRL-020 triage. This immediate fix uses the existing
`expires_on` projection and does not wait for new provenance storage.

### SCKRL-407 — Add source-aware expiry warning and overdue interaction

**Classification:** usability gap/new scope. **Priority:** P1 alpha trust. **Primary owner:** Frontend, with Backend support. **Stage:** Stage 1 after SCKRL-406. **Proposed state:** Todo after SCKRL-020 acceptance.

**Summary:** Show estimated-versus-confirmed expiry clearly and provide accessible warning, overdue, and explicit discard interactions on Add Item, item detail, Stock, and Expiring surfaces.

**Acceptance criteria:**

- Estimated dates have a yellow warning affordance with an accessible label and a short explanation that invites exact package-date entry; the exact date remains user-editable.
- Overdue status has a red visual treatment plus a non-color indicator, such as the requested double exclamation, with accessible text that names the state and source.
- The interaction distinguishes printed use-by, printed best-before, user-entered, estimated, and unknown states when those facts are available; no generic “unsafe” claim is shown for every past date.
- Trash/discard requires a visible user action and confirmation. A notification or warning never auto-deletes, marks discarded, or claims the user has already discarded the item.
- Used, Compost, and any future Trash outcome retain the existing removal-outcome semantics and can be reloaded after the mutation; failed mutations leave the row unchanged and report the failure.
- Every warning has a tap path and a screen-reader path. Red/yellow styling is supplementary, not the only signal.

**Depends on:** SCKRL-406; coordinate with SCKRL-213, SCKRL-401, SCKRL-415, and SCKRL-908. Do not duplicate push-delivery implementation from SCKRL-411/412/421.

### SCKRL-408 — Preserve expiry when snoozing reminders

**Classification:** defect already identified by the mobile-first delivery review. **Priority:** P1 correctness. **Primary owner:** Backend, with Frontend and QA. **Stage:** Stage 1 before external reminders.

**Summary:** Store snooze/reminder state separately from the item expiry fact. “Snooze 2d” postpones a reminder or view without changing the source date.

**Acceptance criteria:**

- Snoozing an item leaves the displayed expiry date and its SCKRL-406 provenance unchanged.
- The item is omitted from the applicable reminder window only for the snooze period, then becomes eligible again according to the same expiry policy.
- Repeated snoozes, timezone boundaries, app restart, failed update, and retry are deterministic and idempotent.
- Recipe eligibility and discard decisions never treat a snooze as a new expiry date.

**Depends on:** SCKRL-406 and SCKRL-401. Publish the snooze contract for SCKRL-411/412 before reminder delivery; those tickets must not create a circular dependency. This ticket is the follow-up named in `docs/product/mobile-first-delivery-plan.md`.

### SCKRL-409 — Capture optional package evidence

**Classification:** later product scope. **Priority:** P2. **Primary owner:** Infrastructure for media/evidence boundaries, with Backend, Frontend, and QA. **Stage:** Stage 2 or later.

**Summary:** Let a user optionally attach a package-date photo and/or barcode to an existing stock item, keeping the flow quick and optional. Evidence supports identification and review; it does not prove expiry automatically.

**Acceptance criteria:**

- The user can skip evidence and retain an estimated or unknown item state without blocking normal stock management.
- A photo is captured/uploaded through the private-media contract, with household authorization, size/type checks, retention/deletion behavior, and visible upload failure/retry.
- A barcode is stored as optional product-identity evidence and is never treated alone as an expiry fact.
- Any date extracted from an image is a candidate with provenance and user confirmation; it cannot silently replace the active expiry fact.
- The product records whether evidence was user-provided, extracted, or confirmed, without claiming that evidence establishes a minimum safe lifetime.

**Depends on:** SCKRL-307, SCKRL-308, SCKRL-406, and a Backend product-identity/provenance contract. This is intentionally later than the current simulated receipt media path.

### SCKRL-507 — Personal recipe book and priority

**Classification:** later product scope. **Priority:** P2. **Primary owner:** Backend, with Frontend and QA. **Stage:** Stage 4 personalized recipes and meal timing.

**Summary:** Support household-owned custom recipes that appear alongside suggestions and receive an explicit personal-priority treatment, while preserving recipe source, editing, and outcome provenance.

**Acceptance criteria:**

- A household member can create, edit, archive, and view a custom recipe with structured ingredients, instructions, servings, tags, and source metadata.
- Personal recipes are clearly labeled and can be prioritized in the recipe book without falsifying match score or expiry eligibility.
- Suggestions can include personal recipes only through the same stock-eligibility and hard-constraint contracts as seeded recipes.
- Missing ingredients can flow to the existing shopping-list path, and any cooked/consumed action remains explicit and recoverable.
- Recipe data has ownership, authorization, source/license handling, and an outcome path for cooked, skipped, or dismissed states.

**Depends on:** SCKRL-501, SCKRL-505, structured recipe data, and the Stage 4 quantity-aware/non-destructive recipe contracts in `PROGRAM.md`.

### SCKRL-508 — Recipe sharing and album voting discovery

**Classification:** discovery/new scope. **Priority:** P3. **Decision owner:** Business Process Analyst and Orchestrator; Backend/Frontend support. **Stage:** Stage 4+ only after a product decision.

**Summary:** Explore private or bounded recipe collections with an album-like sharing and voting metaphor. This is a product discovery ticket, not authorization to build a social feed.

**Acceptance criteria for discovery:**

- Define the sharing boundary, household/member model, visibility, invitations, reporting/moderation, deletion, and abuse controls.
- Define whether votes rank recipes, collections, or suggestions, and how manipulation and personal data are handled.
- Define source/license requirements for user-created and imported recipes.
- Produce a decision record with pilot hypothesis, success/failure signals, and a recommendation to proceed, defer, or reject.

**Depends on:** SCKRL-507, recipe provenance/licensing, privacy controls, and an explicit Orchestrator product decision. No implementation should start from the metaphor alone.

### SCKRL-902 — Add bounded swipe interactions on mobile

**Classification:** usability gap. **Priority:** P1 mobile polish. **Primary owner:** Frontend, with QA/accessibility. **Stage:** Stage 1.

**Summary:** Add native-feeling swipe affordances where they fit the information architecture, beginning with the Phase 2 Expiring row actions and any clearly defined horizontal option navigation. Keep visible tap controls and system back behavior.

**Acceptance criteria:**

- The ticket names each screen and gesture; “swipe navigation everywhere” is not accepted as an unbounded requirement.
- Expiring-row swipe actions match the handoff where implemented: Used, Snooze 2d, and Compost, with a tap equivalent.
- Swipe actions have confirmation and error recovery for mutations; they cannot bypass discard confirmation or change expiry while snoozing.
- VoiceOver/accessibility labels, tap targets, keyboard/web fallback where applicable, reduced motion, and non-gesture alternatives pass QA.
- Native back swipe and horizontal content gestures do not conflict, and the screen remains usable for one-handed interaction.

**Depends on:** SCKRL-401, SCKRL-408, SCKRL-908, and a short Frontend interaction decision based on the user's intended surface.

### SCKRL-930 — Optional nutrition and calorie information discovery

**Classification:** later health/recommendation scope. **Priority:** P3. **Primary owner:** Backend with Orchestrator/QA health-policy review; Frontend and Infrastructure support. **Stage:** Stage 6 only.

**Summary:** Explore an explicitly optional question/opt-in for nutrition or calorie information on suggested and custom recipes. This ticket does not decide whether health data is collected or what guidance is safe.

**Acceptance criteria for discovery and policy gate:**

- Decide whether any health-related data is collected, with explicit purpose, consent, access, export, deletion, and retention boundaries.
- Identify vetted regional nutrition/allergen sources, licensing, update cadence, provenance, and confidence requirements.
- Define the UI boundary between general food information, optional wellness preferences, and medical advice; exclude diagnosis, treatment, eating-disorder, pregnancy, chronic-illness, and minor-specific guidance until reviewed.
- Require hard allergy/explicit-constraint exclusions with zero tolerated known-allergen breaches before implementation.
- Define opt-in, dismiss/skip, explanation, correction, and “not relevant” behavior for both seeded and personal recipes.

**Depends on:** `PROGRAM.md` Stage 6 gates, privacy controls, structured recipe data, and a Backend/Orchestrator decision. Do not implement calories or nourishment as part of SCKRL-501, SCKRL-507, or the current phone-test fix.

## Existing-ticket refinements and overlaps

- **SCKRL-406:** proceed as the source-of-truth contract for printed, user-entered, estimated, model-derived, confidence, and confirmation fields. It should not be replaced by SCKRL-407.
- **SCKRL-411 / SCKRL-412 / SCKRL-421:** absorb push registration, local-time scheduling, preference/opt-out, duplicate suppression, delivery/inbox state, and deep links. Add overdue wording only after Backend has defined eligibility and snooze semantics.
- **SCKRL-401 / SCKRL-415:** retain explicit Used/Compost outcomes and waste tracking. Add overdue status and confirmation only through SCKRL-407; do not create a second removal taxonomy casually.
- **SCKRL-501 / SCKRL-505:** SCKRL-506 filters recipe inputs. The existing “Cooked it” behavior remains a separate correctness concern: current code marks every matched stock row as used, so the mobile-first plan's restriction on destructive whole-lot completion still applies until a quantity-safe contract exists.
- **SCKRL-213 / SCKRL-202:** existing item detail/delete confirmation and soft-delete behavior are the baseline for explicit discard. Any new Trash copy must preserve confirmation, server failure handling, and removal provenance.
- **SCKRL-908:** add deterministic current-mobile coverage for recipe exclusion, expiry warning semantics, explicit discard, snooze preservation, and tap/gesture alternatives after the corresponding contracts land.

## Sequencing recommendation

1. Accept SCKRL-020 with SCKRL-506, SCKRL-407, SCKRL-408, and the SCKRL-411/412/421 refinements as the immediate reliability queue.
2. Implement the narrow SCKRL-506 existing-date gate now. Complete SCKRL-406 before source-aware copy, warning icons and richer eligibility policies.
3. Implement and QA SCKRL-506 before exposing recipe suggestions to external testers; keep the user-facing fallback conservative and explainable.
4. Correct snooze semantics in SCKRL-408 before push reminders. Implement SCKRL-407's visible/tap-accessible warning surface and refine the existing notification tickets rather than creating parallel delivery logic.
5. Add SCKRL-902 only with a bounded gesture map and accessibility coverage.
6. Revisit SCKRL-409 after real/private media and product identity contracts. Revisit SCKRL-507 after the core recipe data/consumption contracts. Keep SCKRL-508, SCKRL-930, and AI discovery behind their stated Stage 4/6 gates.

## Assumptions and open decisions

- The phone-test date is 2026-09-13 and the “June 26” value is treated as a user-observed item date, not independently verified receipt content.
- The test ran on a phone, but platform, device model, build, account, and environment are unknown. QA should capture these fields on the next reproduction.
- The immediate SCKRL-506 policy is accepted above. Source-specific handling of printed best-before/use-by, opened-package state and storage conditions needs the SCKRL-406 contract; date eligibility alone is not a safety assessment.
- The product must decide whether “Trash” is a new removal reason or copy over the existing Compost/Used pathways. Until decided, keep the current explicit outcomes and do not imply automatic deletion.
- “Swipe navigation” needs a screen-level definition: row actions, horizontal paging between recipe cards/options, or back navigation. SCKRL-902 scopes that decision before implementation.
- The source, license, region, and freshness requirements for nutrition/allergen facts remain open and belong to the Stage 6 health-policy gate.
- AI remains a later capability. Before any AI ticket, require a deterministic baseline, typed input/output contract, evaluation set, uncertainty/explanation, correction actions, privacy boundary, and safe fallback as required by `PROGRAM.md`.

## Acceptance-triage evidence

Reviewed for this triage: [`feedback.md`](../../feedback.md), [`PROGRAM.md`](../../PROGRAM.md), [`features.md`](../../features.md), [`status.md`](../../status.md), [`docs/product/stage-0-product-truth.md`](stage-0-product-truth.md), [`docs/product/mobile-first-delivery-plan.md`](mobile-first-delivery-plan.md), [`docs/design/phase-2-summary.md`](../design/phase-2-summary.md), the Phase 2 handoff screens/features, current recipe matching/detail code, and the current Expiring screen flow.

The product-owner observations are now represented by explicit routing and proposed acceptance criteria. Orchestrator scope review accepted the immediate SCKRL-506 gate and the remaining backlog routing. Independent GPT-5.5 QA accepted this triage and the SCKRL-506 implementation; Sol integration accepted the recipe gate. The remaining feature tickets are backlog scope, not completed implementation.
