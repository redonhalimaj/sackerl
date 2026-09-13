---
tags: [code-map, maintenance]
---

# Maintenance

[[Sackerl Code Map]] · [[Method Index]] · [[Testing and Delivery]]

The flow notes are the readable explanation. Generated module notes are an index of source
relationships. Keeping these separate makes changes easier to review: a method rename can refresh
the index automatically, while a changed business rule needs a sentence explaining it.

## After changing code

Run from the repository root:

```sh
pnpm code:map
pnpm code:map:check
```

The generator reads the checked-out TypeScript source and SQL migrations. It does not start the
app, contact Supabase, read `.env` files or use an AI provider. It uses the existing TypeScript
dependency and requires the repository's normal Node/pnpm installation.

`code:map` replaces `Method Index.md` and generator-owned `generated/Methods - *.md` files, removing
obsolete generated module notes after source files are removed/renamed. It preserves the human
flow notes. `code:map:check` changes no files and exits nonzero if the generated index is stale.
These are local commands; they have not been added to hosted CI.

Then update the relevant flow note when a change affects:

- The order of actions, a screen entry point, a method's responsibility or a storage boundary.
- Validation, approval, authorization, failure/retry behavior or database transaction guarantees.
- Whether a previously simulated or missing feature is now implemented and actually validated.

Review `git diff -- docs/code-map scripts/update-code-map.mjs` alongside the code diff. When source
line numbers change, regenerate. Do not edit generated method entries by hand.

## What the index does and does not prove

[update-code-map.mjs](../../scripts/update-code-map.mjs) uses the TypeScript compiler to resolve
calls, constructors, JSX components, JSX handlers and named function arguments (such as
`items.map(mapRow)`). Argument references show where a function is passed, not a guarantee that
it is called. Literal receipt RPC names link to SQL functions; schema-qualified function references
inside SQL bodies link to their definitions. The latest
checked-in definition is used for a SQL function replaced by later migrations.

Named functions, class/object methods, assigned arrow functions and named React hook wrappers are
included. Anonymous callbacks are attributed to their nearest named owner. This describes a
dependency, not synchronous execution order or how often it runs.

There are deliberate limits:

- Router-discovered entry points, event dispatch, computed method names, reflected calls and
  arbitrary function values can have no detected caller.
- JSX references identify rendering/handler relationships, not the moment React executes them.
- HTTP requests, PostgREST table names, policies and trigger firing are explained in the flow notes;
  they are not fully reconstructed by the method index.
- Native/web variants are both indexed; the compiler's default resolution is not a Metro platform
  resolver. Use [[Shared UI]] for platform behavior.
- Third-party library internals, tests, data objects, types and build output are omitted. A method
  with no internal calls may still contact a remote service through `fetch`.
- The graph does not establish security, atomicity, test coverage, deployment status or dead code.

## A useful request for future AI changes

> Explain the user-visible effect and the methods you changed. Update the relevant `docs/code-map`
> flow note if behavior or a boundary changed, run `pnpm code:map`, and verify
> `pnpm code:map:check`. Keep implementation status honest and mention any affected callers or
> missing runtime evidence.

Keep the explanation focused on what changed and why. Avoid manually documenting every private
helper's implementation: the source and generated relationship index already provide that detail.
