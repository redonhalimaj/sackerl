# Sackerl Agent Team

Last reviewed: 2026-10-19

Status: Canonical team, model-routing, delegation, and handoff policy.

## Purpose

This document defines which agent roles Sackerl uses, which model and reasoning effort each role
receives, how work moves between roles, and when a task must be escalated.

The specialist group is named **The Team**. The Council has the root assistant as **Chair**, a
separate `gpt-6-astra` **Deputy**, and exactly three `gpt-6-luna` worker seats. The Deputy and
required participating workers reach a unanimous recommendation; after reciprocal Chair review,
all required participants endorse the same final revision. See
[Council workflow](docs/agents/council-workflow.md) for voting, disagreements and resource limits.

- `PROGRAM.md` defines long-term product stages, gates, safety constraints, and program outcomes.
- `features.md` defines accepted SCKRL ticket scope.
- `status.md` defines live ticket state.
- `AGENTS.md` defines repository-wide operating rules.
- `docs/agents/*.md` contains the detailed brief for each role.
- This file is authoritative for team composition and model assignment.

## Provider Profiles

The owner explicitly authorized Codex ↔ Claude continuation on 2026-09-13. Follow
[the shared handoff workflow](docs/agents/codex-claude-handoff.md) and keep the live checkpoint in
`status.md`. One assistant owns writing to a given set of files at a time.

Clarification on 2026-09-16: keep Codex active for ongoing work. Claude handover is conditional on
unfinished work that cannot be completed in the current session or an owner-requested switch.
Owner-requested parallel Claude work uses separate ticket/file ownership and one integration
owner; ordinary checkpoints do not imply a transfer.

Historical clarification on 2026-09-28 (superseded below): the owner requested an alternating handover after the active Council
work: Codex prepares the next bounded issue for Claude, and Claude prepares the return package for
Codex. Follow the [handoff workflow](docs/agents/codex-claude-handoff.md); retain honest ticket states,
independent QA and one writer per file set. A prepared handover does not launch the other assistant.

Historical owner preference (2026-09-29; superseded for work after SCKRL-311): prepare continuation for a future GPT/Codex session;
Claude is not the next recipient. Use [the Codex handover](docs/agents/codex-next-work-package.md).
This supersedes mandatory alternation. Preserve the Council, independent QA and shared checkpoint;
only involve Claude again on an explicit owner request. No roster/model changes are implied.

Current owner preference (2026-10-19): finish the active SCKRL-311 work in Codex first, then prepare
a Claude handoff for the next bounded program topics. Claude will implement subsequent assigned
work and Codex will provide independent QA. Preparing a package does not start Claude, release an
unfinished ticket gate or permit overlapping writes. The current Council topology and provider
profiles remain; Codex reviewers must not implement changes they independently accept.

- **Codex profile:** use the exact roster below for delegated work when available. Existing
  running sessions retain their actual model; record it honestly.
- **Claude profile:** use the Claude model selected in the user's runtime. Record its actual
  identity/settings when exposed, or `unknown` otherwise. The same Orchestrator, Business Process
  Analyst, Frontend, Backend, Infrastructure, DevOps and QA roles apply. Explicit GPT assignments
  in the roster and role briefs are Codex defaults, not a requirement to obtain GPT access from
  Claude. Delegates use available, explicitly recorded Claude models; no cross-provider effort
  equivalence is assumed.
- In either profile, escalate unresolved architecture, security, transactional, privacy, health
  and recommendation-policy decisions to the responsible specialist role and Orchestrator.
  Preserve independent QA and integration gates. If a required reviewer is unavailable, leave
  review pending rather than asserting acceptance.

This is a standing provider-routing exception authorized by the user, not a silent model
substitution. Switching providers needs no repeated permission within the existing task scope.
It does not authorize new feature scope, simultaneous overlapping writers, or external writes.
The profile rules take precedence over provider-specific wording elsewhere in the repo.

Current owner direction (2026-10-15): use Astra and exactly three Luna worker seats for Council
work. The current root remains Chair and records its actual model and effort; this direction does
not switch a running root session to Astra. The separate Deputy routes to `gpt-6-astra`. The three
peer worker seats take whichever of Business Process Analyst, Frontend, Backend, Infrastructure,
DevOps or QA roles the issue needs. They are seats, not six permanent agents or Terra/Sol/GPT-5.5
routes. Mechanical low-effort work is a task mode within these seats, not a fourth junior seat.
This current roster supersedes earlier model assignments; keep dated provider and handoff
exceptions as historical records without rewriting prior votes or work.

Current owner direction (2026-10-19): the root Chair is the analyzer, orchestrator and direct
instructor of the Lunas. Astra performs brief model routing and participates only in work reviews;
it does not coordinate implementation or maintain a parallel analysis stream. The Chair prepares
review packets and records votes. Existing unanimity, reciprocal review, independent QA and stage
gates remain in force. This supersedes broader Deputy duties in the 2026-10-15 policy; historical
decisions and votes remain unchanged.

## Team Matrix (Codex Defaults)

| Seat / role                       | Model          | Reasoning effort                                  | Responsibility                                                                          |
| --------------------------------- | -------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Chair / Agent Orchestrator (root) | Actual runtime | Record actual; do not imply a switch              | Analysis, Luna instructions, orchestration, evidence synthesis, review and integration. |
| Deputy                            | `gpt-6-astra`  | `high`; `xhigh` for complex work                  | Brief model routing and independent work review; no ongoing coordination.               |
| Worker A                          | `gpt-6-luna`   | `low` mechanical; `high` default; `xhigh` complex | Assigned issue-specific role; investigate, own, implement or independently review.      |
| Worker B                          | `gpt-6-luna`   | `low` mechanical; `high` default; `xhigh` complex | Assigned issue-specific role; investigate, own, implement or independently review.      |
| Worker C                          | `gpt-6-luna`   | `low` mechanical; `high` default; `xhigh` complex | Assigned issue-specific role; investigate, own, implement or independently review.      |

## Assignment Rationale

Use no more workers than the issue requires. Select roles and owners before evidence collection,
with at most three active issue streams. The three Lunas are peers: they may vote and review when
assigned. Set `low` for quick factual or mechanical work, `high` for implementation and independent
QA, and `xhigh` for complex or domain-sensitive work led by the Chair with Astra at review. Record the
actual model and effort for each participant. Official model references: [GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra) and [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna).

## Operating Topology

The Council is Chair-led and ticket-driven. The three Luna seats take issue-specific specialist
roles as needed rather than remaining six permanent agents. The Chair analyzes the work, instructs the Lunas, coordinates execution and synthesizes evidence.
Astra is used briefly for model routing and returns only for work reviews.

1. The Orchestrator is the single integration owner.
2. Specialist agents are created for explicit SCKRL tickets or explicit user requests.
3. Every ticket has one primary role owner even when other roles support it.
4. Parallel work must use separate files, layers, or feature boundaries.
5. QA is independent from implementation and is required before Done.
6. Agents do not create unrelated product scope from `PROGRAM.md`; the Business Process Analyst and
   Orchestrator must first turn program work into accepted tickets.

Apply the Council to substantive decisions and acceptance; routine execution follows a ratified
approach. The existing delivery workflow below supplies role-specific work and QA gates within
that decision cycle. Unresolved disputes may reach the Chair explicitly as disputes, never as a
fabricated unanimous recommendation. The Chair cannot override the final unanimity requirement.

Repository documentation selects the model for future delegated work when the runtime supports
explicit routing. It does not change the model of an agent session that is already running.

### Junior support

Mechanical support uses `low` effort within Worker A, B or C; it adds no agent or seat. This mode
has no Council vote or independent QA authority. The supervising worker reviews its result, and a
different worker independently QA's implementation changes. See the
[junior brief](docs/agents/junior.md) for task-local instructions and boundaries.

## Model Routing Rules

- Use the exact current roster and record actual model and effort. Do not route current work to
  Terra, Sol, GPT-5.5 or extra junior agents.
- Select only the roles needed from the three Luna seats. For implementation, reserve one of the
  three for independent QA. No agent accepts its own implementation, and an agent cannot count as
  two voters by taking two roles.
- Use Astra only for bounded model routing and work reviews. The Chair leads analysis, assignments,
  implementation coordination and evidence synthesis; domain ownership remains explicit.
- Low-effort mechanical support is a non-voting task mode within an assigned seat. It does not add a
  fourth seat or provide independent QA for its own work.

## Mandatory Escalation

A Luna-owned task returns to the Chair and relevant Luna domain owner for analysis, with Astra
involved in the resulting design/work review before dependent implementation, when it encounters:

- Unresolved cross-layer architecture.
- Authentication, authorization, RLS, or secret-handling changes.
- Destructive or irreversible migration design.
- New transactional or concurrency semantics.
- Receipt, recommendation, or health-data retention and privacy decisions.
- Allergy, nutrition, medical, or other health-safety policy.
- Recommendation eligibility, ranking policy, confidence, or autonomous action.
- A requirement that contradicts `PROGRAM.md`, an accepted ticket, or an existing contract.

Escalation transfers the decision, not necessarily the implementation. After the domain owner,
Chair and reviewers establish a stable decision, the bounded task can return to its original owner.

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

- [Council workflow](docs/agents/council-workflow.md)
- [Deputy](docs/agents/deputy.md)
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
- Keep the current roster summary in `AGENTS.md` and other current routing summaries synchronized
  with this file.
- Record model-routing decisions in `status.md`.
- Do not store API keys, credentials, user data, or temporary session notes here.
