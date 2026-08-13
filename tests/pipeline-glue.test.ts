// Unit coverage for the pure/near-pure functions in the "glue" layer that
// sits between the tested retrieval/gate/critic core and the network calls
// (GitHub, Anthropic) — parsing, formatting, and prompt-matching logic that
// had no automated coverage before this file. Actual `fetch` calls
// (tools/anthropic_client.ts's callAnthropic, tools/open_pr.ts's
// githubRequest) are deliberately not covered here — thin pass-throughs,
// low value to mock — see ADR 0013/0014's context for the coverage this
// file exists to close.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { parseFileBlocks } = require('../tools/generate_component.ts');
const { stripCodeFences } = require('../tools/anthropic_client.ts');
const { buildCommentBody } = require('../tools/open_pr.ts');
const { parsePrompt } = require('../bridge-server.ts');

test('parseFileBlocks: well-formed two-file response parses both', () => {
  const raw = `===FILE: Button.tsx===
export const Button = () => null;
===END===

===FILE: Button.stories.tsx===
export default {};
===END===`;
  const files = parseFileBlocks(raw);
  assert.deepEqual(Object.keys(files), ['Button.tsx', 'Button.stories.tsx']);
  assert.ok(files['Button.tsx'].includes('export const Button'));
});

test('parseFileBlocks: no parseable blocks throws rather than returning empty', () => {
  assert.throws(() => parseFileBlocks('no file markers here'), /could not parse any files/);
});

test('stripCodeFences: strips a fenced block with a language tag', () => {
  assert.equal(stripCodeFences('```json\n{"a":1}\n```'), '{"a":1}');
});

test('stripCodeFences: strips a fenced block with no language tag', () => {
  assert.equal(stripCodeFences('```\nplain text\n```'), 'plain text');
});

test('stripCodeFences: text with no fences is returned unchanged (trimmed)', () => {
  assert.equal(stripCodeFences('  no fences here  '), 'no fences here');
});

test('buildCommentBody: matches_intent null renders the "not evaluated" line', () => {
  const body = buildCommentBody({
    fixtureLabel: 'button-danger.json',
    intent: { component: 'Button', variant: { state: 'danger' }, tokenRefs: [], content: null },
    resolvedTokens: { 'color/red/600': { value: '#C0392B', found: true } },
    patternFilename: 'Button.stories.tsx',
    framework: 'react',
    criticResult: { passed: true, violations: [], matches_intent: null },
    gateResult: { passed: true, violations: [] },
    decisionsWorthKeeping: null,
  });
  assert.ok(body.includes('matches_intent not evaluated'));
  assert.ok(!body.includes('Decisions worth keeping'));
});

test('buildCommentBody: decisionsWorthKeeping, when present, is included', () => {
  const body = buildCommentBody({
    fixtureLabel: 'button-danger.json',
    intent: { component: 'Button', variant: { state: 'danger' }, tokenRefs: [], content: null },
    resolvedTokens: {},
    patternFilename: 'Button.stories.tsx',
    criticResult: { passed: true, violations: [], matches_intent: true },
    gateResult: { passed: true, violations: [] },
    decisionsWorthKeeping: 'kept the aria-label default from the pattern file',
  });
  assert.ok(body.includes('Decisions worth keeping: kept the aria-label default from the pattern file'));
  assert.ok(body.includes('matches_intent: true'));
});

test('parsePrompt: recognizes component, variant, and framework', () => {
  const result = parsePrompt('generate a danger button in react');
  assert.deepEqual(result, { component: 'button', variant: 'danger', framework: 'react' });
});

test('parsePrompt: partial match leaves the rest undefined, no guessing', () => {
  const result = parsePrompt('generate a danger button');
  assert.equal(result.component, 'button');
  assert.equal(result.variant, 'danger');
  assert.equal(result.framework, undefined);
});

test('parsePrompt: nothing recognized returns all-undefined, not a throw', () => {
  const result = parsePrompt('make me a sandwich');
  assert.deepEqual(result, { component: undefined, variant: undefined, framework: undefined });
});
