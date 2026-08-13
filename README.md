# Loom

An agentic, Storybook-style component library. Loom turns a plain-language
description of a component into working React or Angular code. It
generates the component, checks the result two independent ways, then
opens the change as a draft PR for a human to review before anything
lands.

Facts — design tokens, prop conventions — come from tools with
deterministic, testable output, not from a model's memory. The pass/fail
authority before anything ships is a deterministic gate (AST/regex/schema
checks), not a model's own assessment of its work. See
[`ARCHITECTURE.md`](ARCHITECTURE.md) for the full pipeline and
[`docs/adr/`](docs/adr/README.md) for the reasoning behind each of these
choices.

## How it works

```
design intent (Figma-shaped JSON, or plain language via the CLI/panel)
        ↓
retrieval        read_tokens / read_figma_node / read_component_patterns
        ↓
restatement      the model paraphrases what it retrieved before acting on it
        ↓
generation       component + story file for the target framework
        ↓
critic           independent re-check against freshly re-derived ground truth
        ↓
gate             deterministic pass/fail authority
        ↓
landing          draft PR via the GitHub REST API, gate re-runs at publish
```

A CLI (`loom generate`) and a Storybook addon panel ("Ask Loom") are both
thin wrappers around the same underlying pipeline — one implementation,
two entry points.

## Requirements

- Node.js ≥ 23.6.0 (runs the pipeline's TypeScript directly via Node's
  native type stripping — no build step, no ts-node)
- [`gh`](https://cli.github.com/) CLI, authenticated (`gh auth login`), for
  GitHub API access — PR creation, comments, CI status. `GITHUB_TOKEN`
  works as an alternative.
- `ANTHROPIC_API_KEY`, only if generating with `--live` (see below).
- No third-party runtime dependencies — the pipeline runs on Node
  built-ins, including a direct `fetch` to the Anthropic Messages API for
  the two live-model stages, no SDK. `typescript` is a devDependency,
  used only for `tsc --noEmit` type-checking, not for compiling anything.

## Usage

```bash
# Validate a single component against the gate
node validate.ts path/to/Component.tsx
node validate.ts --help                   # full rule reference

# Run the full pipeline as a dry run — retrieval, critic, gate, full trace,
# but no GitHub call (see ADR 0013). Safe to run against this repo as-is.
node loom.ts generate button --variant=danger --framework=react

# Same, but actually land it as a draft PR against the real target repo —
# --open-pr is a deliberate opt-in, not the default
node loom.ts generate button --variant=danger --framework=react --open-pr

# Same, but with real model calls for restatement + generation
# (requires ANTHROPIC_API_KEY)
node loom.ts generate button --variant=danger --framework=react --live --open-pr

# Run the test suite / type-check
npm test
npm run typecheck

# Start the SSE bridge server behind the Storybook panel
node bridge-server.ts
```

## Project layout

- `tokens.json` — the design token store.
- `fixtures/` — Figma-shaped design-intent payloads.
- `patterns/` — real per-framework convention examples the generator and
  gate check against.
- `tools/` — retrieval, restatement, generation, critic, gate, framework
  routing, and GitHub/publish automation.
- `generated/` — fixtures covering every gate rule, alias, and framework
  combination; the regression suite.
- `registry/` — a local scratch package `tools/publish.ts` publishes to.
- `tests/` — the automated test suite (`node:test`).
- `figma-bridge/` — a typed contract + mock adapter for the Figma remote
  MCP server, structurally separate from the main pipeline; see
  [`figma-bridge/README.md`](figma-bridge/README.md) and
  [ADR 0012](docs/adr/0012-figma-bridge-is-a-disclosed-seam.md).
- `ARCHITECTURE.md`, `docs/adr/` — system design and the reasoning behind
  each architectural decision.

## Scope

The Figma payload is mocked, shaped exactly like Figma's real REST API
node response — no live OAuth integration. Retrieval, the deterministic
gate, framework routing, GitHub PR/CI landing, and the publish flow are
real, verified against live CI runs across React and Angular targets.

Three model-call stages — intent restatement, generation, and the
critic's semantic judgment — are real Anthropic API calls, gated behind
an explicit `--live` flag rather than the mere presence of
`ANTHROPIC_API_KEY`, so the default path and the test suite run free and
offline. A live run against a real fixture produced code that correctly
referenced the tokens it was given, but also introduced spacing values
that weren't in the resolved token set — both the critic and the gate
independently caught it. That output is kept at `generated/live/` as a
record of the checks working against unscripted model output, not just
hand-built test cases.

The critic's semantic judgment (`matches_intent` — does the output
actually match what was asked for, not just the mechanical rules, via
`critiqueSemantic()` in `tools/critic.ts`) only runs under `--live`;
`matches_intent` stays `null` on the default path, same as restatement
and generation.

Landing a result as a real PR is a further, separate opt-in
(`--open-pr`, see ADR 0013) — a passing gate alone never opens anything.
