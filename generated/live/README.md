# Real, live-generated output — not a hand-crafted fixture

`Button.tsx` and `Button.stories.tsx` here came from an actual Anthropic API
call (`node tools/generate_component.ts`, run against `button-danger.json`),
not written by hand like everything else in `generated/`. Regenerated after
ADR 0014 wired the semantic critic in for real — this run exercises all
three checks (mechanical critic, semantic critic, gate) against the same
live output, not just the two that existed before.

**Result: all three checks correctly failed it, each catching a different
thing.** This run's model reached for `styled-components` and a `theme`
object rather than the CSS-var approach an earlier run used — genuinely
unpredictable, not steered toward any particular failure mode:

- **Gate** (`tools/gate.ts`, the deterministic authority): 7
  `no-hardcoded-value` violations — `#ffffff`, and the `sm`/`md` padding
  and font-size values, none of them referencing a token.
- **Mechanical critic** (`critique()`): the same 7 values, independently
  re-derived from `resolvedTokens` rather than the full `tokens.json` —
  agrees with the gate without sharing its data source.
- **Semantic critic** (`critiqueSemantic()`, live-gated, ADR 0014):
  `matches_intent: false` — and it caught something the other two
  structurally can't. The generated code references `theme.colors.red600`
  and `theme.radii.sm` (an external theme object) rather than the actual
  resolved values (`#C0392B`, `4px`) or a token reference string — so it
  never trips the gate/mechanical-critic's literal-value regexes at all,
  but a human (or a model asked to judge intent) can see immediately that
  nothing here is verifiably tied to `resolvedTokens`. The three checks
  are not redundant: the gate/mechanical critic catch "did you restate a
  literal," and the semantic critic caught "did you use *these* tokens" —
  a genuinely different question, and the actual argument for why the
  three-layer design (ADR 0006, 0007, 0014) is more than one check wearing
  three names.

Also real and worth keeping honest: the semantic critic's own output isn't
always parseable JSON on the first try — an earlier attempt in this same
session threw (`critiqueSemantic: model did not return valid JSON`)
instead of guessing at a result, which is the correct failure mode, not a
bug to paper over.

Left as-is, failing, on purpose — this is the actual proof that the
gate/critic split works against genuinely unpredictable model output, not
just the deliberately-planted violations in the rest of `generated/`.
