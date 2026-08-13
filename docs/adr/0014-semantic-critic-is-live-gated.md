# 0014 — Semantic critic is real, gated behind --live

**Status:** Accepted

## Context
ADR 0006 recorded that the critic's mechanical checks (hardcoded/invented
values) turned out not to need a model call, and that the only genuinely
model-shaped part — semantic intent-matching (`matches_intent`) — was left
out "for this rung," stubbed as `null`. That was the right call at the
time, but `ARCHITECTURE.md`'s pipeline diagram described the critic as
"an independent model call" without that qualification, which oversold
what actually ran on the default path to anyone who stopped at the
diagram rather than reading the README's more careful "not yet wired"
disclosure three levels down.

## Decision
`tools/critic.ts` gains `critiqueSemantic()`: a real Anthropic call, live-
gated exactly like `restate_intent`/`generate_component` (`live` default
`false` → `null`, no network call, no behavior change on the default
path). It re-derives its judgment from `intent`/`resolvedTokens`/
`patterns` — the same ground truth `critique()` already uses — and, like
`critique()`, has no parameter for `restatedIntent` at all, so ADR 0011
(the critic must never read the restatement as ground truth) stays
structurally enforced rather than just conventionally followed. This
supersedes ADR 0006's stubbed status for the semantic half specifically;
0006 itself is left as-is, an accurate record of why mechanical-only was
the right scope at that point.

## Consequences
- `ARCHITECTURE.md` and `README.md` now describe what actually runs by
  default (mechanical only) versus what `--live` adds (semantic
  judgment too), instead of the pipeline diagram overselling the default
  path.
- One more real Anthropic call under `--live`, at the same tier as
  generation (`claude-sonnet-5` — a judgment call, not the cheap
  paraphrase-check tier restatement uses).
- No `ANTHROPIC_API_KEY` was available to exercise the live branch at the
  time this was written — it's implemented and code-complete, following
  the same self-test pattern `tools/generate_component.ts` already uses,
  but not yet run for real. Whoever runs it first should keep the result
  (pass or an interesting failure) as evidence, the same way
  `generated/live/` already keeps a real generation failure rather than
  discarding it.
