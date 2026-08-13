import type { Intent, PatternFile, ResolvedTokens, CriticResult, CriticViolation } from './types.ts';

// Re-parses the generated code itself — never trusts the generator's own
// claim about what it did. critique() checks the mechanical,
// pattern-matchable half of the critic's job (see
// traces/generator-prompt-trace.md) and always runs. The semantic
// `matches_intent` half is critiqueSemantic(), below — genuinely needs a
// model call, live-gated the same as restatement/generation (ADR 0014).
//
// Neither function accepts a restatedIntent parameter at all (see
// tools/restate_intent.ts) — not an oversight, this is how the rule that
// the critic must never read the restatement as ground truth (ADR 0011)
// is enforced: there's no parameter to misuse.

function critique(source: string, { resolvedTokens }: { resolvedTokens: ResolvedTokens }): CriticResult {
  const valueToRef: Record<string, string> = {};
  for (const [ref, result] of Object.entries(resolvedTokens)) {
    if (result.found && result.value !== null) valueToRef[result.value] = ref;
  }

  const violations: CriticViolation[] = [];
  const literalPattern = /#[0-9A-Fa-f]{6}\b|\b\d+px\b/g;
  let match: RegExpExecArray | null;
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

// critiqueSemantic: the model-shaped half ADR 0006 always said this needed
// — does the generated source actually match what was asked for, not just
// pass the mechanical rules above? Live-gated exactly like
// tools/restate_intent.ts and tools/generate_component.ts (`live` default
// false -> null, no network call, zero cost/behavior change on the default
// path). Re-derives against intent/resolvedTokens/patterns — the same
// ground truth critique() already uses — never against restatedIntent,
// which critique() doesn't even accept a parameter for (ADR 0011). See
// ADR 0014.
const SEMANTIC_SYSTEM_PROMPT = `You are an independent critic in a component-generation pipeline. You will be given the generated source for a component, and the ground truth it was supposed to be built from: intent (component + requested variant), resolvedTokens (token ref -> value, the only values the source may use), and patterns (existing example files showing this component's real prop-naming convention).

Judge only whether the generated source matches this ground truth — same component type, same variant expressed via the same prop names patterns establishes, using only tokens present in resolvedTokens. Do not judge code style, formatting, or anything not derivable from the given ground truth. Re-derive your judgment from intent/resolvedTokens/patterns directly; you are not given and must not assume any paraphrase of them was correct.

Respond with ONLY a JSON object, no other text, no markdown fences: {"matches_intent": boolean, "explanation": string}.`;

interface CritiqueSemanticArgs {
  source: string;
  intent: Intent;
  resolvedTokens: ResolvedTokens;
  patterns: PatternFile[];
  live?: boolean;
}

interface SemanticCritique {
  matches_intent: boolean;
  explanation: string;
}

async function critiqueSemantic({ source, intent, resolvedTokens, patterns, live = false }: CritiqueSemanticArgs): Promise<SemanticCritique | null> {
  if (!live) {
    return null; // stubbed — see critique()'s matches_intent: null on the default path
  }

  const { callAnthropic, stripCodeFences } = require('./anthropic_client.ts');
  const userPayload = {
    source,
    intent,
    resolvedTokens,
    patterns: patterns.map((p) => ({ filename: p.filename, source: p.source })),
  };

  const raw: string = await callAnthropic({
    system: SEMANTIC_SYSTEM_PROMPT,
    user: JSON.stringify(userPayload, null, 2),
    model: 'claude-sonnet-5', // a judgment call, same tier as generation — not the cheap paraphrase-check tier restatement uses
    maxTokens: 512,
  });

  let parsed: SemanticCritique;
  try {
    parsed = JSON.parse(stripCodeFences(raw));
  } catch {
    throw new Error(`critiqueSemantic: model did not return valid JSON:\n${raw}`);
  }
  return parsed;
}

module.exports = { critique, critiqueSemantic };

if (require.main === module) {
  (async () => {
    const fs: typeof import('fs') = require('fs');
    const path: typeof import('path') = require('path');
    const { run_retrieval_loop } = require('./run_retrieval_loop.ts');

    const buttonDanger = require('../fixtures/button-danger.json');
    const { resolvedTokens } = await run_retrieval_loop(buttonDanger, 'react');

    for (const variant of ['clean', 'drifted']) {
      const source = fs.readFileSync(path.join(__dirname, '..', 'generated', `Button.${variant}.tsx`), 'utf8');
      console.log(`\n=== Button.${variant}.tsx ===`);
      console.log(JSON.stringify(critique(source, { resolvedTokens }), null, 2));
    }
  })();
}
