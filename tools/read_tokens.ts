import type { ResolvedToken } from './types.ts';

const tokens: Record<string, Record<string, string>> = require('../tokens.json');

function read_tokens(ref: string): ResolvedToken {
  const separatorIndex = ref.indexOf('/');
  if (separatorIndex === -1) return { value: null, found: false };

  const category = ref.slice(0, separatorIndex);
  const key = ref.slice(separatorIndex + 1);
  const value = tokens[category]?.[key];
  return { value: value ?? null, found: value !== undefined };
}

function flattenValidRefs(): string[] {
  return Object.entries(tokens).flatMap(([category, entries]) =>
    Object.keys(entries).map((key) => `${category}/${key}`)
  );
}

module.exports = { read_tokens, flattenValidRefs };

if (require.main === module) {
  console.log('color/red/600 (valid, from button-danger.json) ->', read_tokens('color/red/600'));
  console.log('radius/sm     (valid, from button-danger.json) ->', read_tokens('radius/sm'));
  console.log('color/red/999 (broken, from badge-broken.json) ->', read_tokens('color/red/999'));
  console.log('malformed-ref (no slash at all)                ->', read_tokens('malformed-ref'));
  console.log('\nflattened valid refs (for future enum constraint):');
  console.log(flattenValidRefs());
}
