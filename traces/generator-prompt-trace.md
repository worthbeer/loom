# Hand-traced generator prompt (button-danger.json)

Originally hand-traced with no live API call, built entirely from the
retrieval loop's real trace output for `button-danger.json` plus
hand-reasoning about correct vs. drifted output. Written to be
copy-pasteable as the real prompt once generation was wired — see
`tools/generate_component.ts`, which is based on this trace.

The user message below sends `restatedIntent` (see
`traces/restate-intent-trace.md`) in place of raw `intent` +
`resolvedTokens` passed separately — the generator's primary input is a
paraphrase already checked for invented/omitted terms, not the raw tool
output directly. `pattern` is deliberately **not** folded into the
restatement and still passes through unchanged: restatement is scoped to
prop/token vocabulary, not to a pattern file's structural conventions
(CSF3 shape, `Meta`/`StoryObj` usage) — folding those through a paraphrase
risked losing exactly the style fidelity the pattern source exists to
enforce.

---

## System / instructions
**The only place prose belongs.** Everything factual lives in the user message
below as raw data, not described here.

```
You are generating a single React component + Storybook story for an existing
design system. You will be given:
  - restatedIntent: a checked paraphrase of the requested component, variant,
    content, and exact token refs/values to use — already verified to contain
    no invented and no dropped terms relative to the original tool output
  - pattern: one existing .stories.tsx file showing the prop-naming convention
    for this component type, passed through unfiltered

Hard constraints:
  - Use only the token refs/values named in restatedIntent. Do not introduce
    colors, radii, or spacing not present there, and do not write literal
    hex/px values in the output even if they happen to match a resolved value —
    reference the token, don't restate it.
  - Match the prop names shown in pattern exactly (e.g. if pattern uses `state`
    and `size`, do not invent `variant` or `color` for the same concept).
  - Output two files only: <Component>.tsx and <Component>.stories.tsx,
    following pattern's story structure (CSF3, args-based).
```

## User message — restated intent (checked, not raw) + pattern (verbatim, unfiltered)

```json
{
  "restatedIntent": "Build a Button with state: danger, size: md. Fill uses color/red/600 (#C0392B), corner radius uses radius/sm (4px). Content: \"Delete\". Props follow Button.stories.tsx's convention: state, size, children.",
  "pattern": {
    "filename": "Button.stories.tsx",
    "source": "// MOCKED — representative stand-in written for this exercise, not pulled from\n// a real design system. Shape (CSF3, prop naming) is meant to be plausible,\n// not authoritative. See ADR 0004 on the mock/real boundary.\n\nimport type { Meta, StoryObj } from '@storybook/react';\nimport { Button } from './Button';\n\nconst meta: Meta<typeof Button> = {\n  title: 'Components/Button',\n  component: Button,\n};\nexport default meta;\n\ntype Story = StoryObj<typeof Button>;\n\nexport const Default: Story = {\n  args: { state: 'default', size: 'md', children: 'Button' },\n};\n\nexport const Danger: Story = {\n  args: { state: 'danger', size: 'md', children: 'Delete' },\n};\n\nexport const Sizes: Story = {\n  args: { state: 'default', size: 'sm', children: 'Button' },\n};\n"
  }
}
```

Request: generate `Button.tsx` and `Button.stories.tsx` for this intent.

---

## Hand-reasoned correct output

- Props named `state` and `size` — taken from `pattern`, not invented.
- `#C0392B` is **referenced**, not restated — e.g. a `buttonStyles({ state, size })`
  helper keyed off the token map, not `style={{ background: '#C0392B' }}` inline.
  This is the subtle part: getting the *value* right isn't sufficient. Writing
  the correct hex literally in the JSX is still a violation, because the
  mechanism (reference vs. restated literal) is what the gate actually
  checks for — a generation can be value-correct and still mechanism-wrong.
- Story file mirrors `pattern`'s CSF3 shape (`Meta`/`StoryObj`, `args`-based),
  not a different story format the model might otherwise default to.

## Hand-reasoned drifted output (what should get flagged later)

- `variant="danger"` instead of `state="danger"` — plausible-looking prop
  rename that still "works" but breaks the library's actual contract.
- `background: '#C0392B'` hardcoded directly in a style object — right color,
  wrong mechanism.
- An invented prop not present in `pattern` (e.g. `danger={true}` as a boolean
  flag instead of the `state` enum) — the model reaching for a "more idiomatic"
  React pattern than the one this library actually uses.

## Why this is not sufficient on its own

A single well-prompted generation call, even with hard constraints and
grounded facts, is not a correctness guarantee — the model can still drift
on the mechanism (literal vs. reference) even when every individual fact it
was given was correct. That's the actual justification for the critic
(ADR 0006) existing as an **independent second call**, re-running
`read_tokens`/`read_component_patterns` fresh against the generated code's
actual content rather than trusting this prompt's own claim of what it used.
Self-review inside this same context would just be the model re-reading its
own drifted output and rationalizing it — same model, same blind spot, no new
information entering the check.
