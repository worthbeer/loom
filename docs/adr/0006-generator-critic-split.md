# 0006 — Generator and critic are separate, independent calls

**Status:** Accepted

## Context
A single model call could plausibly be asked to generate a component and
then check its own output in the same continuous context. Self-review in
one context tends to rationalize its own output rather than catch it —
the model has no new information forcing it to reconsider what it already
committed to.

## Decision
The critic is a separate call that re-derives ground truth independently:
it re-runs the same retrieval queries (`read_tokens`, `read_component_patterns`)
against the *generated* output, not against the original request, and
never against the generator's own narration of what it did.

## Consequences
- Two calls instead of one, for anything using a live model.
- The critic's mechanical checks (hardcoded/invented values) turned out
  not to need a model at all — they're regex/pattern checks. The only
  part that's genuinely model-shaped is semantic intent-matching, which
  is why the critic and the deterministic gate are separate components
  (see 0007) rather than the critic being folded into the gate.
