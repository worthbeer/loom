# 0013 — PR landing requires explicit opt-in, mirroring --live's discipline

**Status:** Accepted

## Context
`loom.ts generate` — the exact command shown in the README's own Usage
section — opened a real draft PR against a real target repo by default,
as soon as the gate passed. `--live` already gets this right for the
other side-effecting decision in the pipeline (real model calls cost
money, so it's opt-in per invocation, never keyed off whether
`ANTHROPIC_API_KEY` happens to be set); PR-landing had no equivalent
gate. This wasn't caught by inspection — it was caught by running the
README's own documented example command as a smoke test during an
external audit, which opened a real PR
(`worthbeer/ai-builder-styles#15`) on a live repo. A stranger cloning this
repo and following the Usage section would hit the same thing.

## Decision
`generate()` takes an `openPr` argument, default `false`. A passing gate
is a precondition for landing, never sufficient on its own to actually
touch GitHub: without `--open-pr` (CLI) or `openPr=true` (bridge-server
query param), `generate()` stops after the gate, traces why, and returns
`prUrl: null` — no branch, no PR, no `getToken()` call, no network
request to GitHub at all. `--open-pr` opts into the previous behavior
unchanged.

## Consequences
- The README's documented example command is now safe to run as-is,
  including by someone who has never set up `gh auth` or `GITHUB_TOKEN`.
- Demonstrating the real PR-landing path is still one flag away
  (`--open-pr`), not removed — this is a default change, not a feature
  removal.
- `generate()` with the default `openPr: false` is now fully network-free
  (no GitHub, and `--live` is a separate opt-in for Anthropic calls),
  which is what makes it safe to exercise directly in the automated test
  suite for the first time (`tests/loom-generate.test.ts`).
