# 0007 — The deterministic gate is the pass/fail authority

**Status:** Accepted

## Context
The critic (0006) can explain, in natural language, why a generation does
or doesn't look right. That explanation is useful for a PR comment, but a
model's own assessment of its own domain isn't a sufficient authority to
decide whether something ships — "the model says it's fine" doesn't hold
up as an enforcement mechanism.

## Decision
A separate, deterministic gate (AST/regex/schema checks — `tools/gate.ts`)
is the actual pass/fail authority. It runs independently of any model call,
checks the same categories of rule the critic explains (no hardcoded
values, no invented token references, required props present, canonical
prop names), and is what CI and the publish step both key off of.

## Consequences
- Two independent mechanisms check overlapping rules — deliberate
  redundancy, not duplication. If the critic says "passed" but the gate
  fails (or vice versa), that disagreement itself is a signal worth
  investigating.
- The gate is strictly less expressive than the critic: it can say "this
  is/isn't allowed" but can't say "you should have used X instead,"
  because it has no context about which specific request was being
  fulfilled — only the full universe of valid tokens/props.
- Verified to be framework-agnostic without modification: the same rules,
  written against generic TypeScript declaration shapes rather than
  JSX-specific syntax, correctly catch violations in both React and
  Angular output.
