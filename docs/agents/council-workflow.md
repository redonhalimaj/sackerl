# Council workflow

Adopted: 2026-09-28. Policy version: 1.

The Council combines detailed work by **The Team**, coordination by a **Deputy**, and expert
review by the **Chair**. The Deputy and The Team reach a unanimous recommendation before normal
Chair review. The Chair challenges and refines it, hears their responses, and can change their
own position. The final decision requires everyone's explicit agreement on the same revision.

[TEAM.md](../../TEAM.md) owns model routing. This document defines the decision process; it does
not launch a background service, change the current session's model, or run agents automatically.

## Seats and responsibilities

| Seat                       | Assignment                                                   | Responsibility                                                                                                                    |
| -------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Chair / Agent Orchestrator | Root assistant; preferred Codex route `gpt-6-astra`, `xhigh` | Frame scope, challenge assumptions, examine cross-domain tradeoffs, refine the recommendation and own final integration.          |
| Deputy                     | `gpt-5.5`, `xhigh`                                           | Organize the detailed work, route specialist assignments, reconcile evidence, collect votes and present a concise recommendation. |
| The Team                   | Relevant specialists from the TEAM.md roster                 | Investigate, design, implement and test within assigned boundaries; review each other's evidence and speak independently.         |

The Team comprises Business Process Analyst, Frontend, Backend, Infrastructure, DevOps and QA.
Only the roles needed for the particular decision participate. A role is not an extra agent unless
assigned actual work. The Deputy is a distinct participant, not a substitute for all specialist
opinions. The Chair remains accountable for integration; one specialist remains primary owner of
each ticket. Record actual model/effort when exposed, or unknown; a preferred route is not proof of
the root session's identity. Never silently substitute an unavailable model.

## When to use it

Use the Council for an authorized ticket's substantive design/contract decisions, material changes
to an accepted approach, and final acceptance. Routine edits within an accepted decision continue
without a vote on every line. Batch related questions into one decision brief. Existing migrations,
release permissions, scope exclusions and program gates still apply.

The Chair declares the scope and required participating roles before seeing their votes. Include
the primary owner and a separate QA reviewer for implementation acceptance. Include Infrastructure
for the persistence/security/privacy/provider changes that already require an ADR. Include affected
Backend, Frontend or product roles where the decision changes their contract or user outcome.
For high-risk decisions covered by TEAM.md's mandatory escalation rules, include independent QA
and the responsible domain specialist during design as well as final acceptance. Record why other
roles are not implicated; a narrow documentation decision need not convene unrelated implementers.
Do not remove an objector to achieve unanimity. Newly discovered impact adds the relevant role;
changing membership or substance requires a new revision and fresh votes.

## Decision cycle

1. **Chair frames the work.** State the ticket or explicit user request, outcome, exclusions,
   acceptance criteria, relevant stage, participating roles, ownership and resource limits.
   Delegate detailed exploration to the Deputy; avoid prescribing a preferred answer prematurely.
2. **Deputy and The Team investigate.** Specialists first report independent findings and options.
   Then compare evidence, challenge assumptions and resolve conflicts. Prompts must follow the
   delegation contract in TEAM.md. Each assignment has a concrete output and disjoint file ownership.
3. **Deputy gathers preliminary consensus.** Publish one versioned recommendation containing the
   proposed decision, alternatives, strongest counterargument, evidence, limitations and consequences.
   Collect explicit votes from every required Team participant and from the Deputy on that revision.
   Only a unanimous recommendation is presented as ready for normal Chair review.
4. **Chair reviews and responds.** Inspect the relevant source/evidence and identify agreement,
   objections, missing evidence or a refinement. Explain conclusions and tradeoffs concisely.
   The Deputy and specialists respond; the Chair must address a supported counterargument and may
   adopt their better approach. Model rank is never evidence that a position is correct.
5. **Reconcile and ratify.** The Deputy publishes the final revision with the Chair's input and
   the team's responses. The Deputy, every required Team participant and the Chair explicitly vote
   on that exact revision. Chair edits invalidate earlier votes; no silent override or majority vote
   counts as a Council decision. Ratification requires all votes to be Support.
6. **Execute and verify.** For a design decision, implement within the ratified scope and let the
   Deputy handle routine coordination. For final acceptance, independent QA must inspect the actual
   final diff and required checks before voting. Return material discoveries to the cycle. Record the
   decision and remaining gates in the ticket ledger; the Chair updates status.md.

Planning consensus approves an approach, not an unimplemented outcome. Final acceptance uses
separate evidence and votes. Documentation-only work needs source/link/consistency review rather
than application tests. No ticket reaches Done merely because everyone agrees.

## Honest unanimity and disagreements

Votes are **Support**, **Object**, or **Needs evidence**. Include a short rationale and the revision
reviewed. Silence, unavailability, abstention, conditional approval and "no response yet" are not
Support. The Deputy cannot vote for another agent or invent an absent role's review. A replaced
reviewer must independently review the current evidence and the predecessor's unresolved objections.

Support may accept a named non-blocking residual risk when the applicable acceptance criteria allow
it; it cannot waive an unmet gate. A missing required check is still Needs evidence for final
acceptance, even if a design recommendation can proceed before that check exists.

Allow at most two reconciliation rounds on the same evidence. If disagreement remains, the Deputy
sends the Chair an explicitly **unresolved dispute**, not a unanimous recommendation: positions,
evidence, missing fact and the smallest experiment or decision needed. The Chair directs that next
step and hears the responses. Resume voting only with new evidence, a materially revised proposal
or an explicit user decision. Continue independent work that does not depend on the dispute.
Do not repeat debate until a dissenter gives in. Seek user input only for an actual missing product
preference, authorization boundary or irreconcilable requirement; ordinary technical disagreement
belongs with the Council. If unresolved, checkpoint it as pending; never manufacture agreement.

## Independence and resource discipline

- QA must not have implemented the changes it accepts. If the Chair or Deputy writes code, retain
  a separate QA agent. A correction after QA needs review appropriate to the changed evidence.
- Spend specialist effort on source inspection, implementation and verification. Give the Chair a
  concise brief plus direct evidence links so it can inspect consequential claims, rather than
  reproduce all of the work. Cost savings are an objective, not a claimed pricing comparison.
- Reuse completed investigations; reopen checks only when new changes or evidence justify it.
  Prefer relevant specialists over convening all six roles for every small question.
- Respect the runtime's actual concurrency limit. With four slots, use Chair + Deputy + at most
  two specialists at once. Work in waves and retain explicit votes; voters need not run concurrently.
  A waiting Deputy can release its active slot and resume after specialists finish.
- The root schedules agent launches when the runtime requires it; the Deputy still prepares the
  assignments and coordinates the substance. Avoid competing launchers or unbounded nested teams.
- Use one writer per file set. The Chair owns status.md by default; delegate ownership of a
  decision record explicitly if the Deputy will maintain it. Neither consensus nor this workflow
  authorizes a migration, deployment, external message, commit, merge or unrelated feature.

## Shared decision record

Keep a brief in the ticket's existing shared ledger, or a dedicated file under
`docs/agents/council-decisions/` for a cross-ticket or explicit workflow request. Link it from
status.md. Record decisions and evidence summaries, not private internal reasoning transcripts.
Use an identifier such as `COUNCIL-20260928-01` and immutable revisions (`v1`, `v2`, ...), each tied
to named files/diff and evidence. Preserve old votes; do not relabel them as approval of a new text.

```markdown
# Council decision: <ticket or explicit request> — <short title>

Revision: <unique version; identify the diff/files/evidence snapshot>
State: Investigating | Team consensus | Chair review | Ratified | Pending evidence/dispute
Outcome and exclusions:
Participants: Chair; Deputy; required Team roles, agent IDs, actual models/efforts
File ownership and primary ticket owner:
Recommendation and alternatives:
Evidence: commands/results/source links; unrun checks; material risks
Strongest counterargument and response:

## Preliminary votes — <revision>

| Participant                | Vote           | Evidence/rationale |
| -------------------------- | -------------- | ------------------ |
| Deputy                     | Needs evidence | ...                |
| <each required specialist> | Needs evidence | ...                |

## Chair review and responses

Chair findings/refinement:
Deputy/Team responses:
What changed and why (including any change in the Chair's position):

## Final votes — <revision>

| Participant                | Vote           | Evidence/rationale |
| -------------------------- | -------------- | ------------------ |
| Chair                      | Needs evidence | ...                |
| Deputy                     | Needs evidence | ...                |
| <each required specialist> | Needs evidence | ...                |

Decision, remaining gates and next owner:
```

When continuing in Claude, preserve the same Council roles, evidence and unanimity requirements
using TEAM.md's authorized provider profile. Record the actual model rather than pretending the
GPT assignment ran. A handover preserves pending objections and invalidates no restrictions.
