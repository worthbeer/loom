// Publish pipeline. The merge-time gate is a hard precondition, not a
// formality: even though CI already runs the gate before merge, this
// re-runs it again at the actual publish moment, deliberately redundant —
// protects against a late manual edit slipping past CI, or any drift
// between what CI saw and what's actually being published. "It passed
// earlier" is never sufficient on its own (see ADR 0010).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runGate } = require('./gate');

const REGISTRY_ROOT = path.join(__dirname, '..', 'registry');
const COMPONENTS_DIR = path.join(REGISTRY_ROOT, 'components');
const PACKAGE_JSON = path.join(REGISTRY_ROOT, 'package.json');

// files: [{ path (relative, e.g. "Button/Button.tsx"), content }]
function publish(files) {
  const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tokens.json'), 'utf8'));

  // Hard precondition: gate re-runs on every file being published, not
  // just the ones that changed. A single failure blocks the whole
  // publish, atomically — nothing is written, npm is never invoked.
  const gateFailures = [];
  for (const file of files) {
    const componentType = path.basename(file.path).split('.')[0];
    const result = runGate(file.content, tokens, componentType);
    if (!result.passed) {
      gateFailures.push({ path: file.path, violations: result.violations });
    }
  }
  if (gateFailures.length > 0) {
    const detail = gateFailures
      .map((f) => `  ${f.path}: ${f.violations.map((v) => v.detail).join('; ')}`)
      .join('\n');
    throw new Error(
      `Merge-time gate failed — publish blocked. This should not happen if CI worked ` +
      `correctly upstream; investigate.\n${detail}`
    );
  }

  // Version bump: semi-automated, reasoning surfaced rather than silent.
  // New component (file doesn't exist in the registry yet) -> minor.
  // Existing component republished -> patch. Distinguishing "new variant
  // on an existing component" from "a fix" would need real semantic
  // diffing, which this scope doesn't build — both currently bump patch,
  // named here rather than quietly presented as more precise than it is.
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  const [major, minor, patch] = pkg.version.split('.').map(Number);

  let bumpType = 'patch';
  let bumpReason = 'existing component file(s) republished';
  for (const file of files) {
    if (!fs.existsSync(path.join(COMPONENTS_DIR, file.path))) {
      bumpType = 'minor';
      bumpReason = `new component file added (${file.path})`;
    }
  }

  const newVersion =
    bumpType === 'minor' ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;

  // Files land before the version bump is written, so a filesystem
  // failure never leaves package.json pointing at a version whose files
  // didn't actually make it in.
  for (const file of files) {
    const dest = path.join(COMPONENTS_DIR, file.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, file.content);
  }
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n');

  const publishOutput = execSync('npm publish --dry-run', { cwd: REGISTRY_ROOT, encoding: 'utf8' });

  return { version: newVersion, bumpType, bumpReason, publishOutput };
}

module.exports = { publish };

if (require.main === module) {
  const buttonTsx = fs.readFileSync(path.join(__dirname, '..', 'generated', 'Button.clean.tsx'), 'utf8');
  const buttonStories = fs.readFileSync(path.join(__dirname, '..', 'generated', 'Button.clean.stories.tsx'), 'utf8');
  const buttonDrifted = fs.readFileSync(path.join(__dirname, '..', 'generated', 'Button.drifted.tsx'), 'utf8');

  console.log('=== Clean merge: publish should succeed ===');
  try {
    const result = publish([
      { path: 'Button/Button.tsx', content: buttonTsx },
      { path: 'Button/Button.stories.tsx', content: buttonStories },
    ]);
    console.log(`Published ${result.version} (${result.bumpType} bump — ${result.bumpReason})`);
    console.log(result.publishOutput);
  } catch (err) {
    console.error('UNEXPECTED FAILURE:', err.message);
    process.exit(1);
  }

  console.log('\n=== Simulated post-merge violation: publish should block ===');
  try {
    publish([{ path: 'Button/Button.tsx', content: buttonDrifted }]);
    console.error('UNEXPECTED: publish succeeded when it should have blocked');
    process.exit(1);
  } catch (err) {
    console.log('Blocked correctly:', err.message);
  }
}
