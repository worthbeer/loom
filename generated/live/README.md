# Real, live-generated output — not a hand-crafted fixture

`Button.tsx` and `Button.stories.tsx` here came from an actual Anthropic API
call (`node tools/generate_component.ts`, run against `button-danger.json`),
not written by hand like everything else in `generated/`.

**Result: gate and critic both correctly failed it.** The model referenced
both tokens it was actually given (`var(--color-red-600)`,
`var(--radius-sm)`) instead of hardcoding them — but it also invented its
own padding/font-size values for the `sm`/`md` sizes, which were never in
the resolved token set. Six hardcoded-value violations, caught
independently by both checks. See `README.md`'s "What's real vs. stubbed"
section for the full writeup.

Left as-is, failing, on purpose — this is the actual proof that the
gate/critic split works against genuinely unpredictable model output, not
just the deliberately-planted violations in the rest of `generated/`.
