# Architecture

## Problem

Conventional component libraries are passive: a developer imports a
component and has to already know its conventions — design tokens, prop
contracts, accessibility rules — from documentation or memory, with
nothing stopping the two from drifting apart over time. Loom is
addressable instead: it generates, explains, and validates components
against machine-readable conventions on request. See
[ADR 0001](docs/adr/0001-agentic-not-attached.md).

## Requirements

**Functional**
- Accept design intent as either a structured payload (a mocked Figma node
  tree) or a plain-language request.
- Resolve that intent against a real, queryable convention source (design
  tokens, existing component patterns) — never a memorized or invented
  convention.
- Generate a component and story file for the target framework (React or
  Angular).
- Independently critique the generation against conventions before it
  reaches a human.
- Land the result through a review surface humans already trust (a pull
  request), never a silent commit.
- Publish approved components to a registry other consumers can pull from.

**Non-functional**
- **Auditability** — every generation is traceable to which tokens and
  patterns it used and which rules it was checked against.
- **Deterministic enforcement** — convention compliance is decided by
  code (lint/schema/AST checks), not by a model's own assessment.
- **Framework duality** — React and Angular are both first-class targets;
  routing to the correct convention set is an explicit step, not inferred.
- **Non-goals** — this does not replace human design review, does not
  autonomously merge anything, and is not a general-purpose codegen tool.
  Scope is bounded to this design system's own conventions.

## Pipeline

```
Design intent
  (mocked Figma payload, or plain language via CLI/panel)
        ↓
Retrieval — read_tokens / read_figma_node / read_component_patterns
  deterministic, no model call
        ↓
Restatement
  model paraphrases the retrieved facts back in their own vocabulary,
  a comprehension checkpoint — see ADR 0011
        ↓
Generation
  produces a component + story file for the target framework
        ↓
Critic
  mechanical checks (hardcoded/invented values) always run, regex/pattern
  against re-derived ground truth; semantic match (matches_intent) is an
  independent model call under --live, stubbed otherwise — see ADR 0006,
  ADR 0014
        ↓
Gate
  deterministic AST/regex/schema checks, the actual pass/fail
  authority — see ADR 0007
        ↓
Landing
  draft PR opened via the GitHub REST API, PR comment summarizes
  tokens used and check results — see ADR 0005, 0008
        ↓
Human review
        ↓
Publish
  gate re-runs as a hard precondition, then publishes to npm and a
  Storybook static build — see ADR 0010
```

## Data model

**Design intent** (mocked Figma REST API node shape):
```json
{
  "component": "Button",
  "componentId": "10:20",
  "componentProperties": {
    "State#10:5": { "type": "VARIANT", "value": "Danger" },
    "Size#10:6": { "type": "VARIANT", "value": "Md" }
  },
  "fills": [{ "type": "SOLID", "color": { "r": 0.7529, "g": 0.2235, "b": 0.1686, "a": 1 } }],
  "styles": { "fill": "S:button-red-600,0" },
  "cornerRadius": 4,
  "children": [{ "type": "TEXT", "characters": "Delete" }]
}
```
See [ADR 0004](docs/adr/0004-mock-figma-input-honestly.md) for why this
shape matches Figma's real API rather than an invented convenience shape.

**Convention source** (`tokens.json`, simplified):
```json
{
  "color/red/600": "#C0392B",
  "radius/sm": "4px"
}
```

**Gate/critic result:**
```json
{
  "passed": false,
  "violations": [
    { "rule": "no-hardcoded-value", "location": "line 14", "detail": "used #C0392B directly instead of token color/red/600" }
  ]
}
```

## Failure modes

- **Generated output references a token that doesn't exist** — the gate
  rejects it and the PR comment names the specific invalid reference; no
  silent fallback to a guessed value.
- **Design intent implies a variant with no matching convention** — the
  system does not invent a token; this is a gap surfaced for a human
  decision, not resolved automatically.
- **Framework misroute** (React conventions applied to an Angular target,
  or vice versa) — caught at the routing step, before generation runs, not
  after.
- **Pattern source goes stale as the design system evolves** — few-shot
  retrieval against `patterns/` needs periodic re-indexing; not a one-time
  setup.

## Scaling considerations

- As the pattern library grows, few-shot retrieval should become real
  embedding-based retrieval rather than stuffing every example into
  context.
- Multi-brand token structures (a brand dimension alongside framework)
  are a known extension point, not currently built — the routing function
  would need a brand parameter alongside framework.
- Every generated PR degrades gracefully to "just a draft" if the gate is
  unavailable — there is no code path that permits a merge when the gate
  can't run (see [ADR 0008](docs/adr/0008-never-auto-merge.md)).
- Retrieval's mocked Figma input (ADR 0004) has a disclosed seam for
  swapping to a live client. `figma-bridge/` defines that contract and a
  matching mock adapter today; wiring a real implementation behind it is
  future work, not yet built — see
  [ADR 0012](docs/adr/0012-figma-bridge-is-a-disclosed-seam.md).

## Architecture decisions

The reasoning behind each of the choices above — including the tradeoffs
accepted, not just the benefits — is recorded in
[`docs/adr/`](docs/adr/README.md).
