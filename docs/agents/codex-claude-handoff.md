# Codex ↔ Claude handoff

This is the shared workflow for continuing Sackerl in either coding assistant. The owner authorized
both directions on 2026-09-13. [TEAM.md](../../TEAM.md) defines roles and provider routing;
[status.md](../../status.md) holds the current checkpoint and ticket states. Keep live progress in
that one file so the assistants do not develop separate versions of the plan.

Switching is manual: stop the outgoing writer, open the same checkout in the other assistant, and
give it the resume prompt below. This document does not install automatic switching, transfer chat
history, detect account limits, or start another application.

## Start or resume

1. Read the **Current takeover checkpoint** at the top of `status.md`, then `AGENTS.md`,
   `CLAUDE.md`, `TEAM.md`, and this workflow. Read the active ticket in `features.md`, its linked
   contract/ADR and the relevant code-map flow note. Consult `PROGRAM.md` for its stage gate.
2. Inspect `git branch --show-current`, `git rev-parse --short HEAD`, `git status --short`,
   `git diff --stat` and `git diff --cached --stat`. Then read the relevant staged and unstaged
   diffs. An unchanged HEAD does not mean an unchanged workspace.
3. Confirm the previous assistant and any delegated writers have stopped before taking ownership
   of their files. A checkpoint is a coordination record, not a filesystem lock. If the user has
   already stopped the old session and requested takeover, do not ask for permission again.
4. Record the incoming assistant, actual model when known, primary role, ticket and owned files
   in the checkpoint. Use the Claude or Codex profile in `TEAM.md`. Do not invent model identity
   or translate reasoning settings between providers.
5. Continue the first incomplete action. If no ticket is active, start the recorded next ticket
   only when the user's current request authorizes development. A documentation-only handoff is
   not an instruction to begin another feature.

Preserve existing staged, unstaged and untracked work. Do not stash, reset, stage, commit, switch
branches or merge merely to make a handoff tidy. Source and current diffs resolve stale notes;
record any discrepancy before making dependent edits. Inspect only relevant files and never copy
secrets into the checkpoint.

## Checkpoint while working

Update the takeover checkpoint after a coherent change, a validation result, a scope/contract
decision, and before expensive work or a likely limit. Do not depend on receiving a final warning
before access ends. A useful checkpoint records:

```markdown
### Current takeover checkpoint

- Updated: <date/time and timezone>
- Writer: <Codex/Claude; actual model or unknown>; <active/released/interrupted>
- Checkout: <branch>; base HEAD <hash>; <staged/unstaged/untracked summary>
- Scope: <latest user request; what is authorized now>
- Active ticket / primary role / state: <SCKRL-XXX; role; actual state, or none>
- Owned files: <paths; distinguish inherited edits>
- Completed: <concrete behavior and links to contracts/QA/code-map notes>
- Incomplete: <exact remaining implementation or review>
- Decisions: <accepted contracts, assumptions and unresolved choices>
- Verification: <command, outcome, date; relevant source revision/diff; cached or fresh if known>
- Environment: <local/live migration status; running processes/jobs and safe resume details>
- Next action: <specific first action, file and expected result>
- Limits: <failed/unrun checks, permission boundary or missing dependency>
```

Keep the checkpoint short; link detailed evidence instead of copying logs. Move superseded notes
under an explicitly historical heading. A quota interruption is not completion: keep the ticket
In Progress, Review or QA as appropriate, and record availability separately. Use Blocked only
when an actual dependency prevents progress, not just because the other assistant must take over.

## Hand over at a limit or stopping point

1. Stop starting new changes. Save the current files and record incomplete edits without claiming
   they build or pass tests. Quiesce delegated writers and record any running jobs; do not leave
   two assistants editing the same files.
2. Update `status.md` using the checkpoint fields above. Include the precise next command/action,
   failed checks and outstanding independent reviews. Keep ticket state honest.
3. Update affected `docs/code-map` flow notes. Run `pnpm code:map` and `pnpm code:map:check` when
   runtime source changed; if time/access prevents this, record regeneration as the next action.
4. Release writer ownership in the checkpoint and tell the user where to resume. A session switch
   does not authorize live migrations, deployment, merges or other external writes.

If the limit cuts a session off before it can save a handoff, stop that session and recover from
the last checkpoint plus actual diffs. Treat changes after its last recorded verification as
unverified. Run focused checks needed to establish their state, then replace the stale checkpoint.
On a different machine, a Git commit alone does not carry uncommitted or ignored files: reconcile
the transferred checkout before continuing and keep credentials in local ignored env files.

## Review across assistants

Either provider can implement or independently review. Preserve accepted decisions and earlier
QA evidence when the reviewed code is unchanged; recheck affected criteria after later edits.
Do not repeat completed audits simply because the assistant changed.

The incoming implementer owns verification of its edits. Independent QA must come from a reviewer
that did not implement those edits, followed by Orchestrator integration review. A new model name
alone is not evidence of review. Record reviewer, scope, commands/results and unresolved findings.
If independent review is unavailable, finish the reviewable work and leave it in Review/QA with
that exact next action. It must not be marked Done on self-review alone.

## Prompts to use in either assistant

**Resume in Claude or Codex:**

> Continue Sackerl development from the Current takeover checkpoint in status.md. The previous writer is
> stopped. Read AGENTS.md, CLAUDE.md, TEAM.md and docs/agents/codex-claude-handoff.md. Inspect the
> actual staged and unstaged work, claim the appropriate provider/role, and continue the recorded
> next action. If no ticket is active, begin the next Ready development ticket named in the
> checkpoint. Preserve existing changes and accepted QA. Keep
> status.md and the code map current, and checkpoint before handing back.

**Prepare to switch:**

> Prepare a handoff to the other assistant. Stop at a safe boundary, finish saving your changes,
> stop delegated writers, and update status.md with ownership, exact remaining work, verification,
> environment state and the first resume action. Release writer ownership. Do not start a new ticket.

The resume prompt authorizes development when you send it; preparing these documents alone does
not. Use its "previous writer is stopped" statement only after stopping that session.
