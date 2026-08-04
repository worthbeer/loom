# 0001 — Agentic library, not attached

**Status:** Accepted

## Context
A conventional component library is passive: a developer imports a
component and reads documentation to learn its conventions (tokens, prop
contracts, accessibility rules). Those conventions live only in docs or
lint rules a human has to already know, and nothing stops them from
drifting out of sync with the actual components over time.

## Decision
Loom is addressable: it can generate, explain, and validate components
against its own conventions on request, from inside the surface a
developer or designer is already using (a CLI, a Storybook panel) —
rather than requiring a human to already know the rules before using the
library correctly.

## Consequences
- The conventions (tokens, prop schemas) must be machine-readable ground
  truth, not just prose documentation — see 0007.
- Every generated result needs to be independently checkable, since the
  system is now making claims about correctness, not just providing code
  to copy.
