# Sackerl Agent Operating Model

## Purpose

This repo uses a Scrum-style agent workflow for Sackerl, a mobile-first grocery stock management app for households. The app helps users scan or import receipts, review grocery items, place items into real storage locations, track expiry dates, receive reminders, and later use AI-assisted recipe and buying suggestions.

The foundation scaffold, Phase 1 design-system implementation, Slice 1 auth/profile/household setup, onboarding start, storage-zone setup, item data model, and item API are now in place on `dev`. Phase 2 product-screen implementation should follow the active handoff in `Design/Phase 2/sackerl phase 2`.

## Source Of Truth

- [PROGRAM.md](PROGRAM.md): long-term product direction, capability review, staged delivery program, and agent ownership. It does not replace live ticket status or accepted ticket scope.
- [TEAM.md](TEAM.md): canonical team composition, model assignment, delegation contract, escalation rules, and handoff workflow.
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
- `apps/mobile` is an Expo SDK 54 + Expo Router app with auth-gated onboarding, storage-zone setup, stock and expiry flows, recipe suggestions, shopping lists, and a simulated receipt-capture foundation.
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

`TEAM.md` is authoritative for model assignments and routing. This table is the repository-startup summary.

| Agent                    | Model          | Reasoning | Primary Ownership                                                                                                               |
| ------------------------ | -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Agent Orchestrator       | `gpt-5.6-sol`  | `xhigh`   | Plans work, routes models, coordinates subagents, resolves conflicts, integrates results, and enforces program stage gates.     |
| Business Process Analyst | `gpt-5.6-luna` | `high`    | Turns product goals into journeys, business rules, metrics, acceptance criteria, open decisions, and SCKRL tickets.             |
| Frontend                 | `gpt-5.6-luna` | `high`    | Implements scoped mobile/web UI, accessibility, correction flows, drag/tap alternatives, and visible prediction uncertainty.    |
| Backend                  | `gpt-5.5`      | `xhigh`   | Owns domain models, transactional APIs, receipt/OCR workflows, event history, notifications, and recommendation logic.          |
| Infrastructure           | `gpt-5.5`      | `xhigh`   | Owns architecture, privacy, persistence, media, jobs, environments, external services, reliability, and provider boundaries.    |
| DevOps                   | `gpt-5.6-luna` | `high`    | Owns scoped CI/CD, build tooling, environment automation, observability wiring, release checks, and deployment mechanics.       |
| QA                       | `gpt-5.5`      | `high`    | Owns stage-gate validation, integration and journey coverage, accessibility, data quality, recommendation evaluation, and risk. |

## Model Routing Rules

- Use the exact model and reasoning effort in the roster when the runtime supports explicit agent selection. Do not silently substitute another model.
- Use `gpt-5.6-sol` at `xhigh` for program integration, dependency resolution, conflicting evidence, final review, and work spanning multiple specialist roles.
- Use `gpt-5.5` for the highest-risk specialist reasoning: schemas and transactions, architecture and privacy, asynchronous workflows, recommendation logic, and QA or safety evaluation.
- Use `gpt-5.6-luna` for well-scoped, high-volume work with stable contracts: ticket refinement, UI implementation, CI wiring, documentation, and focused validation.
- A Luna-owned task must be escalated to the Orchestrator before it expands into unresolved cross-layer architecture, destructive migration design, authentication or RLS policy, health safety, or recommendation-policy decisions.
- Model routing does not change ownership. Every ticket still has one primary role owner and passes through QA before Done.

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

1. The Agent Orchestrator checks the applicable `PROGRAM.md` stage and gate, then assigns one primary owner with the roster model and reasoning effort.
2. The Business Process Analyst resolves product ambiguity and refines the outcome, rules, metrics, edge cases, and acceptance criteria.
3. Infrastructure records an ADR before work that changes storage, jobs, providers, privacy, data retention, security boundaries, or deployment topology.
4. Backend publishes stable contracts, migrations, deterministic behavior, and fixtures before dependent frontend implementation begins.
5. Frontend and DevOps implement only accepted, bounded tickets and coordinate changes through the primary owner.
6. QA validates acceptance criteria, failure paths, regression risk, and the applicable program exit criteria before work is considered Done.
7. The Agent Orchestrator performs cross-workstream integration review and returns incomplete or mock-only acceptance claims to the owning role.
8. After code is merged into `main`, the Agent Orchestrator updates [AGENTS.md](AGENTS.md), [PROGRAM.md](PROGRAM.md) when strategic direction changed, [CLAUDE.md](CLAUDE.md), [status.md](status.md), and relevant feature docs with durable knowledge.

## Coordination Rules

- Keep task ownership explicit. A ticket should have one primary agent owner even when other agents support it.
- Avoid overlapping edits between agents. Split by feature area, layer, or file ownership.
- Delegation prompts must name the ticket, owned files or layer, required outputs, dependencies, model, reasoning effort, and validation expected before handoff.
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
