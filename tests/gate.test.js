// Turns the fixture regression sweep — previously a manual bash loop run by
// hand throughout this build ("node validate.js <file>" x25, eyeballed) —
// into real assertions with a real exit code. Spawns the actual CLI
// (validate.js) per fixture rather than importing runGate directly, so this
// tests the real interface (componentType inference, isStylesheet
// detection, the GENERATED_GROUND_TRUTH exemption) and not a
// reimplementation of it.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// expected: 0 = gate passes, 1 = gate fails (a real violation), 2 = exempt
// generated-ground-truth file, not gated at all.
const FIXTURES = [
  ['generated/Alert.clean.tsx', 0],
  ['generated/Alert.renamed-prop.tsx', 1],
  ['generated/Alert.renamed-variant.tsx', 1],
  ['generated/Badge.broken.tsx', 1],
  ['generated/Button.clean.stories.tsx', 0],
  ['generated/Button.clean.tsx', 0],
  ['generated/Button.drifted.tsx', 1],
  ['generated/Button.invented-ref.tsx', 1],
  ['generated/Button.renamed-color.tsx', 1],
  ['generated/Button.renamed-prop.tsx', 1],
  ['generated/Chip.clean.tsx', 0],
  ['generated/Chip.missing-aria.tsx', 1],
  ['generated/Chip.optional-aria.tsx', 1],
  ['generated/Chip.renamed-color.tsx', 1],
  ['generated/Chip.renamed-prop.tsx', 1],
  ['generated/Modal.clean.tsx', 0],
  ['generated/Modal.renamed-prop.tsx', 1],
  ['generated/Modal.renamed-visible.tsx', 1],
  ['generated/Badge.angular.broken.ts', 1],
  ['generated/Button.angular.clean.stories.ts', 0],
  ['generated/Button.angular.clean.ts', 0],
  ['generated/Button.angular.drifted.ts', 1],
  ['generated/Button.angular.renamed-prop.ts', 1],
  ['generated/token-resolver.ts', 2],
  ['generated/Button.hardcoded.css', 1],
];

function runValidate(relativePath) {
  try {
    execFileSync('node', ['validate.js', relativePath], { cwd: ROOT, stdio: 'pipe' });
    return 0;
  } catch (err) {
    // execFileSync throws on non-zero exit; the real code is on the error.
    return err.status;
  }
}

for (const [file, expectedExitCode] of FIXTURES) {
  test(`gate: ${file} -> exit ${expectedExitCode}`, () => {
    assert.equal(runValidate(file), expectedExitCode);
  });
}
