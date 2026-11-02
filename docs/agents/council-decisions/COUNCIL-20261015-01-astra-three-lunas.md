# Council decision: Astra Deputy and three Luna workers

Date: 2026-10-15. Revision: v1 (frozen policy snapshot; votes recorded separately).
State: Ratified.

## Owner request and scope

The owner requests an Astra Deputy and model router, three issue-dependent delivery streams,
unanimous decisions, fast handling of small questions and deeper Chair/Deputy involvement for
complex work. The final clarification is: **"so update the council to astra and three lunas"**.
This supersedes the earlier Terra proposal and fallback discussion.

Update the operating policy and its current summaries and role briefs. Preserve product scope,
ticket acceptance, historical decisions, permission boundaries and independent QA. The owner's
separate request to continue the roadmap is tracked in status.md and requires its own scoped
decision before high-risk implementation.

## Participants and ownership

| Participant                 | Actual route                                             | Ownership                                                                                                      |
| --------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Chair `/root`               | GPT-6-based root; exact model variant/effort not exposed | Integration, status.md and this record                                                                         |
| Deputy `/root/astra_deputy` | `gpt-6-astra`, `xhigh`                                   | Independent policy review, routing and next-item investigation; no edits                                       |
| Luna A `/root/luna_a`       | `gpt-6-luna`, `high`                                     | TEAM.md, Council workflow, Deputy and Chair briefs                                                             |
| Luna B `/root/luna_b`       | `gpt-6-luna`, `high`                                     | AGENTS.md, CLAUDE.md, PROGRAM.md operating summary, agent index and specialist briefs, active handover routing |
| Luna C `/root/workflow_qa`  | `gpt-6-luna`, `high`                                     | Independent documentation QA; no implementation edits                                                          |

The two authors have disjoint files. The policy update itself follows the existing full Council
cycle, with all participants declared before votes. Agents work in waves within four active slots.

## Recommendation v1

1. The root assistant remains Chair. One distinct `gpt-6-astra` Deputy routes work and reasoning
   effort across exactly three `gpt-6-luna` worker seats A/B/C.
2. Assign product, Frontend, Backend, Infrastructure, DevOps and QA responsibilities among those
   seats according to the issue. They are functional roles, not extra agents. No Terra or separate
   junior worker belongs to the new roster.
3. Use only the needed workers. Fast, bounded, reversible low-risk decisions use one short brief
   and unanimous owner/reviewer votes under explicit delegated authority, followed by lightweight
   Chair integration review. Straight source retrieval and already-ratified execution need no new
   decision. Governance and mandatory escalation topics cannot take the fast path.
4. Standard work distinguishes local stream consensus, shared-contract approval and final
   integrated acceptance. Complex work requires deeper Chair/Astra involvement, responsible domain
   review and separate QA at design and acceptance, with the full reciprocal Council cycle.
5. Required participants are declared before findings/votes. Every required individual explicitly
   supports the exact revision; no majority, proxy, silent assent or removal of dissenters. Material
   changes or membership changes require a new revision and votes. Retain bounded reconciliation.
6. Reserve one of the three Lunas for independent QA when implementing. Actual authorship determines
   independence. A worker holding several domain roles has one vote. Mechanical support is a task
   mode within the three seats and has no extra vote or acceptance authority.
7. Match effort to task risk: Astra high for routing/standard work, xhigh for complex work; Luna low
   for routine work, high for bounded delivery/QA, xhigh for complex domain/review work. Record actual
   routes; changing documentation does not switch an existing session's model or effort.
8. With four slots, Chair plus Astra leaves two concurrent Lunas; the third works in a later wave.
   Waiting alone never establishes that a slot is available. Preserve one writer per file set,
   explicit dependencies, source evidence and per-stream QA.
9. Consensus cannot waive acceptance checks, program gates, ADR requirements, migration/deployment
   permissions or user scope. Historical models and votes remain historical evidence.

Alternatives: retain fixed specialist agents; launch three permanent multi-agent teams; retain
Terra with a fallback. The final owner request selects the smaller Astra/three-Luna roster.

Strongest counterargument: flexible participation and fewer specialist agents could weaken review
or reduce the electorate until approval becomes easy. Require objective risk exclusions, declared
voters, individual votes, independent QA, evidence appropriate to each domain and deeper Chair/Astra
review for complex issues. An effort setting alone is not acceptance evidence.

## Evidence

- Canonical policy sources: TEAM.md and docs/agents/council-workflow.md.
- Official identifiers verified from [Astra documentation](https://developers.openai.com/api/docs/models/gpt-6-astra)
  and [Luna documentation](https://developers.openai.com/api/docs/models/gpt-6-luna).
- The current agent launcher supports both selected models. No substitute model is needed.
- Fresh `pnpm exec prettier --check` passed for all 16 policy files.
- Fresh local Markdown link/anchor validation passed for all 108 local links in those files.
- `git diff --check` passed. Application tests do not apply to this policy-only change.
- Independent final diff review and votes follow against the frozen snapshot below.
- The decision/status ledger records subsequent votes and roadmap progress separately; those
  bookkeeping updates do not change the frozen policy recommendation or files.

## Preliminary votes — v1

| Participant             | Vote    | Evidence/rationale                                                                                                         |
| ----------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| Deputy                  | Support | Actual policy/diff reviewed; all 16 hashes and aggregate independently verified; no changes requested                      |
| Luna A                  | Support | Author recommendation vote; all 16 hashes and aggregate verified; independent QA remains separate                          |
| Luna B                  | Support | Author recommendation vote; all 16 hashes and aggregate verified; mirrors align                                            |
| Luna C / independent QA | Support | Actual final diff reviewed; 16 hashes match; 198 local links/anchors valid across policy and ledgers; no blocking findings |

## Chair review and responses

The Chair independently verified the frozen 16-file manifest and reviewed the actual diff and
independent QA findings. The revision implements the latest owner instruction and resolves the
Deputy's lane-authority, independence and capacity challenges. A broken legacy junior anchor and
inconsistent fast-lane wording were corrected before freezing v1.

The strongest remaining risk is under-classifying a short but consequential task or treating three
workers as three independent domain experts without evidence. Risk exclusions, predeclared voters,
actual authorship-based QA independence, domain checks and deeper Chair/Astra review address this.
The Chair accepts v1 without material changes; the exact policy snapshot remains unchanged.
Astra and each Luna must now respond and cast a fresh final vote on v1. No broader product or
SCKRL-311 acceptance follows from this policy decision.

## Final votes — v1

| Participant             | Vote    | Evidence/rationale                                                                                   |
| ----------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| Chair                   | Support | Verified unchanged v1; independent QA passed; accepts risk response and exact owner-directed policy  |
| Deputy                  | Support | Fresh 16-file/aggregate verification; accepts Chair response; no changes requested                   |
| Luna A                  | Support | Fresh 16-file/aggregate verification and Chair-response review; author vote only                     |
| Luna B                  | Support | Fresh 16-file/aggregate verification and Chair-response review; author vote only                     |
| Luna C / independent QA | Support | Independent actual final diff review and fresh unchanged 16-file/aggregate verification; no blockers |

Decision: **v1 unanimously ratified** by Chair, Astra Deputy and all three Lunas. The new
workflow is accepted locally; no application behavior, ticket Done decision, hosted migration,
commit, push, merge or deployment follows from this policy acceptance. The Chair owns the next
SCKRL-311 readiness/design brief under a separate Council decision.

## Frozen policy snapshot — v1

Aggregate SHA-256 of compact JSON entries sorted by path (keys sorted, separators comma/colon):
`07d5020ed6214814214dfc0cb437f8ab2aaeef9ae41aa33536ea2c66e85f2a77`.

| File                                    | SHA-256                                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| AGENTS.md                               | `68c2646ca67957d94c91c15241da3203078334a8fba69d941992c566ca4ec54d` |
| CLAUDE.md                               | `3fcb6547c218306c64eda6f41c21d5067f871891c757a4c5597fdc1defe75d74` |
| PROGRAM.md                              | `b261d67fc2842c28ad06456ad826663ab90c8ca70b1f7b22766adc2cc7eada2c` |
| TEAM.md                                 | `57f60b74b0f619434fb49597a57dd943909a65c57d2bba961d1c70113283cb26` |
| docs/agents/README.md                   | `64304a66494264b41c689127f549bc76daaf3ae1012ceaaad724e8a64167e42f` |
| docs/agents/backend.md                  | `840f8f3e680bb5a31114b900a042b806405907c314de85c3af051afe7586ee55` |
| docs/agents/business-process-analyst.md | `4ed6134b283a4f6e940b5d38c854594f00bd3dc5dc614411e5819d13e9ad1359` |
| docs/agents/codex-next-work-package.md  | `9699b170d8e8743fb83e3305c0b9c3e5cbc067b406e05733943d3b871c31dcd9` |
| docs/agents/council-workflow.md         | `9af9472939468af371fed971eadf4f8fe48d0ad470a362249f45ce9a3789d1b5` |
| docs/agents/deputy.md                   | `a93db029896f61a47f2f19fa6ef42d89d1e12f2d5a5c2e10070328b6cfcea23a` |
| docs/agents/devops.md                   | `72915b5d8a5fee640f825409c3367c46a44da16b6df180c02a094502b664d87e` |
| docs/agents/frontend.md                 | `59b0afae371195b08df021df97214db4b09731b43d8390674e0bff46fac411ea` |
| docs/agents/infrastructure.md           | `ff66e695fcf418f3a9ed2ef9f26cf00d9f3d35773bd66721aa436df25e2467e2` |
| docs/agents/junior.md                   | `832d05b97ed632fa44b42ae9d776bd2a9cd6f384158700034719304d40a809d5` |
| docs/agents/orchestrator.md             | `a78b39c06b9e70be7c9cfa49ff5587a0fcd08c4eef980670c014080cd3dde789` |
| docs/agents/qa.md                       | `f97584b45b4dca71b5fbe6b5a4939bd482df158cb6cfc829fa96c67ddb345226` |
