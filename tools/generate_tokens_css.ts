#!/usr/bin/env node
// Generates CSS custom properties from tokens.json — the single place a
// JSON token value becomes a literal CSS value. Consumer stylesheets
// (Button.module.css etc.) must reference these via var(), never hardcode
// a literal — that's what gate.ts's noHardcodedValues now enforces for
// .css files (see gate.ts's CSS-awareness comment).
//
// This generated file is itself exempt from the gate, same convention as
// tokens.json never being gated directly: it IS the source of truth's CSS
// form, not a consumer of it. Regenerate after any tokens.json change —
// nothing currently does this automatically, which is itself worth naming
// as a known gap.

const fs: typeof import('fs') = require('fs');
const path: typeof import('path') = require('path');
const tokens: Record<string, Record<string, string>> = require('../tokens.json');

function toCssVarName(category: string, key: string): string {
  return `--${category}-${key.replace(/\//g, '-')}`;
}

function generate(): string {
  // Plain :root — this file is meant to be loaded once as a real global
  // stylesheet (imported from the app's layout/globals.css), not
  // @imported from inside a CSS Module. The first version of this
  // generator assumed @import-from-a-module would work; it doesn't —
  // Next's CSS Modules loader rejects any selector without a local
  // class/id as "not pure," even wrapped in :global(), once the file is
  // pulled through that pipeline at all. A real build error, caught live
  // and fixed by using the right loading mechanism instead of fighting
  // the wrong one.
  const lines = [':root {'];
  for (const [category, entries] of Object.entries(tokens)) {
    for (const [key, value] of Object.entries(entries)) {
      lines.push(`  ${toCssVarName(category, key)}: ${value};`);
    }
  }
  lines.push('}');
  return lines.join('\n') + '\n';
}

if (require.main === module) {
  const outPath = process.argv[2] || path.join(__dirname, '..', 'registry', 'tokens.css');
  const header =
    '/* GENERATED from tokens.json by tools/generate_tokens_css.ts — do not\n' +
    '   hand-edit, and do not run this file through the gate (same convention\n' +
    '   as tokens.json itself: this IS the source of truth\'s CSS form, not a\n' +
    '   consumer of it). Regenerate after any tokens.json change. */\n\n';
  fs.writeFileSync(outPath, header + generate());
  console.log(`Wrote ${outPath}`);
}

module.exports = { generate, toCssVarName };
