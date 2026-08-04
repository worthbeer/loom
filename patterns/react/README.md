# Patterns — React

Representative `.stories.tsx` stand-ins (see each file's own `MOCKED` header),
serving as few-shot examples for the generator and as the source
`read_component_patterns` matches against. Not pulled from a real design
system — written to be plausible, including plausible drift.

## Button.stories.tsx — canonical convention
Flat args: `state`, `size`, `children`. Customization happens by enumerating
variants (`Default`, `Danger`, `Sizes`), not by adding new props. This is the
convention `traces/generator-prompt-trace.md` and the generated fixtures in
`generated/` are already built against — treat `state`/`size` here as load
bearing, not just an example. `tools/gate.ts`'s `renamedPropCheck()` (rule 4)
enforces `state` as canonical and flags `variant`/`color` as known-wrong
aliases — proven by `generated/Button.renamed-prop.tsx` (`variant`) and
`generated/Button.renamed-color.tsx` (`color`), both failing distinctly
while `Button.clean.tsx` passes.

## Alert.stories.tsx — deliberate inconsistency, on purpose
Uses `status` where Button uses `state` for the equivalent concept, and
customizes via composition (`Alert.Icon`, `Alert.Description`,
`Alert.Action`) instead of flat props. This isn't a mistake to clean up —
real pattern sources accumulate exactly this kind of drift across
components built by different teams/eras, and that inconsistency needs to
stay visible here rather than get silently normalized, since the framework
routing/prop-contract layer (ADR 0009) has to handle ambiguity in the
pattern source itself. Whether `status` counts as "the same convention,
differently named" or an actual violation is decided per-component in
`tools/gate.ts`'s `PROP_SCHEMA`, not by this file.

`renamedPropCheck()` treats this file's own convention as canonical, not
Button's: it requires `status` here and flags `state`/`variant` as the
wrong aliases — the reverse of Button/Chip. Proven by
`generated/Alert.renamed-prop.tsx` (`state`, i.e. "fixing" Alert back to the
majority convention) and `generated/Alert.renamed-variant.tsx` (`variant`),
both failing distinctly, while `generated/Alert.clean.tsx` passes precisely
*because* it uses `status`. That's the actual proof this rule checks each
component's own pattern rather than one global name.

## Chip.stories.tsx — required-a11y-prop convention
Agrees with Button's `state`/`size` naming (the majority convention — Alert
is the one outlier, not the other way around) and adds a required
`aria-label` on every variant. This is now an enforced rule, not just a
documented convention — `tools/gate.ts`'s `requiredPropsPresent()` checks it
directly, proven against `generated/Chip.clean.tsx` (passes),
`generated/Chip.missing-aria.tsx`, and `generated/Chip.optional-aria.tsx`
(both fail, with distinct messages). Added alongside
`fixtures/chip-dual-red.json` (the restatement ambiguity fixture, ADR 0011) so
`read_component_patterns('Chip', 'react')` returns a real example instead of
`[]`. Also covered by `renamedPropCheck()` — agrees with Button's `state`
canonical (unlike Alert), same wrong aliases `variant`/`color`, proven by
`generated/Chip.renamed-prop.tsx` (`variant`) and
`generated/Chip.renamed-color.tsx` (`color`).

## Modal.stories.tsx — a different prop shape entirely
No variant enum — a boolean visibility prop instead, so its naming risk
isn't a state/variant/color-style synonym but the aliases real UI libraries
actually use for the same concept (MUI's `open`, Chakra/Reach's `isOpen`,
antd's `visible`). `open` is canonical *for this library* because this file
says so — not an objectively "correct" choice among the real alternatives.
Covered by `renamedPropCheck()`: requires `open`, flags `isOpen`/`visible`
as wrong aliases, proven by `generated/Modal.renamed-prop.tsx` (`isOpen`)
and `generated/Modal.renamed-visible.tsx` (`visible`) — both failing
distinctly — against `generated/Modal.clean.tsx` (passing).
