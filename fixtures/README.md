# Fixtures

Mocked Figma node payloads. **Reshaped to match Figma's real REST API**,
verified against Figma's developer docs and the open-source `rest-api-spec`
type definitions — an earlier version of these fixtures used an invented
`variant` field and a flattened `styles.radius`, neither of which exists in
Figma's actual API (see ADR 0004). These are the ground truth every
retrieval tool and the gate are tested against.

## What each field actually is, now
- `componentProperties` — real shape: a map keyed by `"PropertyName#nodeId"`
  (the node-ID suffix disambiguates properties across nested component
  sets), each value `{ type: "VARIANT", value: "Danger" }`. Authored values
  are capitalized, the way a designer types them into a variant dropdown —
  `tools/read_figma_node.js`'s `extractVariant()` is where these get
  lowercased into the enum values everything downstream expects.
- `styles.fill` / `styles.stroke` — a style-ID reference (e.g.
  `"S:button-red-600,0"`), only present when the fill/stroke is bound to a
  shared style rather than a raw literal. Resolving that ID to a name is a
  genuinely separate API call in real Figma (`GET /v1/files/:key/styles`),
  mocked here as `figma-styles.json` at the repo root.
- `cornerRadius` — a plain number directly on the node. Figma has **no**
  style/token concept for corner radius at all (confirmed against Figma's
  property docs) — mapping `4` to `radius/sm` is entirely our own
  convention (`radiusRefForPx()`), not anything Figma resolves.
- `fills` — the raw Paint array. Present for shape-realism; nothing in this
  project currently reads it directly (only the `styles.fill` reference, if
  present, is resolved into a token).

## button-danger.json — valid
- `componentProperties`: `State#10:5` → `Danger`, `Size#10:6` → `Md` → normalizes to `{ state: 'danger', size: 'md' }`.
- `styles.fill: "S:button-red-600,0"` → `figma-styles.json` → `"Red/600"` → `color/red/600` → `tokens.json` → `#C0392B`.
- `cornerRadius: 4` → `radius/sm` → `tokens.json` → `4px`.
- Everything resolves. Expected system behavior: resolves cleanly, no errors.

## alert-info.json — valid, different shape, second style dimension
- `componentProperties`: `State#20:5` → `Info`, `Size#20:6` → `Md`.
- `styles.fill: "S:alert-blue-600,0"` → `"Blue/600"` → `color/blue/600` → `#2E5FCC`.
- `styles.stroke: "S:alert-gray-900,0"` → `"Gray/900"` → `color/gray/900` →
  `#1C1C1E` — a second, independent style slot (not a near-duplicate pair
  like Chip's, just proof `read_figma_node`'s styles loop correctly
  resolves more than one entry for a component other than Chip).
- `cornerRadius: 8` → `radius/md` → `8px`.
- `children` is an array of two node types (`ICON`, `TEXT`) instead of
  button's single `TEXT` node — exercises multi-child parsing.
- Everything resolves. Expected system behavior: resolves cleanly, no errors.

## badge-broken.json — deliberately invalid
- `componentProperties`: `State#30:5` → `Danger`, `Size#30:6` → `Sm`.
- `styles.fill: "S:badge-red-999,0"` → `figma-styles.json` resolves this ID
  fine, to `"Red/999"` — the Figma-side style genuinely exists and resolves.
  The break happens one step later: `color/red/999` **does not exist** in
  `tokens.json` (only `color/red/600` and `color/red/700` are defined). This
  is the more realistic failure shape — not a broken lookup, but a style
  that's valid in Figma with no corresponding entry in our own token store.
- `cornerRadius: 4` → `radius/sm` → `4px` (this one resolves fine).

**Expected system behavior when this fixture is processed:**
- `read_tokens("color/red/999")` must return `{ found: false }`, not throw.
- `read_figma_node` must still parse the fixture structurally — the bad ref
  should surface inside the normalized `tokenRefs` output for the caller to
  check, not abort parsing.
- The deterministic gate is what's expected to actually reject this
  fixture's generated output — not the parser and not the generator. If
  generation is ever attempted against this fixture, the gate is the stage
  that must catch it, independent of any model call.

This is the fixture used for the deliberate-failure half of the demo
chain: a clean fixture runs first, this one second.

## chip-dual-red.json — valid, near-duplicate tokens
- `componentProperties`: `State#40:5` → `Alert`, `Size#40:6` → `Sm`.
- `styles.fill: "S:chip-red-600,0"` → `"Red/600"` → `color/red/600` → `#C0392B`.
- `styles.stroke: "S:chip-red-700,0"` → `"Red/700"` → `color/red/700` →
  `#A93226` (real Figma term is `stroke`, not `border` — corrected from an
  earlier version of this fixture that used the CSS/web term instead). Also
  carries a `strokes` raw-Paint array alongside `fills` — real Figma nodes
  have both as parallel arrays; an earlier version of this fixture had
  `styles.stroke` with no matching `strokes` entry, fixed alongside adding
  `alert-info.json`'s second dimension for the same reason.
- Both refs resolve fine — this fixture isn't testing token lookup. It
  exists to test the restatement stage (ADR 0011): two visually-close-but-
  distinct reds are used for two different style slots in the same
  component. A correct restatement keeps them attributed separately ("fill
  uses red/600, stroke uses red/700"); an incorrect one collapses them into
  a vague single "red" mention, silently dropping which value belongs
  where.
