# Hand-traced `restate_intent` (button-danger.json, chip-dual-red.json)

Originally hand-traced with no live API call, to keep the focus on the
checkpoint's *shape and failure modes* rather than API mechanics before
`tools/restate_intent.js` was wired for real. This trace was written to be
the copy-pasteable starting point for that prompt, and is what the real
implementation is based on (see `tools/restate_intent.js`).

---

## What this call is and isn't

It is: a small, cheap, non-creative paraphrase of `intent` + `resolvedTokens`
+ `patterns` (the retrieval loop's raw output), in the vocabulary those three
already established — proving the facts were read correctly before
generation spends any effort on them.

It is not: a new source of ground truth. `tools/critic.js` never receives
this output (see its header comment) — re-deriving from the *original*
`resolvedTokens` is what actually prevents a drifted restatement from being
"confirmed" against itself. See ADR 0011.

Two required checks, not one:
- **No invented terms** — every prop/token name in the restatement must
  actually appear in `intent`/`resolvedTokens`/`patterns`.
- **No silent omission** — every key present in `resolvedTokens` and every
  prop in `intent.variant` must be referenced somewhere in the restatement.
  Getting the first check right while quietly dropping a value is still a
  failure — the generator would build off incomplete information without
  anything catching it.

---

## Case 1 — `button-danger.json`, clean

**Input** (from `run_retrieval_loop(buttonDangerFixture, 'react')`):
```json
{
  "intent": { "component": "Button", "variant": { "state": "danger", "size": "md" } },
  "resolvedTokens": {
    "color/red/600": { "value": "#C0392B", "found": true },
    "radius/sm": { "value": "4px", "found": true }
  },
  "patterns": [{ "filename": "Button.stories.tsx", "propsUsed": ["state", "size", "children"] }]
}
```

**Correct restatement:**
> "Build a Button with `state: danger`, `size: md`. Fill uses `color/red/600`
> (`#C0392B`), corner radius uses `radius/sm` (`4px`). Props follow
> `Button.stories.tsx`'s convention: `state`, `size`, `children`."

Every prop name and token ref traces back to the input with nothing added,
nothing dropped. This is what the generator should receive as its primary
input.

**Failing restatement (omission, not hallucination):**
> "Build a red Button, size md, using the existing pattern."

Uses only real vocabulary — no invented terms — but silently drops the
specific token refs (`color/red/600`, `radius/sm`) in favor of a vague
"red." Passes a hallucination-only check; fails the completeness check —
the reason restatement requires both checks, not one (ADR 0011).

---

## Case 2 — `chip-dual-red.json`, ambiguity (ask rather than guess)

**Input:**
```json
{
  "intent": { "component": "Chip", "variant": { "state": "alert", "size": "sm" } },
  "resolvedTokens": {
    "color/red/600": { "value": "#C0392B", "found": true },
    "color/red/700": { "value": "#A93226", "found": true }
  }
}
```
Two visually-close reds, used for two different style slots (`fill` vs.
`border` — see `fixtures/README.md`).

**Correct restatement — keeps them attributed separately:**
> "Build a Chip with `state: alert`, `size: sm`. Fill uses `color/red/600`
> (`#C0392B`); border uses `color/red/700` (`#A93226`) — these are two
> distinct tokens, not one color reused."

**Failing restatement — collapses into one vague mention:**
> "Build a red Chip, alert state, size sm."

This is the same omission failure as Case 1, but sharper: it's not just
dropping a detail, it's actively merging two distinct facts into one,
because natural-language paraphrase makes "two shades of red" easy to
flatten into "red." A correct implementation, when it can't confidently keep
two close values distinct, should surface a clarifying question rather than
guess which slot gets which value — same principle as framework routing's
ambiguity handling (ADR 0009), applied one level earlier to the model's own
reading of retrieved facts (ADR 0011).

---

## Why this stays out of the critic's reach

If `critic.js` ever took `restatedIntent` as ground truth instead of a fresh
`resolvedTokens` re-derivation, the Case 1 omission failure above would
"pass" — the critic would compare generated output against the same vague
restatement that already lost the information, and find no discrepancy.
That's the self-review rationalization failure the generator/critic split
(decision 7) exists to prevent, recreated one layer up. This is why
`critic.js`'s `critique()` function has no `restatedIntent` parameter at
all — verified in this session by running the critic against a loop that
now includes the (stubbed) `restate_intent` step and confirming byte-for-byte
identical output to before the step existed.
