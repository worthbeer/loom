// Coverage for loom.ts's generate() orchestration itself — previously
// untested, since it used to always attempt a real GitHub call once the
// gate passed. Now that openPr defaults to false (ADR 0013), the default
// path is fully network-free (no GitHub, and live defaults false too, so
// no Anthropic) and safe to exercise directly here.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { generate } = require('../loom.ts');

test('generate(): clean fixture, default args — gate passes, no PR opened (dry run)', async () => {
  const result = await generate({ component: 'button', variant: 'danger', framework: 'react' });
  assert.equal(result.gateResult.passed, true);
  assert.equal(result.prUrl, null);
});

test('generate(): broken fixture — gate fails, returns cleanly rather than throwing or landing anything', async () => {
  const result = await generate({ component: 'badge', variant: 'broken', framework: 'react' });
  assert.equal(result.gateResult.passed, false);
  assert.equal(result.prUrl, null);
  assert.ok(result.gateResult.violations.length > 0);
});

test('generate(): trace lines report the dry run explicitly', async () => {
  const lines: string[] = [];
  await generate({ component: 'button', variant: 'danger', framework: 'react', onTrace: (line: string) => lines.push(line) });
  assert.ok(lines.some((l) => l.includes('Not opening a PR')));
});
