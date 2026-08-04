# 0003 — Storybook is the render substrate, not replaced

**Status:** Accepted

## Context
Storybook does two separable jobs: rendering/isolating components (a
solved problem, expensive to rebuild), and browsing/documenting them (a
job an agent that can answer "show me the Button variants" directly
starts to make redundant). It would be possible to build a fully custom
render surface instead.

## Decision
Storybook stays as the rendering and preview infrastructure. Loom's addon
panel lives inside it rather than replacing it — Storybook's role shifts
from "the product" to the render substrate Loom's output is verified
against.

## Consequences
- No custom renderer/preview infrastructure to build or maintain.
- The addon panel is bound by Storybook's own architecture — notably, an
  addon's manager UI (where the panel lives) and its preview iframe are
  separate bundles with separate capabilities (see 0002 and the addon's
  own implementation notes on why the panel calls `updateStoryArgs()`
  rather than rendering a component directly).
