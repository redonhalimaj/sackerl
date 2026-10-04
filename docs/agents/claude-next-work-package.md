# Superseded work package: Codex to Claude

Prepared: 2026-09-28. Superseded: 2026-09-29 at the owner's request.

**Inactive historical package.** Continue from [the GPT/Codex handover](codex-next-work-package.md)
and `status.md`. The owner no longer requests a Claude handover or alternating providers.
The original assignment, ownership language and prompt below are preserved as history only;
do not execute them. No Claude implementation resulted from this package.

The owner requested alternating bounded work between Codex and Claude. This is the next package;
`claude-work-package.md` retains the historical SCKRL-406 assignment and must not be mistaken for
the new active task. Use the latest Current work checkpoint in `status.md` before this file.

## Proposed next issue

**SCKRL-308 — private receipt media storage**, Stage 1, primary role Infrastructure with Backend
support and independent QA. This Ready ticket can progress independently of receipt placement;
it supplies the media contract needed by SCKRL-307 acquisition and SCKRL-309 processing.

The outgoing Council accepts this as the next bounded package after SCKRL-304 source review.
This is not acceptance of a SCKRL-308 design: convene Infrastructure/Backend/QA and ratify that
implementation contract first. If the checkpoint identifies a blocking source defect in the current work,
address that bounded defect first rather than hiding it behind a new ticket.

## Owner QA update — 2026-09-29

Read [the latest simulator findings](../product/simulator-findings-2026-09-29.md) alongside the
original phone-feedback triage. Notification/warning requests remain backlog, not delivered work.
Password recovery, Home header overlap and zero-dinner shopping copy are recorded for bounded triage;
the proposed development-only review preview has not been approved or implemented. Do not silently
expand this SCKRL-308 assignment or treat screenshots of the fallback as full SCKRL-304 acceptance.

## Read and recover

Read `AGENTS.md`, `CLAUDE.md`, `TEAM.md`, `status.md`, the Council workflow, the Codex/Claude handoff
workflow, `PROGRAM.md` Stage 1, SCKRL-308 in `features.md`, ADR-0001's Receipt Media, Authorization
and Retention decisions, and the SCKRL-310/SCKRL-406 contracts. Inspect staged, unstaged and
untracked changes: existing work is uncommitted, and some inherited changes are staged. Preserve
that index, the owner's Obsidian layouts, simulator work and all accepted receipt/expiry changes.

Claim only the files needed for SCKRL-308 and record your actual provider/model and specialist
ownership. Use TEAM.md's Claude profile, not invented GPT delegates. The Council still requires
independent findings, a versioned unanimous recommendation, Chair review and explicit final votes.
No reviewer may approve implementation they authored as independent QA.

## Bounded deliverable

1. Publish `docs/features/sckrl-308-private-receipt-media.md` before dependent code, including typed
   upload/finalize/read/deletion behavior, failure/retry semantics, identity and authorization.
   Reuse ADR-0001's accepted Supabase Storage choice; document any refinement before implementing it.
2. Implement the local private-media foundation: private `receipt-media` bucket/policy definition,
   household/receipt-scoped references, bounded server-authorized upload and read operations,
   finalization verification, and durable media metadata/state. Write a new forward migration if
   needed; never rewrite accepted or pending migrations from another ticket.
3. Validate allowed image/PDF types and size using server-observed content; client MIME/filename
   alone is insufficient. Preserve bucket/path as the durable reference, not signed URLs. Keep
   privileged credentials server-side and out of logs, examples and chat.
4. Provide idempotent cleanup/deletion behavior and a documented invocation contract. Follow the
   ADR defaults: media expires 30 days after placement, or 30 days after capture for abandoned/
   failed receipts; requested deletion is earlier. Preserve structured review history as defined
   by the accepted contracts. Do not invent placement timestamps for unplaced receipts.
5. Add deterministic client/server tests and authorization/storage-policy fixtures: member vs
   outsider, mismatched household/receipt/path, malformed or oversized content, expired read/upload
   access, duplicate finalization, failed upload and retry, missing/deleted objects, and repeat cleanup.
6. Publish the contract SCKRL-307 and SCKRL-309 will consume. Do not implement those tickets or wire
   real media into mobile as part of this package. Preserve the existing explicit simulated flow.

## Limits and acceptance

Do not apply migrations, replay them into a database, configure hosted buckets, deploy, commit or
merge. Do not start SCKRL-305/307/309/311/407/408, notifications, AI/OCR providers or unrelated UI.
Do not infer the owner's hosted migration state. SCKRL-310 and SCKRL-406 remain unapplied by Codex;
their actual hosted application by the owner is unverified. No real household media is test data.

Complete all permitted local implementation, focused tests, typecheck/lint, code-map updates and
independent source review. Broaden checks when shared client/server changes justify it. Record exact
commands and results. Storage-provider, RLS and migration execution remain unrun under these limits;
fixtures or mocks alone cannot prove those gates. Leave SCKRL-308 in Review/QA while required
evidence is missing, and state the exact next validation step. Do not mark it Done just to hand back.

## Required return to Codex

Before stopping, Claude must:

- Stop delegated writers and name the files whose ownership is released.
- Update `status.md`, this package's execution ledger, the contract and relevant Obsidian flow notes.
  Refresh generated maps with `pnpm code:map` and verify `pnpm code:map:check` after source changes.
- Record actual diff, accepted decisions/votes, tests, unresolved risks, unapplied migrations,
  environment state and the first concrete Codex resume action. Preserve prior accepted evidence.
- Create `docs/agents/codex-next-work-package.md` with a bounded return assignment. Codex first
  validates Claude's actual implementation and resolves its findings; only then select an eligible
  next program issue through the Council. Do not automatically claim the next ticket's prerequisites.
- Include a ready-to-paste Codex prompt and explicitly instruct Codex to prepare the next Claude
  handover in the same manner. Switching is manual; neither assistant launches the other.

## Execution ledger

- Ownership released on 2026-09-28: root has finished application/integration/documentation edits;
  Deputy completed and released its ledger, QA completed its independent report, and the earlier
  Frontend writer remains stopped. No delegated writer is active. Claude may now claim the bounded
  SCKRL-308 file set; it has not started yet. This release covers the SCKRL-304 route/helper/tests,
  Scan/layout integration, status, feature/code-map notes and outgoing handover/decision docs.
- SCKRL-304 is Review. Route/helper/Scan integration and tests are source accepted by independent
  QA and Chair; Council v3 records ownership and acceptance in
  [COUNCIL-20260928-02](council-decisions/COUNCIL-20260928-02.md).
- Actual participants: Deputy `gpt-5.5` xhigh, initial Frontend `gpt-5.6-luna` high (stopped at
  usage limit after partial route/helper), root completion (specific runtime model/effort not exposed),
  independent QA `gpt-5.5` high. QA did not implement the accepted code.
- Evidence: 44 mobile tests/7 files; independent QA reran 24 focused tests/3 files and typecheck;
  mobile lint/typecheck, source formatting and diff checks pass. iOS export passes, 1,286 modules.
  Map: 645 callables, 1,164 relationships, 81 modules, zero stale files.
- Outstanding SCKRL-304 gates: connected review reads/saves and conflicts against migrated auth/
  PostgREST, native visual/accessibility/keyboard/touch review. SCKRL-406 retains its prior runtime
  gates. No new migration/replay/hosted configuration occurred. See
  [QA report](../qa/sckrl-304-review.md), not only passing mocks.
- Source to preserve: `apps/mobile/app/receipt-review/[id].tsx`, `apps/mobile/lib/receipt-review.ts`,
  review fixtures/tests, Scan entry test, Scan/layout integration, feature boundary and code-map
  notes. All new files remain untracked; inherited staged work remains staged. Nothing was committed.
- First Claude action: read checkpoint and inspect the real diff, claim only SCKRL-308 files,
  then form its Council and publish the media contract before dependent implementation.
- SCKRL-308 owner/model, claimed files, decisions, checks and return boundary: Claude records on takeover.

## Claude resume prompt

Ownership is released; paste this into Claude:

> Continue Sackerl from status.md and docs/agents/claude-next-work-package.md. Codex has stopped
> writing. Read AGENTS.md, CLAUDE.md, TEAM.md and the Council/handoff workflows, then inspect the
> actual staged and unstaged tree. Preserve accepted SCKRL-304/310/406 work and outstanding QA gates.
> Use the Council with the Claude provider profile to complete the bounded SCKRL-308 local
> foundation in this package. Do not apply/replay migrations, configure hosted storage, deploy,
> commit, merge or start excluded tickets. Keep evidence and ownership current. Before stopping,
> update status.md and the code map, obtain independent review, release all writers, and create
> docs/agents/codex-next-work-package.md with exact remaining work and a Codex resume prompt.
> Instruct Codex to repeat the same hand-back process so we continue alternating safely.
