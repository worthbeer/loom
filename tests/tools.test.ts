// Unit coverage for the retrieval-layer tools and the critic's mechanical
// checks — the pieces the gate.test.ts CLI sweep doesn't exercise directly.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { read_tokens } = require('../tools/read_tokens.ts');
const { read_figma_node } = require('../tools/read_figma_node.ts');
const { read_component_patterns } = require('../tools/read_component_patterns.ts');
const { routeFramework } = require('../tools/route_framework.ts');
const { critique } = require('../tools/critic.ts');
const { run_retrieval_loop } = require('../tools/run_retrieval_loop.ts');

test('read_tokens: valid ref resolves', () => {
  assert.deepEqual(read_tokens('color/red/600'), { value: '#C0392B', found: true });
});

test('read_tokens: invalid ref returns found:false, does not throw', () => {
  assert.deepEqual(read_tokens('color/red/999'), { value: null, found: false });
});

test('read_tokens: malformed ref (no slash) returns found:false, does not throw', () => {
  assert.deepEqual(read_tokens('malformed-ref'), { value: null, found: false });
});

test('read_figma_node: button-danger.json parses to the expected shape', () => {
  const buttonDanger = require('../fixtures/button-danger.json');
  const result = read_figma_node(buttonDanger);
  assert.equal(result.component, 'Button');
  assert.deepEqual(result.variant, { state: 'danger', size: 'md' });
  assert.ok(result.tokenRefs.includes('color/red/600'));
  assert.ok(result.tokenRefs.includes('radius/sm'));
});

test('read_figma_node: badge-broken.json surfaces the bad ref rather than throwing', () => {
  const badgeBroken = require('../fixtures/badge-broken.json');
  const result = read_figma_node(badgeBroken);
  assert.ok(result.tokenRefs.includes('color/red/999'));
});

test('read_component_patterns: never mixes frameworks for the same component', () => {
  const react = read_component_patterns('Button', 'react');
  const angular = read_component_patterns('Button', 'angular');
  assert.ok(react.length > 0);
  assert.ok(angular.length > 0);
  assert.ok(react.every((p: { filename: string }) => p.filename.endsWith('.tsx')));
  assert.ok(angular.every((p: { filename: string }) => p.filename.endsWith('.ts')));
});

test('read_component_patterns: missing combo returns [], not a throw', () => {
  assert.deepEqual(read_component_patterns('NoSuchComponent', 'react'), []);
});

test('routeFramework: explicit flag wins regardless of payload', () => {
  const buttonDanger = require('../fixtures/button-danger.json');
  const result = routeFramework({ framework: 'react' }, buttonDanger);
  assert.deepEqual(result, { framework: 'react', source: 'explicit' });
});

test('routeFramework: falls back to payload hint when no explicit flag', () => {
  const angularHint = require('../fixtures/button-danger-angular-hint.json');
  const result = routeFramework({}, angularHint);
  assert.deepEqual(result, { framework: 'angular', source: 'payload' });
});

test('routeFramework: ambiguous asks rather than guesses', () => {
  const buttonDanger = require('../fixtures/button-danger.json');
  const result = routeFramework({}, buttonDanger);
  assert.equal(result.framework, null);
  assert.equal(result.needsClarification, true);
});

test('critic: clean fixture passes with zero violations', async () => {
  const buttonDanger = require('../fixtures/button-danger.json');
  const { resolvedTokens } = await run_retrieval_loop(buttonDanger, 'react');
  const source = fs.readFileSync(path.join(__dirname, '..', 'generated', 'Button.clean.tsx'), 'utf8');
  const result = critique(source, { resolvedTokens });
  assert.equal(result.passed, true);
  assert.deepEqual(result.violations, []);
});

test('critic: drifted fixture is caught, naming the specific token that should have been used', async () => {
  const buttonDanger = require('../fixtures/button-danger.json');
  const { resolvedTokens } = await run_retrieval_loop(buttonDanger, 'react');
  const source = fs.readFileSync(path.join(__dirname, '..', 'generated', 'Button.drifted.tsx'), 'utf8');
  const result = critique(source, { resolvedTokens });
  assert.equal(result.passed, false);
  assert.ok(result.violations.some((v: { detail: string }) => v.detail.includes('color/red/600')));
});

test('run_retrieval_loop: restate_intent stays stubbed (null) unless live is explicitly requested', async () => {
  const buttonDanger = require('../fixtures/button-danger.json');
  const { restatedIntent } = await run_retrieval_loop(buttonDanger, 'react');
  assert.equal(restatedIntent, null);
});
