// restate_intent. Stubbed by default (returns null), and only makes a
// real Anthropic call when explicitly asked via the `live` option. This is
// deliberate: the free regression suite (tools/run_retrieval_loop.js's own
// self-test, tools/critic.js's self-test, the fixture regression sweep in
// generated/) must keep working with zero network calls and zero cost,
// whether or not ANTHROPIC_API_KEY happens to be set in the shell. Live
// mode is only reached by an explicit caller decision (loom.js's `--live`
// CLI flag), never by ambient environment state alone.
//
// When live, this is the prompt hand-traced in
// traces/restate-intent-trace.md, copy-pasted rather than
// reinvented — that trace was written specifically to be the starting
// point once this got wired for real.
//
// Interface: given the retrieval loop's raw output, produce a restatement
// that uses only the prop/token names actually present in `intent`,
// `resolvedTokens`, and `patterns` — no invented terms, and no silent
// omission of any of them either (both checks required — see ADR 0011).
// When it can't attribute a value confidently, it must surface a question
// rather than guess (see chip-dual-red.json in fixtures/README.md for the
// ambiguity case this is tested against).
// Returns `{ restatement: string }` or `{ needsClarification: true,
// question: string }` when live; `null` when stubbed.
//
// This function's output is a checkpoint for the generator's benefit, not a
// new source of ground truth — critic.js intentionally does not accept a
// restatedIntent parameter at all, so there is no way for it to read this
// output even by accident. That's ADR 0011, enforced structurally rather
// than by convention.

const SYSTEM_PROMPT = `You are a comprehension checkpoint in a component-generation pipeline. You will be given the raw output of three retrieval tools: intent (component + variant), resolvedTokens (token ref -> value), and patterns (existing example files showing prop-naming convention).

Paraphrase the build target back using ONLY the vocabulary already present in that input. Two hard requirements, both mandatory:
1. No invented terms — every prop name and token ref you mention must appear verbatim in the input. Do not introduce a token, prop, or value that isn't already there.
2. No silent omission — every token ref in resolvedTokens and every prop in intent.variant must be referenced somewhere in your restatement. Do not collapse two distinct token refs into one vague description (e.g. two different reds both called "red").

If you cannot confidently attribute every token to its correct role (e.g. which one is fill vs. border) from the input alone, do not guess — respond with needsClarification instead.

Respond with ONLY a JSON object, no other text, no markdown fences: either {"restatement": string} or {"needsClarification": true, "question": string}.`;

async function restate_intent({ intent, resolvedTokens, patterns, live = false }) {
  if (!live) {
    return null; // stubbed — see traces/restate-intent-trace.md for real behavior
  }

  const { callAnthropic, stripCodeFences } = require('./anthropic_client');
  const userPayload = {
    intent,
    resolvedTokens,
    patterns: patterns.map((p) => ({ filename: p.filename, source: p.source })),
  };

  const raw = await callAnthropic({
    system: SYSTEM_PROMPT,
    user: JSON.stringify(userPayload, null, 2),
    model: 'claude-haiku-4-5-20251001', // small, cheap, non-creative — matches this stage's own description
    maxTokens: 512,
  });

  let parsed;
  try {
    parsed = JSON.parse(stripCodeFences(raw));
  } catch {
    throw new Error(`restate_intent: model did not return valid JSON:\n${raw}`);
  }
  return parsed;
}

module.exports = { restate_intent };
