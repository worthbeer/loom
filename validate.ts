#!/usr/bin/env node
// Standalone gate CLI. No dependency on the generator/critic being in the
// same process: tokens.json loads fresh from disk here, the target file
// loads from the path argument. Usage: node validate.ts <path-to-component>

const fs: typeof import('fs') = require('fs');
const path: typeof import('path') = require('path');
const { runGate } = require('./tools/gate.ts');

const USAGE = 'Usage: node validate.ts <path-to-component>';

const HELP_TEXT = `${USAGE}

Runs the deterministic gate (tools/gate.ts) against a single generated
component file. Component type is inferred from the filename (e.g.
Button.clean.tsx -> Button) for the required-prop and renamed-prop rules.
Prints the result as JSON; exits 0 if the gate passes, 1 if it fails.

Examples:
  node validate.ts generated/Button.clean.tsx          # passes
  node validate.ts generated/Button.drifted.tsx        # fails: hardcoded value (rule 1)
  node validate.ts generated/Button.invented-ref.tsx   # fails: invented token ref (rule 2)
  node validate.ts generated/Chip.missing-aria.tsx     # fails: missing required prop (rule 3)
  node validate.ts generated/Button.renamed-prop.tsx   # fails: renamed prop (rule 4)
`;

const arg = process.argv[2];

if (arg === '--help' || arg === '-h') {
  console.log(HELP_TEXT);
  process.exit(0);
}

if (!arg) {
  console.error(USAGE);
  console.error('Run with --help for more information.');
  process.exit(2);
}

const targetPath = arg;

const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens.json'), 'utf8'));
const source = fs.readFileSync(targetPath, 'utf8');
// Component type for rules 3/4 (required-prop, renamed-prop): first
// dot-separated segment of the filename, capitalized. The capitalization
// matters and isn't cosmetic: PROP_SCHEMA/REQUIRED_PROPS keys are
// PascalCase ("Button"), but idiomatic real-world filenames for some
// frameworks are lowercase (Angular's "button.component.ts", not
// "Button.component.ts") — read_component_patterns.ts's own filename
// match is already case-insensitive (it lowercases both sides), but a
// plain object-key lookup here is not, so a lowercase filename would
// silently look up a key that doesn't exist and no-op the check entirely,
// not fail to find a violation. Caught before this ever ran for real
// against an idiomatically-named Angular file.
const rawComponentType = path.basename(targetPath).split('.')[0];
const componentType = rawComponentType.charAt(0).toUpperCase() + rawComponentType.slice(1);

// Generated ground-truth files, exempt from the gate by the same
// convention as tokens.json itself never being gated: each one IS the
// source of truth's form for a particular consumer (CSS custom
// properties, an Angular resolver function), not a consumer of it —
// running the gate on it would flag its own literal values as violations
// of the rule it exists to let other files satisfy.
const GENERATED_GROUND_TRUTH: Record<string, string> = {
  'tokens.css': 'tools/generate_tokens_css.ts',
  'token-resolver.ts': 'tools/generate_token_resolver.ts',
};
const targetBasename = path.basename(targetPath);
if (GENERATED_GROUND_TRUTH[targetBasename]) {
  console.error(`${targetPath} is generated ground truth (${GENERATED_GROUND_TRUTH[targetBasename]}) — not meant to be gated, same convention as tokens.json itself.`);
  process.exit(2);
}

// .css files get rules 1/2 only (no prop-contract concepts apply) — see
// gate.ts's runGate comment for why rule 4 in particular would produce a
// false positive on CSS's own `color:` property otherwise.
const isStylesheet = path.extname(targetPath) === '.css';

const result = runGate(source, tokens, componentType, { isStylesheet });
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
