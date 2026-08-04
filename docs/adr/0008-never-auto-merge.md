# 0008 — Never auto-merge

**Status:** Accepted

## Context
Once generation, critique, and a deterministic gate all pass, it's
technically possible to merge automatically. A deterministic gate proves
convention compliance, not correctness of design intent — a component can
pass every rule and still not be what was actually asked for, which a
gate structurally cannot evaluate.

## Decision
Every generated change lands as a draft pull request, unconditionally,
regardless of gate or critic result. There is no code path that merges
without a human decision. The publish step re-runs the gate again at
merge time, redundantly, as protection against drift between what CI saw
and what's actually being merged.

## Consequences
- A generated component is never live without a human having reviewed and
  approved it — including in framework/branch configurations added later.
- `draft: true` is hardcoded at the point PRs are opened, not exposed as a
  parameter anything upstream could flip.
