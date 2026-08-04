# 0010 — Registry choice is driven by consumer, not tooling novelty

**Status:** Accepted

## Context
Approved components need to reach two different consumers: developers
(who want a normal package import) and designers (who want to browse
visually with no setup). Several registry tools exist (Bit, a plain npm
package, a Storybook static build), each optimized for a different one of
those consumers.

## Decision
Publish to both a real npm package and a Storybook static build together
at merge time, rather than picking one tool as "the" registry. The
decision is framed around who the primary consumer is for each artifact,
not which tool is newest or most architecturally elegant.

## Consequences
- Two publish targets instead of one, but neither consumer is
  underserved.
- The gate (0007) re-runs as a hard precondition at publish time — a
  version bump and publish never happens on unvalidated output, even if
  it was validated once already in CI.
