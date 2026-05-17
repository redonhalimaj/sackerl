# Sackerl Agent Operating Model

## Purpose

This repo uses a Scrum-style agent workflow for Sackerl, a mobile-first grocery stock management app for households. The app helps users scan or import receipts, review grocery items, place items into real storage locations, track expiry dates, receive reminders, and later use AI-assisted recipe and buying suggestions.

The initial phase is planning and foundation. Design and implementation will follow once the first UI direction is available.

## Source Of Truth

- [epic.md](epic.md): product epics and high-level delivery map.
- [features.md](features.md): feature index and feature-document rules.
- [status.md](status.md): live Scrum ticket status.
- [CLAUDE.md](CLAUDE.md): coding-agent guidance for working in this repo.
- [docs/agents](docs/agents): detailed role briefs for the orchestrator and subagents.

## Agent Roster

| Agent | Model / Role | Primary Ownership |
| --- | --- | --- |
| Agent Orchestrator | GPT-5.5 / gpt.5.5 | Plans work, splits tickets, coordinates subagents, resolves conflicts, integrates results, updates repo knowledge after merge. |
| Business Process Analyst | Subagent | Turns product goals into epics, features, user journeys, acceptance criteria, and SCKRL tickets. |
| Frontend | Subagent | Implements mobile-first web/app UI, design system, accessibility, drag-and-drop and tap alternatives. |
| Backend | Subagent | Implements domain models, APIs, receipt parsing workflows, notification logic, and AI-facing boundaries. |
| Infrastructure | Subagent | Owns application architecture, data persistence, environment topology, storage, queues, and external services. |
| DevOps | Subagent | Owns repo setup, CI/CD, build tooling, environment automation, release checks, and deployment mechanics. |
| QA | Subagent | Validates acceptance criteria, regression risk, accessibility, cross-device behavior, and release readiness before merge. |

## Scrum Ticket Model

All implementation work should be tracked as `SCKRL-XXX`, for example `SCKRL-001`.

Ticket states:

| State | Meaning |
| --- | --- |
| Todo | Identified but not ready for implementation. |
| Ready | Scope and acceptance criteria are clear. |
| In Progress | Actively being worked on. |
| Review | Implementation is ready for review. |
| QA | QA validation is running or pending. |
| Blocked | Work cannot continue without a decision or dependency. |
| Done | Work is completed locally and validated. |
| Merged | Work is merged into `main` and docs are updated. |

## Delivery Flow

1. The Business Process Analyst refines product or design input into epics, features, and acceptance criteria.
2. The Agent Orchestrator creates or updates `SCKRL-XXX` tickets in [status.md](status.md) and assigns likely agent ownership.
3. Implementation agents work only from scoped tickets or explicit user requests.
4. QA validates behavior against acceptance criteria before work is considered done.
5. After code is merged into `main`, the Agent Orchestrator updates [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md), [status.md](status.md), and relevant feature docs with durable knowledge.

## Coordination Rules

- Keep task ownership explicit. A ticket should have one primary agent owner even when other agents support it.
- Avoid overlapping edits between agents. Split by feature area, layer, or file ownership.
- QA is a gate before merge, not a cleanup step after merge.
- Update `status.md` whenever a ticket changes state.
- Update `AGENTS.md` and `CLAUDE.md` only with stable repo knowledge, not temporary notes.
- Keep product decisions visible in feature docs so design, frontend, backend, and QA work from the same assumptions.

## Product Principles To Preserve

- Receipt-first stock creation should be fast, correctable, and forgiving.
- Drag-and-drop placement is a key identity interaction, but tap-based alternatives are required for accessibility.
- Expiry estimates must remain user-confirmed to avoid false precision.
- Notifications must be useful and controllable, not noisy.
- AI features should assist, explain, and accept user correction.
- Europe-specific complexity matters: languages, receipt formats, units, grocery habits, and household storage such as basements or cellars.
