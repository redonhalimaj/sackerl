# Next session handover — GPT / Codex

Updated: 2026-10-11. Start with the current checkout/merged baseline and remaining QA sections
in [status.md](../../status.md). Earlier source/runtime decisions remain in their immutable Council
and QA reports; this handover supersedes the old draft-publication instructions.

## Latest checkpoint — 2026-10-11

Owner manual-iPhone QA follow-up is closed: clean swipe returned Home, the edit step showed a
light-yellow check label, and Keep/edit/discard was reported working. The yellow label does not
prove the dirty-swipe warning; that case still needs confirmation. VoiceOver and large text are
accepted for now and deferred to [release QA](../../temp/release-qa.md), not executed passes.
Results are in [temp/iphone-qa.md](../../temp/iphone-qa.md) and the
[QA record](../qa/sckrl-remaining-native-gates-review.md).

Owner authorized commit/push of the documentation closeout on dev. No open GitHub issues were
listed; no remote issue closure or ticket Done is inferred. Offline/interrupted-save, pending
navigation, account-event and standalone-build tests remain unrun. The prepared fault-tooling
[Council recommendation](council-decisions/COUNCIL-20261004-remaining-native-qa.md) remains
unratified; recheck temporary artifacts, finish exact votes and prove actual bundle identity
before execution. Temporary QA devices are cleaned; preserve the original simulator/session.

## Current workspace

- Checkout is **dev**, fast-forwarded from origin to **5ec3a7b6e6b8f629e3b21d524b8e1c909181fc37**.
- [PR #4](https://github.com/redonhalimaj/sackerl/pull/4) is **merged into dev**, at
  2026-10-04 17:41:05 UTC. The merge already existed remotely when Codex pulled it.
- Source/QA commit **6a04f82** and publication checkpoint **8324922** are included.
  [CI](https://github.com/redonhalimaj/sackerl/actions/runs/37221312505) passed on PR head 8324922;
  this is not a new CI run on the merge commit.
- Documentation closeout on dev is authorized for commit/push by the owner on 2026-10-11.
  Verify git/remote publication state before planning another branch.
- No deployment or merge into main was performed. Source integration is separate from acceptance:
  SCKRL-304/406/312 remain Review; scoped SCKRL-908 remains In Progress; Stage 1 remains incomplete.
- Continue with Codex and the Council. No Claude handover or mandatory alternation is requested.
  TEAM.md routing still applies; preferred unavailable models must never be silently claimed.
  Previous explicit fallbacks were Deputy/Infrastructure gpt-6.1-sol xhigh, QA gpt-6.1-sol high;
  root runtime model/effort was not exposed. Record actual routes for any new delegation.

## Delivered and verified

Receipt review supports correction/manual rows, guarded saves, explicit unknown/dated/no-date
expiry, clean saved Done for now and paginated authenticated same-receipt Home resume. Stock
expiry Add/Edit/history and owner/member calendar settings are included, as are recipe expiry
eligibility and the clearly labelled development sample. **Receipt review creates no stock.**
Continue to placement remains disabled until SCKRL-311 and SCKRL-305 are implemented. The owner's
screenshots showing Review saved / Items are not in stock yet are expected under this boundary.

The 22-file accepted source snapshot remains unchanged. Source QA, 49-step 312 disposable SQL,
bounded development migration/preservation, 406 SQL/concurrency and 22-stage connected QA pass.
Bounded native evidence supports correction/save/date validation, dirty Back/Keep editing,
clean Done, saved Home resume after cold Expo Go restart, metadata-only Edit preserving expiry,
same-date user confirmation, member clear with retained history, estimated Add remaining
unconfirmed and owner/member calendar Settings. Both authenticated native runs and connected
fixtures are cleaned up; only their new QA simulators were removed. Preserve the original device
534D9647-8E3B-4EFE-A3F6-CF45A0905324 and its account/session/data.

The earlier expired final-readback gap remains recorded; the fresh supplementary run supplies its
own passing evidence. All 18 local integration tasks reused matching Turbo cache (314 recorded
tests); format/map pass at 671 callables, 1,231 relationships, 83 modules, zero stale artifacts.
PR-head GitHub CI separately passed install/format/lint/typecheck/test.

Fresh direct suites passed mobile 85/web 57 tests without Turbo reuse. The real Next bearer-auth
HTTP layer passed 34 bounded checks. A new native run passed receipt date validation, dirty header
Back/Keep editing/discard and stale-save conflict recovery with explicit reload warning. Final
ordinary readback confirmed the member revision and unchanged stock/parser/expiry facts. Both new
fixtures were cleaned exactly; the isolated Next server stopped and the new QA device was removed.

Read the [live HTTP report](../qa/sckrl-304-312-next-http-review.md),
[native follow-up](../qa/sckrl-304-312-native-followup-review.md),
[native report](../qa/sckrl-304-406-312-native-review.md),
[connected report](../qa/sckrl-304-406-312-connected-review.md),
[406 database review](../qa/sckrl-406-database-review.md),
[312 source review](../qa/sckrl-312-review.md),
[312 database review](../qa/sckrl-312-database-review.md) and
[312 development installation](../qa/sckrl-312-development-migration-plan.md).
Frozen Council/source/ADR/SQL README checkpoints describe their historical prohibitions/evidence;
only later explicit authorization and results supersede them. Do not edit their accepted hashes.

## Remaining acceptance checks

“QA gates” means checks still requiring evidence, not a finding that the merge failed:

1. Dirty edge-swipe warning, unsaved draft account changes and in-flight navigation guards.
   Owner reports clean swipe-back and Keep/edit/discard working; yellow label alone is not a
   dirty-warning result.
2. Native offline/lost-response/uncertain saves and safe retry without duplicate writes.
   Stale-revision conflict/draft retention/explicit reload passed in the new native run.
3. Full VoiceOver, dynamic text, focus/keyboard/modal checks and development-build or physical-device
   behavior. VoiceOver/large text are owner-deferred to release; AX and Expo Go remain bounded evidence. Computer Use coordinate
   drag failed with noWindowsAvailable through app name and resolved bundle ID; no simulator
   gesture pass is claimed. The owner reports clean iPhone swipe-back; dirty-warning confirmation
   remains pending.
4. Bounded real Next HTTP gate passed (34 checks); do not reopen it without a new finding/change.
   Broader cross-household/browser/cookie/all-route coverage is not claimed. No middleware.ts exists;
   getRequestAuthContext is the current authentication boundary.
5. Independent final QA and unanimous Council acceptance before Review becomes Done.

New verification/fixes should use a separate bounded branch from current dev. Preserve the original
simulator; use isolated run-marked fixtures, actual target/hash/lease checks and exact finally cleanup.
Do not recreate the merged PR. The owner authorized and requested the bounded QA above; deferred features are not started.

## Owner feedback and next product candidates

[feedback.md](../../feedback.md) retains the original September wording plus October additions:
profile/account page and icon; `Hello, <account name>`; EN/DE receipt brand/category recognition
(Colgate/Kinder); buying sessions/list progress; alternative product-photo recognition; personalized
receipt/photo/manual routes; private friend recipe collections like Spotify playlists; mutually
verified family household invitations/code with proposed geolocation validation.

These remain later-branch discovery, unanimously supported as documentation only. Profile/greeting
IDs105/207 are proposals, not accepted new contracts. Refine missing-name handling, canonical
product/locale aliases and non-food boundaries, picked/bought/stored reconciliation, image confidence
and privacy, private sharing ownership/revoke/license rules, and invitations versus account 2FA.
Location purpose/consent/remote-family alternatives remain unresolved; it is not membership proof.
Older expiry warnings/reminders, personal recipes, optional evidence, swipe polish and optional
nutrition ideas remain in their existing triage/backlog. No new feature implementation was approved.

After applicable prerequisites and Council contract/ADR review, next receipt-to-stock candidate:
**SCKRL-311 atomic placement (Backend)**, then **SCKRL-305 placement UI (Frontend)**. Implement
transactional stock/expiry/events/lineage, idempotent recovery and placed immutability before enabling
placement; support drag and tap. A separate real acquisition lane is **308 private media → 307
acquisition → 309 durable provider OCR**, following each ticket's dependencies. Product-photo
recognition extends beyond409's existing-item evidence; shopping sessions extend beyond511's list.
Stage2 normalization, Stage3 buying intelligence and Stage4+ recipes/sharing keep their program gates.
These are proposed future priorities, not instructions to start all work on this documentation turn.

## Access and recovery

Development DATABASE_URL is in ignored .env; secrets must never be printed or committed. Only the
reviewed312 migration was applied; no new batch migration/history repair, prod or deployment action
is authorized here. Owner permission to use generated synthetic QA logins against development
persists; do not ask again for the same scope. Temporary evidence may expire, so check presence and
review scripts/hashes before reuse. Completed fixture accounts/login files cannot be reused.

Suggested next-session prompt:

> Read status.md and this Codex handover, inspect the dev checkout and preserve local handoff edits.
> Use the Council to prepare one scoped follow-up branch and continue the remaining receipt/expiry
> QA checks. Keep integrated code separate from Done acceptance; do not recreate merged PR #4 or
> implement deferred profile/recognition/shopping/sharing/placement/media features without their
> accepted ticket and prerequisite review. Update status/evidence and leave a recoverable checkpoint.
