const { read_figma_node } = require('./read_figma_node');
const { read_tokens } = require('./read_tokens');
const { read_component_patterns } = require('./read_component_patterns');
const { restate_intent } = require('./restate_intent');

// Deterministic, fixed-order chain — no model in the loop by default, so no
// step cap needed (that guardrail matters once a model is choosing what to
// call next). restate_intent is stubbed unless `live` is explicitly
// passed — see tools/restate_intent.js for why that's opt-in rather than
// keyed off ANTHROPIC_API_KEY's mere presence. Async
// unconditionally (even when stubbed) so callers have one interface
// regardless of live/stub mode.
async function run_retrieval_loop(payload, framework, { live = false } = {}) {
  const trace = [];

  const intent = read_figma_node(payload);
  trace.push({ step: 'read_figma_node', input: payload, output: intent });

  const resolvedTokens = {};
  for (const ref of intent.tokenRefs) {
    const result = read_tokens(ref);
    resolvedTokens[ref] = result;
    trace.push({ step: 'read_tokens', input: ref, output: result });
  }

  const patterns = read_component_patterns(intent.component, framework);
  trace.push({ step: 'read_component_patterns', input: { component: intent.component, framework }, output: patterns.map((p) => p.filename) });

  const restatedIntent = await restate_intent({ intent, resolvedTokens, patterns, live });
  trace.push({ step: 'restate_intent', input: { intent, resolvedTokens, patterns }, output: restatedIntent });

  return { intent, resolvedTokens, patterns, restatedIntent, trace };
}

module.exports = { run_retrieval_loop };

if (require.main === module) {
  (async () => {
    const buttonDanger = require('../fixtures/button-danger.json');
    const badgeBroken = require('../fixtures/badge-broken.json');

    for (const [label, fixture] of [['button-danger.json (clean)', buttonDanger], ['badge-broken.json (bad ref)', badgeBroken]]) {
      console.log(`\n=== ${label} ===`);
      const result = await run_retrieval_loop(fixture, 'react');
      for (const entry of result.trace) {
        console.log(`[${entry.step}]`, 'in:', entry.input, '-> out:', entry.output);
      }
    }
  })();
}
