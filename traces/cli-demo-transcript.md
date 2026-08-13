# Real CLI transcript — `node loom.ts generate`

Not hand-traced like the other files in this directory — literal terminal
output, copy-pasted from a real run of `node loom.ts generate` against
this repo as it stands, on the default (no `--live`, no `--open-pr`) path.
Safe to reproduce yourself; see ADR 0013 for why the default path makes
no network call at all.

## Clean fixture — gate passes, dry run

```
$ node loom.ts generate button --variant=danger --framework=react

> Framework resolved: react (source: explicit)
> Reading tokens... color/red/600 → #C0392B, radius/sm → 4px
> Reading existing patterns... found Button.stories.tsx
> Restating intent... (stubbed — see tools/restate_intent.ts)
> Generating component... (using pre-built, already gate/critic-tested output — pass --live for a real model call)
> Running critic... ✅ passed, 0 violations
> Running gate... ✅ passed, 0 violations
> Gate passed. Not opening a PR — pass --open-pr to actually land this. (dry run)

Summary: button (danger) — gate passed
$ echo $?
0
```

## Broken fixture — gate catches it, nothing lands

```
$ node loom.ts generate badge --variant=broken --framework=react

> Framework resolved: react (source: explicit)
> Reading tokens... color/red/999 → NOT FOUND, radius/sm → 4px
> Reading existing patterns... found (none)
> Restating intent... (stubbed — see tools/restate_intent.ts)
> Generating component... (using pre-built, already gate/critic-tested output — pass --live for a real model call)
> Running critic... ✅ passed, 0 violations
> Running gate... ❌ failed, 1 violations
> Gate failed — stopping here. Generated code is still available locally; no PR will be opened.
>   - invented-reference: referenced token color/red/999 does not exist in tokens.json

Summary: badge (broken) — gate FAILED
$ echo $?
1
```

The second run is the same deliberately-broken fixture the mechanical
critic/gate checks are built to catch (`fixtures/badge-broken.json` →
`generated/Badge.broken.tsx`, an invented token reference) — included here
specifically because a demo that only ever shows success proves nothing
about whether the checks actually check anything.
