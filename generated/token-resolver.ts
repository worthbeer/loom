// GENERATED from tokens.json by tools/generate_token_resolver.js — do
// not hand-edit, and do not run this file through the gate (same
// convention as tokens.json itself). Regenerate after any tokens.json
// change.
const TOKENS: Record<string, string> = {
  'color/red/600': '#C0392B',
  'color/red/700': '#A93226',
  'color/blue/100': '#DCEEFB',
  'color/blue/600': '#2E5FCC',
  'color/gray/100': '#F4F4F5',
  'color/gray/900': '#1C1C1E',
  'radius/sm': '4px',
  'radius/md': '8px',
  'radius/lg': '16px',
  'spacing/xs': '4px',
  'spacing/sm': '8px',
  'spacing/md': '16px',
};

export function resolveToken(ref: string): string {
  return TOKENS[ref] ?? '';
}
