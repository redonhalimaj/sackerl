# Sackerl Agent Team

Last reviewed: 2026-09-06

Status: Canonical team, model-routing, delegation, and handoff policy.

## Purpose

This document defines which agent roles Sackerl uses, which model and reasoning effort each role
receives, how work moves between roles, and when a task must be escalated.

- `PROGRAM.md` defines long-term product stages, gates, safety constraints, and program outcomes.
- `features.md` defines accepted SCKRL ticket scope.
- `status.md` defines live ticket state.
- `AGENTS.md` defines repository-wide operating rules.
- `docs/agents/*.md` contains the detailed brief for each role.
- This file is authoritative for team composition and model assignment.

## Team Matrix

| Role                     | Model          | Reasoning | Primary responsibility                                                                                                         |
| ------------------------ | -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Agent Orchestrator       | `gpt-5.6-sol`  | `xhigh`   | Program reasoning, sequencing, model routing, conflict resolution, integration review, and stage-gate enforcement              |
| Business Process Analyst | `gpt-5.6-luna` | `high`    | User journeys, business rules, success metrics, open decisions, acceptance criteria, and SCKRL ticket refinement               |
| Frontend                 | `gpt-5.6-luna` | `high`    | Bounded mobile/web UI, accessibility, correction flows, interaction states, and visible uncertainty                            |
| Backend                  | `gpt-5.5`      | `xhigh`   | Domain models, migrations, transactional commands, OCR/jobs, inventory events, notifications, and recommendation logic         |
| Infrastructure           | `gpt-5.5`      | `xhigh`   | Architecture, security, privacy, storage, job topology, data lifecycle, environments, provider boundaries, backup, and restore |
| DevOps                   | `gpt-5.6-luna` | `high`    | Bounded CI/CD, environment automation, deployment, migration execution, observability wiring, and release checks               |
| QA                       | `gpt-5.5`      | `high`    | Acceptance challenge, stage-gate evidence, regression analysis, accessibility, data quality, and recommendation safety         |

## Assignment Rationale

- `gpt-5.6-sol` is reserved for the role that must reason across the whole program, reconcile
  conflicting specialist output, and decide whether stage gates are satisfied.
- `gpt-5.5` is assigned to specialist roles with the highest correctness cost: schema and
  transactional behavior, architecture and privacy, asynchronous processing, model-policy
  evaluation, and adversarial QA.
- `gpt-5.6-luna` is assigned to well-bounded, higher-volume delivery work after product rules,
  architecture, and contracts are stable.

Official model references:

- [GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol)
- [GPT-5.5](https://developers.openai.com/api/docs/models/gpt-5.5)
- [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna)

## Operating Topology

The team is orchestrator-led and ticket-driven. It is not a permanently running group of seven
agents.

1. The Orchestrator is the single integration owner.
2. Specialist agents are created for explicit SCKRL tickets or explicit user requests.
3. Every ticket has one primary role owner even when other roles support it.
4. Parallel work must use separate files, layers, or feature boundaries.
5. QA is independent from implementation and is required before Done.
6. Agents do not create unrelated product scope from `PROGRAM.md`; the Business Process Analyst and
   Orchestrator must first turn program work into accepted tickets.

Repository documentation selects the model for future delegated work when the runtime supports
explicit routing. It does not change the model of an agent session that is already running.

## Model Routing Rules

- Use the exact model and reasoning effort in the Team Matrix when supported by the runtime.
- Do not silently substitute a different model or effort. Report the unavailable route and make the
  fallback decision explicit.
- Use the Sol Orchestrator for cross-program dependencies, conflicting evidence, scope decisions,
  final integration, and stage-gate judgment.
- Use GPT-5.5 Backend for schema evolution, transactions, inventory or purchase events, OCR and job
  behavior, notification logic, deterministic recommendations, and model boundaries.
- Use GPT-5.5 Infrastructure for security, RLS and trust boundaries, privacy, health-data handling,
  data retention, external processing, object storage, jobs, backups, and production topology.
- Use GPT-5.5 QA for adversarial validation, cross-layer regression risk, OCR and recommendation
  evaluation, data-quality gates, and allergy or health-safety tests.
- Use Luna roles only after their ticket has stable scope, contracts, exclusions, and validation
  requirements.

## Mandatory Escalation

A Luna-owned task returns to the Orchestrator and the relevant GPT-5.5 specialist before continuing
when it encounters:

- Unresolved cross-layer architecture.
- Authentication, authorization, RLS, or secret-handling changes.
- Destructive or irreversible migration design.
- New transactional or concurrency semantics.
- Receipt, recommendation, or health-data retention and privacy decisions.
- Allergy, nutrition, medical, or other health-safety policy.
- Recommendation eligibility, ranking policy, confidence, or autonomous action.
- A requirement that contradicts `PROGRAM.md`, an accepted ticket, or an existing contract.

Escalation transfers the decision, not necessarily the implementation. After the specialist and
Orchestrator establish a stable decision, the bounded task can return to its original owner.

## Delivery Workflow

1. **Orchestrator:** Confirm the `PROGRAM.md` stage, dependencies, ticket, primary owner, model,
   reasoning effort, file/layer boundary, and expected validation.
2. **Business Process Analyst:** Define the user outcome, non-goals, business rules, terminology,
   safety constraints, success measure, edge cases, and open decisions.
3. **QA:** Challenge the acceptance criteria and specify the evidence required for ticket acceptance
   and the applicable program exit gate.
4. **Infrastructure:** Record an ADR before changes to storage, jobs, providers, privacy, security,
   retention, external processing, or deployment topology.
5. **Backend:** Publish stable data and API contracts, migrations, deterministic behavior, failure
   semantics, and fixtures before dependent UI implementation.
6. **Frontend:** Implement the full user flow, including accessibility, correction, loading, empty,
   error, retry, and visible uncertainty states.
7. **DevOps:** Implement approved environment, migration, job, observability, deployment, rollback,
   and release automation.
8. **QA:** Validate independently against acceptance criteria, failure paths, regression scope, and
   the program stage gate.
9. **Orchestrator:** Integrate the work, resolve conflicting findings, reject incomplete or mock-only
   acceptance claims, update status, and record durable knowledge after acceptance.

Steps that do not apply to a narrow ticket may be omitted explicitly by the Orchestrator. QA and
integration review cannot be omitted for implementation tickets.

## Delegation Contract

Every task sent to an agent must include:

- SCKRL ticket or explicit user-request identifier.
- Program stage and intended user outcome.
- Primary role owner, model, and reasoning effort.
- Owned files or layer.
- Explicitly excluded scope.
- Dependencies, accepted decisions, and stable contracts.
- Required deliverables and validation.
- Handoff recipient.

## Handoff Contract

Every returning agent must report:

- Assumptions and decisions made.
- Files, schemas, contracts, or environments changed.
- Tests and checks run, including failures or checks not run.
- Acceptance criteria satisfied or still incomplete.
- Compatibility or migration implications.
- Known risks and unresolved questions.
- Follow-up tickets required.

## Role Briefs

- [Agent Orchestrator](docs/agents/orchestrator.md)
- [Business Process Analyst](docs/agents/business-process-analyst.md)
- [Frontend](docs/agents/frontend.md)
- [Backend](docs/agents/backend.md)
- [Infrastructure](docs/agents/infrastructure.md)
- [DevOps](docs/agents/devops.md)
- [QA](docs/agents/qa.md)

## Maintenance

- The Orchestrator owns this file.
- Update it only when team composition, model assignment, routing, escalation, or handoff policy
  changes.
- Keep the model matrix in `AGENTS.md`, `PROGRAM.md`, and `docs/agents/README.md` synchronized with
  this file.
- Record model-routing decisions in `status.md`.
- Do not store API keys, credentials, user data, or temporary session notes here.
