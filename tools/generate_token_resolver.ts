#!/usr/bin/env node
// Generates Angular's token-resolver.ts from tokens.json — the TS-side
// equivalent of generate_tokens_css.ts. Same real gap being closed here:
// token-resolver.ts was hand-maintained with only the 2 entries whichever
// component happened to need at the time, not the actual full token set —
// meaning "corporate redefines a color" could silently fail at runtime
// (resolveToken falling through to '') if someone referenced a real token
// that simply hadn't been hand-copied in yet, even though gate rule 2
// would have correctly verified the reference itself was valid against
// tokens.json. Generating the whole map removes that gap by construction.
//
// This generated file is exempt from the gate, same convention as
// tokens.json and registry/tokens.css: it IS the source of truth's TS
// form, not a consumer of it.

const fs: typeof import('fs') = require('fs');
const path: typeof import('path') = require('path');
const tokens: Record<string, Record<string, string>> = require('../tokens.json');

function generate(): string {
  const lines: string[] = [];
  for (const [category, entries] of Object.entries(tokens)) {
    for (const [key, value] of Object.entries(entries)) {
      lines.push(`  '${category}/${key}': '${value}',`);
    }
  }
  return (
    `// GENERATED from tokens.json by tools/generate_token_resolver.ts — do\n` +
    `// not hand-edit, and do not run this file through the gate (same\n` +
    `// convention as tokens.json itself). Regenerate after any tokens.json\n` +
    `// change.\n` +
    `const TOKENS: Record<string, string> = {\n${lines.join('\n')}\n};\n\n` +
    `export function resolveToken(ref: string): string {\n` +
    `  return TOKENS[ref] ?? '';\n` +
    `}\n`
  );
}

if (require.main === module) {
  const outPath = process.argv[2] || path.join(__dirname, '..', 'generated', 'token-resolver.ts');
  fs.writeFileSync(outPath, generate());
  console.log(`Wrote ${outPath}`);
}

module.exports = { generate };
