import type { GateViolation, GateResult } from './types.ts';

type TokenStore = Record<string, Record<string, string>>;

// Deterministic rules only. No model call, no in-memory handoff from the
// generator or critic — everything each rule needs is either the raw
// source text, a freshly-loaded tokens.json, or (rule 3) the component
// type inferred from the filename. Separate rules because they need
// different data and catch different failure classes (see ADR 0007):

// Rule 1: no literal value ever, regardless of whether it happens to match
// a real token. Needs zero token data — a literal is a literal.
function noHardcodedValues(source: string): GateViolation[] {
  const violations: GateViolation[] = [];
  const literalPattern = /#[0-9A-Fa-f]{6}\b|\b\d+px\b/g;
  let match: RegExpExecArray | null;
  while ((match = literalPattern.exec(source)) !== null) {
    const lineNumber = source.slice(0, match.index).split('\n').length;
    violations.push({
      rule: 'no-hardcoded-value',
      location: `line ${lineNumber}`,
      detail: `literal ${match[0]} found — must reference a token, not restate a value`,
    });
  }
  return violations;
}

// Rule 2: any string that looks like a token ref must actually exist in
// tokens.json. Needs the full, freshly-loaded token file — this is the
// deterministic version of "refuse to invent a token."
function noInventedReferences(source: string, tokens: TokenStore): GateViolation[] {
  const categories = Object.keys(tokens).join('|');
  const refPattern = new RegExp(`['"](${categories})\\/[\\w-]+(?:\\/[\\w-]+)?['"]`, 'g');
  const violations: GateViolation[] = [];
  let match: RegExpExecArray | null;
  while ((match = refPattern.exec(source)) !== null) {
    const ref = match[0].slice(1, -1);
    const separatorIndex = ref.indexOf('/');
    const category = ref.slice(0, separatorIndex);
    const key = ref.slice(separatorIndex + 1);
    const exists = tokens[category]?.[key] !== undefined;
    if (!exists) {
      const lineNumber = source.slice(0, match.index).split('\n').length;
      violations.push({
        rule: 'invented-reference',
        location: `line ${lineNumber}`,
        detail: `referenced token ${ref} does not exist in tokens.json`,
      });
    }
  }
  return violations;
}

// Rule 3: component-specific required-prop contract. Unlike rules 1/2
// (universal, apply to any generated file), this needs to know which
// component it's validating — Chip's contract isn't every component's
// contract. Covers required accessibility props; renamed-prop detection
// (e.g. state -> variant) is rule 4, below.
const REQUIRED_PROPS: Record<string, string[]> = {
  Chip: ['aria-label'],
};

function requiredPropsPresent(source: string, componentType: string): GateViolation[] {
  const required = REQUIRED_PROPS[componentType];
  if (!required) return [];

  const violations: GateViolation[] = [];
  for (const prop of required) {
    const declaredPattern = new RegExp(`['"]${prop}['"]\\s*\\??\\s*:`);
    const optionalPattern = new RegExp(`['"]${prop}['"]\\s*\\?\\s*:`);
    if (!declaredPattern.test(source)) {
      violations.push({
        rule: 'missing-required-prop',
        location: 'props interface',
        detail: `${componentType} must declare a required '${prop}' prop — none found`,
      });
    } else if (optionalPattern.test(source)) {
      violations.push({
        rule: 'missing-required-prop',
        location: 'props interface',
        detail: `${componentType} declares '${prop}' as optional (?) — must be required`,
      });
    }
  }
  return violations;
}

// Rule 4: renamed-prop schema check. A generated component's prop name for
// a concept must match the canonical name its own pattern file already
// established, not a plausible-looking synonym (e.g. `variant` instead of
// `state`). Canonical names are named explicitly per component rather than
// inferred by parsing the pattern file's shape — Alert's pattern uses JSX
// composition, Button/Chip use flat args, no single regex parses both
// honestly, and a fuzzy catch-all here would be an unreliable
// pattern-matcher pretending to be exhaustive. Entries are added only once
// a real fixture proves the check. Chip agrees with Button's `state`
// convention (the majority — see patterns/react/README.md). Alert is the
// interesting one: its own canonical is `status`, not `state` — a
// component correctly using `status` must pass, and one that "fixes" it
// back to the majority `state` convention must still fail, proving this
// checks each component's *own* established pattern, not a single global
// name. Modal is a different shape again — a boolean visibility prop, not
// a variant enum, so its "wrong renames" are the aliases real UI libraries
// actually use for the same concept (MUI's `open` vs. Chakra/Reach's
// `isOpen` vs. antd's `visible`), not a state/variant/color-style synonym.
interface PropSchemaEntry {
  canonical: string;
  aliases: string[];
}

const PROP_SCHEMA: Record<string, PropSchemaEntry> = {
  Button: { canonical: 'state', aliases: ['variant', 'color'] },
  Chip: { canonical: 'state', aliases: ['variant', 'color'] },
  Alert: { canonical: 'status', aliases: ['state', 'variant'] },
  Modal: { canonical: 'open', aliases: ['isOpen', 'visible'] },
};

function renamedPropCheck(source: string, componentType: string): GateViolation[] {
  const schema = PROP_SCHEMA[componentType];
  if (!schema) return [];

  const canonicalPattern = new RegExp(`\\b${schema.canonical}\\??\\s*:`);
  if (canonicalPattern.test(source)) return [];

  const violations: GateViolation[] = [];
  for (const alias of schema.aliases) {
    const aliasPattern = new RegExp(`\\b${alias}\\??\\s*:`);
    if (aliasPattern.test(source)) {
      violations.push({
        rule: 'renamed-prop',
        location: 'props interface',
        detail: `${componentType} uses '${alias}' where the pattern's convention requires '${schema.canonical}' — plausible rename, not the library's actual contract`,
      });
    }
  }
  return violations;
}

interface RunGateOptions {
  isStylesheet?: boolean;
}

// isStylesheet: rules 3/4 are prop-contract concepts (required props,
// canonical prop naming) — meaningless for a .css file, and actively wrong
// there: CSS's own `color:` property collides textually with rule 4's
// alias regex for the unrelated React prop rename check, a real false
// positive found while extending the gate to CSS at all. Rules 1/2 still
// apply universally — rule 1 in particular is the actual point of making
// the gate CSS-aware: a stylesheet only passes by referencing tokens via
// var(), the same "reference, don't restate" mechanism rule 1 already
// enforces for component source, not by exemption.
function runGate(source: string, tokens: TokenStore, componentType: string, { isStylesheet = false }: RunGateOptions = {}): GateResult {
  const violations = [
    ...noHardcodedValues(source),
    ...noInventedReferences(source, tokens),
    ...(isStylesheet ? [] : requiredPropsPresent(source, componentType)),
    ...(isStylesheet ? [] : renamedPropCheck(source, componentType)),
  ];
  return { passed: violations.length === 0, violations };
}

module.exports = {
  noHardcodedValues,
  noInventedReferences,
  requiredPropsPresent,
  renamedPropCheck,
  runGate,
};
