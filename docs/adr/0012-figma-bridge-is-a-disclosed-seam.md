# 0012 — figma-bridge is a disclosed seam, not a live integration

**Status:** Accepted

## Context
`figma-bridge/` explores what a live connection to Figma's remote MCP
server (metadata, code, screenshot, and "Code to Canvas" clone) would look
like against loom's own component data. Building the real connection is
real infrastructure work orthogonal to what this repo demonstrates — the
same reasoning ADR 0004 already applied to the main pipeline's Figma
input — and the free tier caps usage at 20 tool calls/month, too tight a
budget to spend on a repo that other people will run and re-run.

Separately, `figma-bridge/`'s two `.tsx` files (`ReviewCard.tsx`,
`stories/FigmaBridge.stories.tsx`) use JSX. loom's stated identity is zero
third-party runtime dependencies and no build step — TypeScript runs
directly via Node's native type stripping, which erases type annotations
but does not transform JSX.

## Decision
`figma-bridge/` defines the real contract (`FigmaBridgeClient` in
`src/types.ts`, shaped against Figma's actual MCP tool output) and ships
two implementations: `MockFigmaBridgeClient` (active, fixture-backed) and
`RemoteFigmaBridgeClient` (a stub that rejects every call with an explicit
"not yet wired" error — never silently returns fabricated data).
`cloneUrlToCanvas`, the Code-to-Canvas clone, is defined on the contract
but has no live demo. Both gaps are stated here and in
`figma-bridge/README.md`, not left for someone to discover by reading
source.

On the JSX question: the four pure-`.ts` files (`types.ts`, `mockData.ts`,
`client.ts`, `index.ts`) use the same CommonJS convention as the rest of
`tools/` (`require`/`module.exports`, `import type` only for erased type
imports) and run directly via `node`, unchanged from how the rest of the
pipeline runs. The two `.tsx` files are real, type-checked TypeScript
(`@types/react` is a devDependency, used only by `tsc --noEmit`, same as
`typescript` and `@types/node` already are) — but are never executed by
anything in this repo, the same status `generated/*.tsx` already has here
(checked as text by the gate/critic, never rendered). The story file's
`Meta`/`StoryObj` types come from a small local shim
(`stories/storybook-types.ts`) shaped like `@storybook/react`'s public
types, rather than installing the real package — the same "shaped like
the real thing, boundary disclosed" move ADR 0004 makes for the Figma
payload itself.

## Consequences
- No live Figma OAuth/MCP dependency, and no risk of a CI run or a
  curious clone burning the free tier's monthly call budget.
- `npm run typecheck` and `npm test` cover `figma-bridge/` the same as
  everything else in the repo; `tests/figma-bridge.test.ts` asserts the
  mock adapter's fixture shapes and that the remote stub rejects (rather
  than throws synchronously) for all four contract methods.
- No new runtime dependencies — `@types/react` is dev-only.
- If Phase 2 (a real `RemoteFigmaBridgeClient`) is ever built, no calling
  code changes — swapping the adapter behind `createFigmaBridgeClient()`
  is the whole point of the contract.
