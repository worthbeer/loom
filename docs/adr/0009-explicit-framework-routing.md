# 0009 — Framework/brand routing is explicit; ambiguity halts and asks

**Status:** Accepted

## Context
In a real dual-framework (React/Angular), multi-brand production system,
which convention set applies to a given request is not always inferable
with confidence. Guessing wrong routes generation against the wrong prop
contracts and file conventions entirely, silently.

## Decision
Framework routing follows a strict priority order — explicit request flag,
then payload hint, then ambiguous — and ambiguous means the pipeline stops
and asks rather than defaulting to any framework. The same discipline
applies one level earlier, to the model's own reading of retrieved facts:
restatement (0011) surfaces a clarifying question rather than guessing
when it can't confidently attribute a value.

## Consequences
- No silent default framework; an unresolved request is a stop condition,
  not a best-effort guess.
- `read_component_patterns` and the prop-contract schema are looked up
  per-framework and never mixed, even when both exist for the same
  component type.
