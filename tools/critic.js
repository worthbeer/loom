// Re-parses the generated code itself — never trusts the generator's own
// claim about what it did. Only checks the mechanical, pattern-matchable
// half of the critic's job (see traces/generator-prompt-trace.md). The
// semantic `matches_intent` half genuinely needs a model call, which we're
// keeping out of the loop for this rung — left null/hand-reasoned instead.
//
// critique() takes resolvedTokens straight from the retrieval loop and does
// not accept a restatedIntent parameter at all (see tools/restate_intent.js)
// — not an oversight, this is how the rule that the critic must never read
// the restatement as ground truth (ADR 0011) is enforced: there's no
// parameter to misuse.

function critique(source, { resolvedTokens }) {
  const valueToRef = {};
  for (const [ref, result] of Object.entries(resolvedTokens)) {
    if (result.found) valueToRef[result.value] = ref;
  }

  const violations = [];
  const literalPattern = /#[0-9A-Fa-f]{6}\b|\b\d+px\b/g;
  let match;
  while ((match = literalPattern.exec(source)) !== null) {
    const literal = match[0];
    const lineNumber = source.slice(0, match.index).split('\n').length;
    const knownRef = valueToRef[literal];
    violations.push({
      rule: knownRef ? 'no-hardcoded-value' : 'unknown-value',
      location: `line ${lineNumber}`,
      detail: knownRef
        ? `literal ${literal} used instead of referencing token ${knownRef}`
        : `literal ${literal} does not match any resolved token — value may be invented`,
    });
  }

  return {
    passed: violations.length === 0,
    violations,
    matches_intent: null, // out of scope for a regex critic — needs a model, hand-reasoned separately
  };
}

module.exports = { critique };

if (require.main === module) {
  (async () => {
    const fs = require('fs');
    const path = require('path');
    const { run_retrieval_loop } = require('./run_retrieval_loop');

    const buttonDanger = require('../fixtures/button-danger.json');
    const { resolvedTokens } = await run_retrieval_loop(buttonDanger, 'react');

    for (const variant of ['clean', 'drifted']) {
      const source = fs.readFileSync(path.join(__dirname, '..', 'generated', `Button.${variant}.tsx`), 'utf8');
      console.log(`\n=== Button.${variant}.tsx ===`);
      console.log(JSON.stringify(critique(source, { resolvedTokens }), null, 2));
    }
  })();
}
