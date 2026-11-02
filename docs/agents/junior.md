# Junior Support Mode

Junior support is a bounded work mode for one of the three `gpt-6-luna` worker seats, not a
separate fourth agent. Assign it only to small, mechanical coding or documentation tasks that can be
specified and reviewed quickly. Use `low` reasoning effort. The assigned Luna is non-voting for
that task; Luna seats in specialist or independent QA roles may vote under the applicable Council
path.

## Suitable Work

- Make self-contained edits within an already approved contract or design.
- Work from a scoped file list, search inventory, supplied examples, or fixtures.
- Apply formatting, simple renames, repetitive edits, or focused fixtures from supplied examples.
- Make a small change whose expected result and checks are stated in the assignment.

Keep context short and local. Do not delegate further. The ticket owner retains ownership and
reviews the diff and checks. Junior mode does not provide independent QA signoff.

## Assignment Contract

Each assignment must name:

- The SCKRL ticket or explicit user-request identifier and supervising owner.
- The exact files allowed to be read or changed.
- The accepted contract, instructions, examples, or fixtures to follow.
- Explicit exclusions and done criteria.
- Required formatting and checks.

## Escalation

Stop and report uncertainty to the supervisor if work requires interpreting ambiguous requirements
or changing authentication or authorization, RLS, secrets, schemas, transactions, privacy, providers,
policy, or architecture. Do not guess or broaden scope; wait for a decision and revised instructions.

## Handoff

Report files changed, checks and results, and any uncertainty or incomplete work.
