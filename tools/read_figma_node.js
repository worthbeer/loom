const tokens = require('../tokens.json');
const figmaStyles = require('../figma-styles.json');

// Figma's generic style types map to our token categories. Only FILL/STROKE
// are used by current fixtures; extend this table, not the resolution
// logic, if EFFECT/TEXT styles are ever needed.
const STYLE_TYPE_TO_CATEGORY = { FILL: 'color', STROKE: 'color' };

// Reverse lookup: numeric px value -> our radius token ref. This mapping
// lives entirely on our side — Figma has no concept of a "radius style" at
// all (confirmed against Figma's own property docs: cornerRadius is a
// plain number directly on the node, not a shared/resolvable style like
// fill or stroke). Translating that number into a design-system token is
// our own convention to own, not something Figma resolves for us.
function radiusRefForPx(px) {
  for (const [key, value] of Object.entries(tokens.radius)) {
    if (parseInt(value, 10) === px) return `radius/${key}`;
  }
  return null;
}

// A node's fill/stroke only has a resolvable token if it's bound to a
// shared style (styles.fill / styles.stroke — a style-ID reference, real
// REST API shape) rather than a raw literal Paint. Resolving that ID to a
// name is a genuinely separate lookup in the real API (GET
// /v1/files/:key/styles), mocked here as figma-styles.json. The name
// becomes a token ref once lowercased — "Red/600" -> "color/red/600" — by
// our own naming convention, not anything Figma enforces. An unbound
// literal fill has no ref to resolve at all, which is the real-world
// analog of gate.js rule 1's hardcoded-value check, one layer upstream in
// Figma itself.
function styleRefFor(styleType, styleId) {
  const category = STYLE_TYPE_TO_CATEGORY[styleType];
  const style = figmaStyles[styleId];
  if (!category || !style) return null;
  return `${category}/${style.name.toLowerCase()}`;
}

function extractTokenRefs(node) {
  const refs = [];
  for (const [styleType, styleId] of Object.entries(node.styles || {})) {
    const ref = styleRefFor(styleType.toUpperCase(), styleId);
    if (ref) refs.push(ref);
  }
  const radiusRef = radiusRefForPx(node.cornerRadius);
  if (radiusRef) refs.push(radiusRef);
  return refs;
}

// Figma property keys carry a node-ID suffix ("State#10:5") to disambiguate
// properties with the same name across nested component sets — real shape,
// confirmed against Figma's rest-api-spec type definitions. Authored values
// are capitalized ("Danger") the way a designer would type them into a
// variant dropdown; downstream code expects lowercase enums, so this is
// where that translation actually happens, not assumed away.
function extractVariant(componentProperties) {
  const variant = {};
  for (const [key, entry] of Object.entries(componentProperties || {})) {
    const propName = key.split('#')[0].toLowerCase();
    variant[propName] = String(entry.value).toLowerCase();
  }
  return variant;
}

function read_figma_node(payload) {
  return {
    component: payload.component,
    variant: extractVariant(payload.componentProperties),
    tokenRefs: extractTokenRefs(payload),
    content: payload.children,
  };
}

module.exports = { read_figma_node, extractTokenRefs, extractVariant, radiusRefForPx, styleRefFor };

if (require.main === module) {
  const buttonDanger = require('../fixtures/button-danger.json');
  const alertInfo = require('../fixtures/alert-info.json');
  const badgeBroken = require('../fixtures/badge-broken.json');

  console.log('button-danger.json ->');
  console.log(read_figma_node(buttonDanger));
  console.log('\nalert-info.json ->');
  console.log(read_figma_node(alertInfo));
  console.log('\nbadge-broken.json ->');
  console.log(read_figma_node(badgeBroken));
}
