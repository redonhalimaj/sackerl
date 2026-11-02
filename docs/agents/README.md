# Agent Docs

This folder contains role briefs for the Sackerl agent workflow.

The canonical roster, model-routing rules, delegation contract, and handoff contract live in [TEAM.md](../../TEAM.md).

The current Council topology is a root **Chair**, an **Astra Deputy/model router**, and exactly
three **Luna worker seats**. The six functional specialties below are dynamically assigned among
those three seats per issue; they do not create additional agents.

Current SCKRL-311 work remains with Codex through its review checkpoint. The owner's 2026-10-19
direction assigns subsequent implementation to Claude and independent QA to Codex: use
[the Claude implementation package](claude-next-work-package.md) and
[the Codex QA checkpoint](codex-next-work-package.md). No next ticket starts before its gates.

Use [Codex ↔ Claude handoff](codex-claude-handoff.md) when changing assistants. A Claude
continuation follows its recorded provider profile while preserving the current seat topology and
review requirements.

The owner's 2026-10-19 direction makes the Chair responsible for analysis, direct Luna instructions,
coordination and evidence synthesis. Astra performs brief model routing and work reviews only.
The Chair prepares review packets and records votes; existing unanimity and QA gates remain.

## Current Routing

| Seat                      | Model                                    | Reasoning                                                                                                   |
| ------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Root Chair / Orchestrator | Actual root runtime; record when exposed | Actual effort; record when exposed                                                                          |
| Deputy / model router     | `gpt-6-astra`                            | `high` standard; `xhigh` complex                                                                            |
| Luna worker A, B, C       | `gpt-6-luna`                             | `low` fast mechanical; `high` bounded implementation/QA; `xhigh` complex domain review with Chair and Astra |

Do not route current work to Terra, Sol, or GPT-5.5. The root is not presumed to run Astra. The
four-concurrency limit includes root. Root may run all three Lunas while Astra is absent; an Astra
review wave permits at most two concurrent Lunas. Verify capacity after completed waves; waiting
or idle status alone does not prove a slot is available. Reserve an independent QA
Luna during implementation (at most two writers), and rotate QA seats per ticket. QA does not
implement accepted changes. A Luna assigned junior mode performs bounded, mechanical, non-voting
work; there is no separate fourth junior agent. One agent assigned multiple specialties has one
vote.

Fast path: for a new bounded, reversible, low-risk decision, assign an owner and an independent
reviewer. Put the proposal in one brief and require both workers to explicitly Support the same
revision, followed by lightweight Chair integration. Direct factual source retrieval and routine
execution already covered by an accepted decision need no new decision or vote. Policy, auth/RLS,
secrets, privacy, safety, transactions, new contracts, and unresolved architecture require standard
or complex review. Standard path supports
one to three streams analyzed and coordinated by the Chair; Astra joins work reviews; shared contracts require every affected owner and domain reviewer
to vote, and integrated acceptance requires Chair, Astra, owners, and independent QA. Complex path
uses root Chair, Astra, responsible domain Luna, and independent QA for preliminary unanimity,
reciprocal Chair review, and fresh unanimous final votes.

Declare voters before findings. No proxy, silence, majority, Chair override, or dissenter removal
counts as assent. Each revised proposal or voter set requires fresh votes; allow at most two rounds
on the same evidence. Keep stream file ownership, contracts, and dependencies explicit. No automatic
migrations, deployment, merge, external writes, or scope expansion. Existing stage gates and Scrum
states remain in force.

## Roles

- [council-workflow.md](council-workflow.md)
- [deputy.md](deputy.md)
- [orchestrator.md](orchestrator.md)
- [business-process-analyst.md](business-process-analyst.md)
- [frontend.md](frontend.md)
- [backend.md](backend.md)
- [infrastructure.md](infrastructure.md)
- [devops.md](devops.md)
- [qa.md](qa.md)
- [junior.md](junior.md)

The root operating model lives in [AGENTS.md](../../AGENTS.md), with program direction in [PROGRAM.md](../../PROGRAM.md).

## Delegation Contract

Every delegated task must include:

- SCKRL ticket or explicit user-request identifier.
- Program stage and expected outcome.
- Functional role, worker seat, model, and reasoning effort.
- Owned files or layer and explicitly excluded scope.
- Upstream decisions and stable contracts.
- Required tests, QA evidence, and handoff recipient.

Every agent handoff must report:

- Assumptions and decisions made.
- Files, schemas, contracts, or environments changed.
- Checks run and their results.
- Known risks, incomplete behavior, and required follow-up tickets.
