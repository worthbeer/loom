# figma-bridge

Structural exploration of the Figma MCP server (remote server, Code-to-Canvas),
shaped like a real LOOM Storybook integration, built to work fully offline
while the real integration is added incrementally. See
[ADR 0012](../docs/adr/0012-figma-bridge-is-a-disclosed-seam.md) for the
disclosed boundary this README describes: no Storybook is installed or run
in this repo — the story files are real, type-checked TypeScript, checked
by `npm run typecheck` and `npm test`, but never executed here, the same
status `generated/*.tsx` already has in the main pipeline.

## Why this exists

Figma's remote MCP server is free on all plans; the paid gate only hits
Code Connect (Org/Enterprise) and the desktop server (Dev/Full seat). Rather
than wait on plan access to start the work, Phase 1 defines the real contract
(`FigmaBridgeClient` in `src/types.ts`) and ships a mock adapter that returns
fixtures shaped exactly like live MCP tool output. Every later phase swaps
the adapter, not the calling code.

## Status

- [x] **Phase 1 — Scaffolding.** Typed contract, mock fixtures, mock client,
      three Storybook-shaped stories demoing metadata→component, code
      preview, and a simulated Code-to-Canvas clone — type-checked and
      unit-tested (`tests/figma-bridge.test.ts`), not run through an actual
      Storybook instance. No Figma account required.
- [ ] **Phase 2 — Real connection (free tier).** Wire `RemoteFigmaBridgeClient`
      in `src/client.ts` to the actual remote MCP server. Budget carefully —
      free/Starter tier is 20 tool calls/month; cache one real pulled
      response as a fixture rather than re-calling.
- [ ] **Phase 3 — Live Code-to-Canvas demo.** Point `cloneUrlToCanvas` at a
      real running Storybook URL and capture a before/after screenshot.
- [ ] **Phase 4 — Write-up.** Short case study: what's mocked vs. live and
      why, and what Code Connect (Org/Enterprise) would add given a client
      with that tier.

## Files

| File | Purpose |
|---|---|
| `src/types.ts` | The `FigmaBridgeClient` contract + types matching real MCP tool output (metadata, code, screenshot, clone-to-canvas) |
| `src/mockData.ts` | Fixture data for one component (`ReviewCard`) shaped like a real Figma node/variable/component response |
| `src/client.ts` | `MockFigmaBridgeClient` (active now) and `RemoteFigmaBridgeClient` (Phase 2 stub) — both implement the same interface |
| `src/ReviewCard.tsx` | Component rendered from the mocked design tokens, used across the stories |
| `stories/FigmaBridge.stories.tsx` | Three stories: metadata→component, generated code preview, simulated clone-to-canvas |
| `stories/storybook-types.ts` | Minimal local `Meta`/`StoryObj` type shim, shaped like `@storybook/react`'s public types — avoids a real Storybook dependency |

## Swapping to live (Phase 2 checklist)

1. Implement the four methods on `RemoteFigmaBridgeClient` against the
   Figma remote MCP server.
2. Flip `createFigmaBridgeClient()` in `src/client.ts` behind an env flag
   (e.g. `FIGMA_BRIDGE_MODE=remote`).
3. Confirm all three stories still type-check (and, once a real Storybook
   instance is wired up, still render) — no story code should need to
   change, only the adapter underneath.
