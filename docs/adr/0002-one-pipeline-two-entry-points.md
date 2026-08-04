# 0002 — One pipeline, two entry points

**Status:** Accepted

## Context
Loom needs to serve two different users: developers, who want a CLI they
can script and pipe; and designers, who want a visual surface inside
Storybook. Building each as its own implementation risks the two drifting
apart — a fix or rule change applied to one silently not applying to the
other.

## Decision
A single `generate()` function is the pipeline. The CLI (`loom generate`)
and the Storybook addon panel ("Ask Loom") are both thin wrappers around
it — an SSE bridge server exposes the same function to the browser-based
panel that the CLI calls directly.

## Consequences
- A fix or rule change applies to both surfaces automatically; there is no
  second implementation to keep in sync.
- The trace/streaming interface (`onTrace`, `resolveAmbiguity`) has to be
  injectable, since the CLI and the browser panel need different concrete
  behavior for the same abstract steps (print to terminal vs. stream over
  SSE; prompt on stdin vs. end the stream and surface a question).
