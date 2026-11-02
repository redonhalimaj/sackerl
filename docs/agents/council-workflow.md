# Council workflow

Updated: 2026-10-19. Policy version: 4 (owner-directed responsibility update).

The Council uses the root assistant as **Chair**, a separate `gpt-6-astra` **Deputy**, and exactly
three peer `gpt-6-luna` worker seats. The three workers take issue-specific roles from Business
Process Analyst, Frontend, Backend, Infrastructure, DevOps and QA. They are not six permanent
agents, separate Terra/Sol or GPT-5.5 routes, or a path to nested junior agents. Low-effort
mechanical support is a non-voting task mode within a worker seat.

[TEAM.md](../../TEAM.md) owns model routing. This process does not change a running session's model,
launch agents automatically, or authorize external writes. Record actual model and effort. The root
remains Chair; do not claim a preferred Astra Chair route. The current launcher exposes Astra and
Luna. Use official model references: [GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra), [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna).

Owner direction (2026-10-19): the Chair owns analysis, orchestration, direct Luna instructions and
evidence synthesis. Astra is invoked briefly for model routing and otherwise only during work
reviews, including complex design reviews and final acceptance. It has no standing implementation
coordination role. Reuse ratified decisions and completed evidence; do not reopen routine execution
or rewrite historical votes. The Chair records revision packets and authentic reviewer votes.

## Seats and responsibilities

| Seat                       | Assignment                                                      | Responsibility                                                                     |
| -------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Chair / Agent Orchestrator | Root assistant; record actual model and effort                  | Lead analysis, instruct Lunas, coordinate work, synthesize evidence and integrate. |
| Deputy                     | `gpt-6-astra`; `high`, `xhigh` for complex work                 | Brief model routing and work reviews only; no ongoing implementation coordination. |
| Worker A                   | `gpt-6-luna`; `low` mechanical, `high` default, `xhigh` complex | Assigned role; may investigate, own, implement, vote or independently review.      |
| Worker B                   | `gpt-6-luna`; `low` mechanical, `high` default, `xhigh` complex | Assigned role; may investigate, own, implement, vote or independently review.      |
| Worker C                   | `gpt-6-luna`; `low` mechanical, `high` default, `xhigh` complex | Assigned role; may investigate, own, implement, vote or independently review.      |

## Select the lane and participants

Risk, not prompt length, determines the review lane. Use only the necessary participants. Before
findings are collected, name the voters, issue roles, primary owner, file boundaries, expected
evidence and checks. Run at most three issue streams. For any implementation, one of the three Luna
workers must independently QA the final diff; an author may vote on recommendations but cannot
provide independent QA or sole acceptance of their own changes. No agent counts as two voters by
taking multiple roles.

- **Fast lane:** A Chair may delegate a bounded, reversible, low-risk task to an owner and separate
  reviewer under one brief. Require both workers' Support on the same revision and lightweight Chair
  integration. Root may retrieve a factual source or execute routine work already covered by an
  accepted decision without opening a new decision. Fast lane excludes policy, auth/RLS, secrets,
  privacy, safety, transactions, new contracts and unresolved architecture.
- **Standard lane:** The Chair directs one to three streams, using brief Astra model routing
  when needed. The Chair and affected workers resolve local decisions; Astra joins work reviews. Shared contracts require every affected owner and relevant domain reviewer.
  Final integrated acceptance requires Chair, Deputy, owners and independent QA; each implementation
  stream has its own independent QA evidence.
- **Complex or high-risk lane:** Chair, Astra, the responsible Luna domain owner and independent QA
  participate during design and final acceptance. Collect preliminary unanimity, conduct reciprocal
  Chair challenge, then collect fresh final votes on the revised decision and actual final diff.
  This applies to unresolved architecture, security, privacy, transactions, safety and other
  escalations in TEAM.md.

The four-slot runtime includes the root. With Astra absent, root plus all three Lunas may run
(two implementation owners and independent QA). During Astra review, at most two Lunas may run;
complete a wave before resuming Astra. A waiting or idle agent does not automatically release a slot.
Completed investigations can be reused. Do not spawn nested agents. Full use of all three workers
is not required for small work.

Parallel streams must have independent scopes and non-overlapping ownership. Version shared
cross-stream contracts and record dependencies before dependent work proceeds. A shared-contract
decision requires every affected owner and QA reviewers appropriate to its risk; Support within one
stream does not constitute integrated acceptance of other streams.

## Decision cycle

The cycle below is the default for standard and complex work. Fast lane uses its declared single
brief, owner and reviewer unanimity, then lightweight Chair integration; routine execution already
covered by an accepted decision needs no new vote.

1. **Chair frames scope.** State the SCKRL ticket or explicit request, outcome, exclusions, stage,
   acceptance criteria, lane, participants, owner and resource limits.
2. **Chair coordinates independent work.** Directly instruct the Lunas and gather findings before reconciliation. Each assignment
   states role, model/effort, owner, disjoint files, dependencies, exclusions, deliverables and
   validation. Keep one writer per file set.
3. **Preliminary decision.** Chair publishes one immutable revision with options, recommendation,
   strongest counterargument, evidence, limitations and consequences. Every predeclared voter casts
   an explicit Support, Object or Needs evidence vote on that exact revision. Only unanimity is
   presented as a preliminary recommendation.
4. **Reciprocal Chair review.** Chair checks source evidence and challenges assumptions. Deputy and
   workers respond; the Chair may revise its view. Preserve supported dissent and explain what
   changes. Model rank is not evidence.
5. **Fresh final vote.** Publish a new revision for any material change or new voter. Collect fresh
   explicit votes from Chair, Deputy and all required workers on that exact revision. For
   implementation acceptance, QA inspects the actual final diff and required checks before voting.
6. **Execute and record.** After a decision is ratified, execute only its bounded scope. Record
   evidence and remaining gates in the shared ledger and status.md. Consensus does not itself
   authorize migration, deployment, external communication, commit, merge or other external write.

Documentation-only changes need source, link and consistency review. Done requires the actual final
diff and applicable checks; agreement alone does not complete work.

## Honest unanimity and disagreement

Votes are **Support**, **Object** or **Needs evidence**, with a short rationale and revision ID.
Silence, absence, abstention, conditional approval and proxy votes are not Support. No majority
decision, Chair override or removal of an objector can create unanimity. Keep the voter set fixed for
each revision. A material change or new voter requires a new revision and fresh votes; never rewrite
historical votes as approval of changed text.

Allow at most two reconciliation rounds on the same evidence. If disagreement remains, record the
unresolved positions, evidence, missing fact and smallest experiment or decision needed. Continue
independent work that does not depend on the dispute. Do not force agreement. Reopen voting only on
new evidence, a materially revised proposal or an explicit user decision.

## Shared decision record

Use the ticket ledger or a dedicated file under `docs/agents/council-decisions/` for cross-ticket or
workflow decisions, and link it from status.md. Record evidence summaries, not private reasoning
transcripts. Give each revision an immutable identifier tied to named files, diff and evidence.

```markdown
# Council decision: <ticket or explicit request> — <short title>

Revision: <immutable version; files/diff/evidence snapshot>
State: Investigating | Preliminary unanimity | Chair review | Ratified | Pending evidence/dispute
Lane and scope:
Participants: Chair; Astra Deputy; predeclared Luna voters, actual models/efforts and roles
File ownership and primary owner:
Recommendation, alternatives and strongest counterargument:
Evidence, checks, limitations and material risks:

## Preliminary votes — <revision>

| Participant            | Vote           | Evidence/rationale |
| ---------------------- | -------------- | ------------------ |
| each predeclared voter | Needs evidence | ...                |

## Chair review and responses

Chair findings/refinement:
Deputy and worker responses:
What changed and why:

## Final votes — <revision>

| Participant         | Vote           | Evidence/rationale |
| ------------------- | -------------- | ------------------ |
| each required voter | Needs evidence | ...                |

Decision, remaining gates and next owner:
```

Preserve prior authorized provider/handoff exceptions as history. For a genuine Claude handover,
follow TEAM.md and record the actual model; do not claim that an unavailable GPT route ran. A
handover preserves pending objections, evidence and restrictions.
