# Agent Docs

This folder contains role briefs for the Sackerl agent workflow.

The canonical roster, model-routing rules, delegation contract, and handoff contract live in [TEAM.md](../../TEAM.md).

## Model Matrix

| Role                     | Model          | Reasoning |
| ------------------------ | -------------- | --------- |
| Orchestrator             | `gpt-5.6-sol`  | `xhigh`   |
| Business Process Analyst | `gpt-5.6-luna` | `high`    |
| Frontend                 | `gpt-5.6-luna` | `high`    |
| Backend                  | `gpt-5.5`      | `xhigh`   |
| Infrastructure           | `gpt-5.5`      | `xhigh`   |
| DevOps                   | `gpt-5.6-luna` | `high`    |
| QA                       | `gpt-5.5`      | `high`    |

The Orchestrator must use this matrix when the runtime supports explicit model routing. Model substitutions must be explicit. Luna agents receive bounded work with stable contracts; unresolved cross-layer, security, privacy, transactional, health-safety, or recommendation-policy questions return to the appropriate GPT-5.5 specialist and the Orchestrator.

## Roles

- [orchestrator.md](orchestrator.md)
- [business-process-analyst.md](business-process-analyst.md)
- [frontend.md](frontend.md)
- [backend.md](backend.md)
- [infrastructure.md](infrastructure.md)
- [devops.md](devops.md)
- [qa.md](qa.md)

The root operating model lives in [AGENTS.md](../../AGENTS.md), with program direction in [PROGRAM.md](../../PROGRAM.md).

## Delegation Contract

Every delegated task must include:

- SCKRL ticket or explicit user-request identifier.
- Program stage and expected outcome.
- Primary owner, model, and reasoning effort.
- Owned files or layer and explicitly excluded scope.
- Upstream decisions and stable contracts.
- Required tests, QA evidence, and handoff recipient.

Every agent handoff must report:

- Assumptions and decisions made.
- Files, schemas, contracts, or environments changed.
- Checks run and their results.
- Known risks, incomplete behavior, and required follow-up tickets.
