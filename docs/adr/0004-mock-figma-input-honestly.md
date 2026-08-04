# 0004 — Mock Figma input structurally, disclose the boundary

**Status:** Accepted

## Context
Loom needs a design-intent input. A live Figma OAuth integration is real
infrastructure work orthogonal to the actual system being proven here
(retrieval, generation, validation, landing) — but a mock that invents its
own shape would be misleading about what's actually being tested.

## Decision
Design intent is mocked as a JSON payload shaped exactly like Figma's real
REST API node response (`componentId`/`componentProperties`, a two-step
style-ID resolution, `cornerRadius` as a plain number) rather than an
invented, convenient shape. The boundary — this input is mocked, everything
downstream of it is real — is stated explicitly in the README, not left
for someone to discover by reading source.

## Consequences
- The mock had to be verified against Figma's actual developer docs and
  type definitions, not just assumed plausible — an earlier version used
  an invented `variant` field and a flattened `styles.radius`, neither of
  which exists in Figma's real API, and was corrected.
- No live Figma OAuth/API dependency for local development or testing.
