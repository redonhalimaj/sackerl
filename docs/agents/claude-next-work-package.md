# Claude testing handover — SCKRL-311 and open receipt QA

Updated: 2026-11-01. The owner explicitly requests: **“Ill do the testing using claude so add that
to handover and push the changes”.** The owner will perform the remaining testing using Claude.
Claude is the next testing assistant after Codex's publication closeout. Before taking ownership,
check the [status checkpoint](../../status.md) for verified push completion and explicit writer
release. This package alone is not evidence that either action has completed.
Opening this document does not launch Claude or establish a test pass.

## Ownership and checkout

Use `feature/SCKRL-311-astra-luna`. The reviewed development baseline is `7547916`; publication
commits are identified in status/Git history. The old manifest `head` is the review baseline,
not a command to check out that old commit. Inspect the actual branch, HEAD, staged/unstaged and
untracked changes, and confirm outgoing writers have stopped before taking ownership.

The owner and Claude own **remaining test execution and findings**, rather than automatically
returning those tests to Codex. Use the selected Claude runtime and record its actual identity
when exposed, following `TEAM.md`'s Claude profile. Preserve independent QA and Council acceptance.
If testing leads to implementation fixes, a separate reviewer must validate those fixes before Done;
the test assignment does not automatically assign a new implementation feature.

Codex's publication follows the owner's explicit push instruction. This testing package does not
authorize a later merge, deployment, provider change or hosted migration. Keep real credentials in
ignored local configuration and never copy them into test reports or chat.

## Accepted baseline and current behavior

The Council unanimously accepted the bounded local **source-v4** backend/evidence after fresh
preliminary/final votes and reciprocal Chair review. See the
[Council record](council-decisions/COUNCIL-20261019-01-placement-source.md),
[accepted baseline manifest](../qa/sckrl-311-source-v4-manifest.json),
[source QA](../qa/sckrl-311-source-review.md) and [database QA](../qa/sckrl-311-database-review.md).
SCKRL-311 remains **Review**; source acceptance is not full product or hosted acceptance.

The owner's later testing/publication instruction updates these handover documents. Validate the
current tree using the [publication manifest](../qa/sckrl-311-handover-publication-manifest.json);
the accepted v4 handover hashes are historical and intentionally differ from this testing revision.
Earlier v1/v2/v3 manifests remain unratified history. The implementation and SQL are unchanged.

SCKRL-311 provides atomic placement, canonical status/recovery, authoritative unplaced discovery,
protected receipt-line lineage, expiry conversion and immutable acquisition/results. Endpoints are
`GET/POST /receipts/:id/placement` and `GET /receipts/pending-placement`; shared methods are
`finalizeReceiptPlacement`, `getReceiptPlacement` and `listUnplacedReceiptReviews`.
The contract is [placement v1](council-decisions/COUNCIL-20261015-02-placement.md).

Home still uses legacy saved-review discovery. Saving a review creates no stock; Continue to
placement remains disabled. SCKRL-305 placement UI is Blocked. No hosted installation is claimed.
The October 23 development probe reported its expected connection and absent placement objects
at that time. Its raw temporary artifacts have expired; it is not current target/schema evidence.
Fresh target verification and the full baseline are required before a hosted execution proposal.

## Existing evidence to preserve

The November 1 disposable PostgreSQL 14.20 replay passed all 95 subprocess steps and 32 input
hashes. Nine concurrency scenarios include the bounded opposing-order/placement-before-delete
proof. The SDK-to-route regression maps malformed HTTP-200 success to 502 with `outcomeUnknown`.
The unchanged app record is October 22: 18 cached Turbo tasks, 372 recorded tests, fresh 58
receipt-client/12 route tests and a successful web build. These are dated evidence, not fresh
connected/native results. Do not repeat completed checks solely because the assistant changed.

Selected raw evidence is local and Git-ignored:
`.env.qa-sckrl311-evidence-20261101/run-zu04vnsp`.
Verify `archive.json`, its 98 file hashes, raw `results.json`, all 95 step logs and current input
hashes. Original `/private/tmp` paths in raw JSON are execution coordinates; use matching archived
log basenames after those temporary files expire. No application credentials or PostgreSQL data
directory is archived. The failed sandbox attempt is separate and is not a SQL pass.

**The raw archive is not pushed to Git.** It remains available in this shared workspace. If testing
from another clone/machine, transfer this synthetic evidence separately or record its absence;
do not claim the raw logs were inspected from Git alone.

## Remaining testing, in order

1. Verify the published checkout, current publication manifest, accepted v4 implementation and
   retained archive. Record actual commands, source revision and environment before new tests.
2. Reconcile the [development/connected plan](../qa/sckrl-311-development-migration-plan.md).
   Prepare the full read-only target/schema baseline comparison, bounded migration executor and
   connected fixture harness. These are still incomplete. Obtain a reviewed target-bound execution
   packet and separate owner authorization before any hosted write; do not run all migrations.
3. Once installation is authorized and verified, exercise real Auth/PostgREST/shared-client owner,
   member and outsider cases using isolated synthetic fixtures. Verify exact same-key replay,
   changed-input conflict, alternate-key `already_placed` canonical result, household key reuse,
   foreign-resource denial, pending exclusion and placed review/parse freeze.
4. Exercise approved uncertain-outcome cases: lost/malformed responses, timeout, canonical status,
   same command/key retry and no duplicate stock/events. An unplaced status alone does not prove
   rollback. Missing schema/RPC is an explicit recoverable error, never a silent legacy fallback.
5. Continue the still-open SCKRL-304/406/312/908 navigation, account-change, offline/pending-save,
   device and accessibility matrix from status and linked QA reports. Preserve accepted ordinary
   simulator evidence and the owner's release deferrals. Placement drag/tap tests wait for actual
   SCKRL-305 implementation and its prerequisites; a disabled placement CTA is expected today.
6. Verify exact fixture cleanup and report unresolved failures. Keep Review/QA until applicable
   acceptance is complete; a push, passing CI or this handover does not mark the full ticket Done.

No new camera/OCR/media, notification, AI or later-program feature starts from this testing
assignment. Future implementation follows each ticket's dependencies and `PROGRAM.md` gates.

## Report back to the owner

For each check, record expected/actual behavior, source/installed schema, commands and results,
cache or mocked/live scope, screenshots/logs where useful, isolated fixture IDs and cleanup outcome.
Report failures with severity and reproduction steps; distinguish failed, blocked, deferred and
unrun cases. Update status and the relevant QA record without overwriting accepted historical
evidence. If fixes are needed, name their scope and reviewer. Release test/fix file ownership when
handing back. Codex review can be requested separately; it is not the assigned executor for these
remaining tests.

## Resume prompt for Claude

> Take over Sackerl testing from status.md and docs/agents/claude-next-work-package.md. The owner
> will do the remaining testing using Claude. Confirm Codex's outgoing writers have stopped,
> inspect the actual published checkout and publication manifest, and verify available local
> evidence. Preserve accepted source-v4 and its remaining gates. Start with the read-only target
> and schema prerequisite check; prepare missing execution artifacts before requesting any hosted
> write. Do not start a new feature, enable blocked placement UI or infer a current hosted state
> from the historical October probe. Run only authorized tests with isolated fixtures, report
> results and cleanup to the owner, keep ticket states honest, and preserve independent review
> for any implementation fixes. Record your actual Claude runtime and release ownership when done.
