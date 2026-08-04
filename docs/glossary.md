# Glossary

Terms used across the architecture docs and ADRs that aren't obvious from
context alone.

**Fixture** — A mocked test input file (shaped like a real Figma node
response) with a known-correct expected outcome, used to test tools/gate/
critic against something other than live data. See `fixtures/README.md`.

**Token / token ref** — A named design value (e.g. `color/red/600` →
`#C0392B`) stored in `tokens.json` and referenced by its string key rather
than hardcoded, so generated code stays traceable back to the design system.

**Ground truth** — The original, tool-derived facts (raw output of
`read_tokens` / `read_figma_node` / `read_component_patterns` run against
the actual fixture), as distinct from anything the model has since
paraphrased or restated. Only ground truth is the final authority for
correctness checks — a paraphrase of it is not a substitute, no matter how
accurate it looks.

**Restatement / `restate_intent`** — The model paraphrases the build target
back in the tools' own vocabulary before generation runs, to prove it
understood what it retrieved. A comprehension check, not a new source of
truth — see [ADR 0011](adr/0011-restatement-is-a-checkpoint.md).

**Critic** — A separate model call that re-derives ground truth
independently and judges the *generated* output, explaining *why* in
natural language. Not authoritative on its own — see [ADR 0006](adr/0006-generator-critic-split.md).

**Gate** — The deterministic, code-based check (AST/regex/schema — no model
involved) that is the actual pass/fail authority before anything lands.
The critic explains; the gate decides — see [ADR 0007](adr/0007-deterministic-gate-is-authority.md).

**Draft PR** — Every generated change lands as a draft pull request, never
auto-merged, regardless of gate/critic result — see [ADR 0008](adr/0008-never-auto-merge.md).

**Step cap** — A hard limit on how many tool/model calls a single pipeline
run is allowed to make, to prevent a runaway loop.

**SSE (Server-Sent Events)** — One-way streaming from server to client,
used to show a live trace of pipeline steps in the terminal (CLI) or the
Storybook panel, rather than waiting silently for a final result.
