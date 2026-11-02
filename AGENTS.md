# Sackerl Agent Operating Model

## Purpose

This repo uses a Scrum-style agent workflow for Sackerl, a mobile-first grocery stock management app for households. The app helps users scan or import receipts, review grocery items, place items into real storage locations, track expiry dates, receive reminders, and later use AI-assisted recipe and buying suggestions.

The foundation scaffold, Phase 1 design-system implementation, Slice 1 auth/profile/household setup, onboarding start, storage-zone setup, item data model, and item API are now in place on `dev`. Phase 2 product-screen implementation should follow the active handoff in `Design/Phase 2/sackerl phase 2`.

## Source Of Truth

- [PROGRAM.md](PROGRAM.md): long-term product direction, capability review, staged delivery program, and agent ownership. It does not replace live ticket status or accepted ticket scope.
- [TEAM.md](TEAM.md): canonical team composition, model assignment, delegation contract, escalation rules, and handoff workflow.
- [Council workflow](docs/agents/council-workflow.md): issue-sized review uses explicit unanimous votes, independent QA, reciprocal Chair review where required, and fresh votes for each revision.
- [Codex ↔ Claude handoff](docs/agents/codex-claude-handoff.md): conditional handover or parallel-work workflow; use the current work checkpoint in `status.md` first.
- [epic.md](epic.md): product epics and high-level delivery map.
- [features.md](features.md): feature index and feature-document rules.
- [status.md](status.md): live Scrum ticket status.
- [CLAUDE.md](CLAUDE.md): coding-agent guidance for working in this repo.
- [README.md](README.md): repo setup, commands, and monorepo overview.
- [docs/monorepo.md](docs/monorepo.md): workspace layout and cross-platform boundaries.
- [docs/environment.md](docs/environment.md): environment keys and ignored local env-file rules.
- [docs/design](docs/design): design source pointers and Phase 2 handoff summary.
- [docs/agents](docs/agents): detailed role briefs for the orchestrator and subagents.
- [docs/qa](docs/qa), [docs/architecture](docs/architecture), and [docs/product](docs/product):
  accepted Stage 0 truth, journey, architecture, and measurement artifacts.

## Current Foundation Baseline

- SCKRL-001 is completed locally.
- The repo uses pnpm workspaces with Turborepo.
- `apps/web` is a Next.js App Router scaffold.
- `apps/web` exposes authenticated API route handlers for profile, household, stock, receipts, receipt parsing, recipes, and shopping lists.
- `apps/mobile` is an Expo SDK 57 + Expo Router app with auth-gated onboarding, storage-zone setup, stock and expiry flows, recipe suggestions, shopping lists, and a simulated receipt-capture foundation.
- `packages/tokens` and `packages/ui` contain the Phase 1 design-system foundation, including the animated paper bag and tab-shell UI assets.
- `packages/api-client` contains shared Supabase-backed auth, profile/household, stock, receipt, recipe, and shopping-list clients.
- `.env*` files are ignored local files and must not be tracked in Git.
- CI is defined in `.github/workflows/ci.yml` for install, format, lint, typecheck, and tests.
- Phase 2 product handoff is available at `Design/Phase 2/sackerl phase 2` and is the active source for Slice 1 product-screen work.
- The current implemented prototype is recorded in `status.md`; Stage 0 is launched through SCKRL-020 through SCKRL-024, and SCKRL-304 remains gated by that product-truth and QA work.
- The dev Supabase API secret exposed during runtime QA was deleted and replaced on 2026-06-02. Do not paste the new secret into chat; add it only to ignored local env files if needed.

Do not add unrelated product UI, OCR, notification, or AI provider implementation unless the relevant SCKRL ticket or explicit user request is active.

Default Slice 1 provider recommendation: Supabase Auth plus Supabase/Postgres unless the user explicitly overrides it.

## Agent Roster

`TEAM.md` is authoritative for model assignments and routing. The current topology has a root Chair,
an Astra Deputy, and exactly three Luna worker seats. Functional specialties are assigned among
those seats per issue; they are not additional agents.

| Seat                      | Model                                            | Default reasoning                                                                                              | Assignment                                                                                                      |
| ------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Root Chair / Orchestrator | Actual root runtime model, recorded when exposed | Actual effort, recorded when exposed                                                                           | Analysis, Luna instructions, orchestration, evidence synthesis, review and integration; records actual runtime. |
| Deputy / model router     | `gpt-6-astra`                                    | `high` standard; `xhigh` complex                                                                               | Brief model routing and work reviews only; no ongoing coordination.                                             |
| Luna worker A             | `gpt-6-luna`                                     | `low` fast mechanical; `high` bounded implementation or QA; `xhigh` complex domain review with Chair and Astra | Dynamically assigned functional specialty.                                                                      |
| Luna worker B             | `gpt-6-luna`                                     | `low` fast mechanical; `high` bounded implementation or QA; `xhigh` complex domain review with Chair and Astra | Dynamically assigned functional specialty.                                                                      |
| Luna worker C             | `gpt-6-luna`                                     | `low` fast mechanical; `high` bounded implementation or QA; `xhigh` complex domain review with Chair and Astra | Dynamically assigned functional specialty.                                                                      |

Functional specialties are Business Process Analysis, Frontend, Backend, Infrastructure, DevOps, and
QA. Assign them among the three Luna seats for each issue; one agent covering multiple specialties
has one vote. There is no separate fourth junior agent. Junior work is a bounded, non-voting mode
for an assigned Luna seat.

Current owner direction (2026-10-19): the Chair leads analysis, orchestration, evidence synthesis
and direct Luna instructions. Astra performs brief model routing and participates only in work
reviews. Preserve independent QA, reciprocal review and unanimous acceptance.

## Model Routing And Council Rules

- Do not route current work to Terra, Sol, or GPT-5.5. Record actual model identity and effort; never imply a preferred route changed the running root session.
- The four-concurrency limit includes root. Without Astra running, root may run all three Lunas (two owners and independent QA); during Astra review, at most two Lunas run. Complete a wave and verify actual capacity; idle or waiting status does not prove a free slot.
- Fast path: for a new bounded, reversible, low-risk decision, assign an owner and an independent reviewer. Put the proposal in one brief and require both workers to explicitly Support the same revision, followed by lightweight Chair integration. Direct factual source retrieval and routine execution already covered by an accepted decision need no new decision or vote. Fast path excludes policy, auth/RLS, secrets, privacy, safety, transactions, new contracts, and unresolved architecture.
- Standard path: one to three workstreams analyzed and coordinated by the Chair with affected Luna owners; Astra joins work reviews. Shared contracts require votes from all affected owners and domain reviewers. Final integrated acceptance requires Chair, Astra, owners, and independent QA.
- Complex path: root Chair, Astra, responsible domain Luna, and independent QA jointly design and accept. Require preliminary unanimity, reciprocal Chair review, and fresh unanimous final votes.
- Declare voters before findings. No proxy, silence, majority, Chair override, or removal of a dissenter counts as assent. Every revised proposal or voter set receives fresh votes; allow at most two rounds on the same evidence.
- Independent QA does not implement accepted changes. Reserve one of the three Luna seats for QA during implementation (at most two writers) and rotate the QA seat per ticket.
- Keep file ownership, contracts, and dependencies explicit across streams. No automatic migrations, deployment, merge, external writes, or scope expansion.
- Escalate unresolved architecture, auth/RLS, secrets, privacy, safety, transactions, contracts, and policy questions to the applicable standard or complex path. Preserve ticket ownership and independent QA before Done.

## Scrum Ticket Model

All implementation work should be tracked as `SCKRL-XXX`, for example `SCKRL-001`.

Ticket states:

| State       | Meaning                                                |
| ----------- | ------------------------------------------------------ |
| Todo        | Identified but not ready for implementation.           |
| Ready       | Scope and acceptance criteria are clear.               |
| In Progress | Actively being worked on.                              |
| Review      | Implementation is ready for review.                    |
| QA          | QA validation is running or pending.                   |
| Blocked     | Work cannot continue without a decision or dependency. |
| Done        | Work is completed locally and validated.               |
| Merged      | Work is merged into `main` and docs are updated.       |

## Delivery Flow

Use the [Council workflow](docs/agents/council-workflow.md) and the fast, standard, or complex path
specified above. Routine execution under an accepted decision does not need a new vote. Preserve
independent QA, visible dissent, predeclared voters, and fresh unanimous votes for each revision.

1. The root Chair checks the applicable `PROGRAM.md` stage and gate, uses brief Astra model routing when needed, and directly instructs the Lunas. The Chair records actual model/effort, owners, reviewers, voters, dependencies and file boundaries.
2. The Business Process Analyst resolves product ambiguity and refines the outcome, rules, metrics, edge cases, and acceptance criteria.
3. Infrastructure records an ADR before work that changes storage, jobs, providers, privacy, data retention, security boundaries, or deployment topology.
4. Backend publishes stable contracts, migrations, deterministic behavior, and fixtures before dependent frontend implementation begins.
5. Frontend and DevOps implement only accepted, bounded tickets and coordinate changes through the primary owner.
6. QA validates acceptance criteria, failure paths, regression risk, and the applicable program exit criteria before work is considered Done.
7. The root Chair performs cross-workstream integration review and returns incomplete or mock-only acceptance claims to the owning specialty.
8. After code is merged into `main`, the root Chair updates [AGENTS.md](AGENTS.md), [PROGRAM.md](PROGRAM.md) when strategic direction changed, [CLAUDE.md](CLAUDE.md), [status.md](status.md), and relevant feature docs with durable knowledge.

## Coordination Rules

- Keep task ownership explicit. A ticket should have one primary agent owner even when other agents support it.
- Avoid overlapping edits between agents. Split by feature area, layer, or file ownership.
- Assignments must name the ticket, functional specialty and worker seat, owned files or layer, required outputs, dependencies, model, reasoning effort, voters, and validation expected before handoff.
- Specialist agents must report assumptions, changed contracts, verification evidence, unresolved risks, and follow-up tickets to the Orchestrator.
- QA is a gate before merge, not a cleanup step after merge.
- Update `status.md` whenever a ticket changes state.
- Update `AGENTS.md` and `CLAUDE.md` only with stable repo knowledge, not temporary notes.
- Consult `PROGRAM.md` before planning new epics, AI or learning work, nutrition features, or expansion beyond food. Update it only when long-term program direction changes.
- Keep product decisions visible in feature docs so design, frontend, backend, and QA work from the same assumptions.

## Product Principles To Preserve

- Receipt-first stock creation should be fast, correctable, and forgiving.
- Drag-and-drop placement is a key identity interaction, but tap-based alternatives are required for accessibility.
- Expiry estimates must remain user-confirmed to avoid false precision.
- Notifications must be useful and controllable, not noisy.
- AI features should assist, explain, and accept user correction.
- Europe-specific complexity matters: languages, receipt formats, units, grocery habits, and household storage such as basements or cellars.
