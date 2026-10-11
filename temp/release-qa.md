# Sackerl release QA carryover

Updated: 2026-10-11. All checks below are **pending**. The owner accepts the current manual
iPhone follow-up and explicitly defers VoiceOver and large text to release testing.
This is not a tested pass or permission to ship without the applicable release gates.

| Check                   | Simple test                                                                                                                                                | Expected result                                                                                                                         | Status                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| VoiceOver               | Enable VoiceOver; move through receipt review and its editor; activate expiry choices and Close. Inspect stock Edit and Settings too.                      | Clear spoken names/selection, usable focus, reachable fields and errors, focus contained in editor and useful after Close.              | Owner-deferred to release      |
| Large text              | Increase iPhone accessibility text size; reopen review and stock editor; scroll and open keyboard. Restore original settings.                              | Readable text, no overlapping/clipped controls, reachable date fields, Close and Back.                                                  | Owner-deferred to release      |
| Dirty swipe warning     | Clean review: edge-swipe to Home. Reopen, make a local unsaved name edit, repeat the same swipe, then Keep editing. Discard only the test draft afterward. | Leave warning appears; Keep editing retains draft; explicit discard returns Home. Yellow label alone does not prove this warning.       | Warning still unverified       |
| Failed read/save        | Use the reviewed isolated QA transport to reject one request before sending; retry/reload deliberately.                                                    | Useful error, retained edits, unchanged server data before successful recovery.                                                         | Engineering validation pending |
| Committed response loss | Save once, independently confirm commit, drop its response, then reload latest.                                                                            | Uncertain-result message, retained draft, authoritative reconciliation and no duplicate rows/stock.                                     | Engineering validation pending |
| Pending navigation      | Hold a real save response; attempt navigation; release it once.                                                                                            | Departure guarded while app awaits result; exactly one saved result.                                                                    | Engineering validation pending |
| Account events          | Use the real on-device Auth singleton on isolated synthetic accounts; change account/refresh while draft or response is pending.                           | Correct actor scope; previous-account draft/late response cannot restore stale state; same-account refresh preserves appropriate edits. | Engineering validation pending |
| Development build       | Install and test an actual development build with recorded source/build identity.                                                                          | Applicable journeys pass outside Expo Go.                                                                                               | Engineering validation pending |

Use the [phone checklist](iphone-qa.md) for detailed manual steps. Record device/build identity,
the action, actual result and evidence for each case. Preserve existing drafts/settings and use
isolated synthetic fixtures for network/account tests. Finish the pending Council tooling review
before fault execution; perform independent QA before changing ticket acceptance.

SCKRL-304/406/312 remain Review; scoped SCKRL-908 remains In Progress. These checks do not
implement receipt placement or close the wider Stage 1 program.
