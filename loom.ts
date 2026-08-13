#!/usr/bin/env node
// `loom generate` CLI. Wraps the retrieval loop -> restatement -> generation
// -> critic -> gate -> open_pr pipeline in one command, streaming the trace
// to the terminal as each step completes — the trace is never hidden behind
// "just show me the answer" (see ADR 0002).
//
// Two independent opt-ins, each chosen explicitly per run, neither keyed
// off ambient environment state:
//   - `--live` (requires ANTHROPIC_API_KEY): restate_intent and generation
//     both make real Anthropic API calls (tools/restate_intent.ts,
//     tools/generate_component.ts) instead of the zero-cost stub/fixture
//     path the regression suite and demo chain always run against.
//   - `--open-pr`: actually lands the result as a draft PR against the
//     real target repo (tools/open_pr.ts). Without it, generate() stops
//     after a passing gate — trace only, no GitHub call, no branch, no
//     PR (see ADR 0013). This is the same discipline as `--live`, applied
//     to the other side-effecting step: touching a real repo is never the
//     default just because the gate happened to pass.

import type { GateResult, CriticResult, ResolvedTokens } from './tools/types.ts';

const fs: typeof import('fs') = require('fs');
const path: typeof import('path') = require('path');
const readline: typeof import('readline') = require('readline');

const { routeFramework } = require('./tools/route_framework.ts');
const { run_retrieval_loop } = require('./tools/run_retrieval_loop.ts');
const { generateComponent } = require('./tools/generate_component.ts');
const { critique, critiqueSemantic } = require('./tools/critic.ts');
const { runGate } = require('./tools/gate.ts');
const { open_pr, openPullRequest, postComment, buildCommentBody, getToken } = require('./tools/open_pr.ts');

interface GenerationMapping {
  componentFile: string;
  storiesFile?: string;
}

// Pre-built, gate/critic-*tested* generated outputs, keyed by fixture then
// framework — the default (non-`--live`) generation path, so the free
// regression suite/demo chain keeps running on zero-cost, already-verified
// fixtures rather than a live model call every time. `--live` bypasses this
// table entirely in favor of tools/generate_component.ts. storiesFile is
// optional: not every mapped fixture needs one, particularly a
// deliberately-broken one that's never actually meant to reach open_pr
// (see 'badge-broken' below).
const GENERATION_MAP: Record<string, Record<string, GenerationMapping>> = {
  'button-danger': {
    react: {
      componentFile: 'generated/Button.clean.tsx',
      storiesFile: 'generated/Button.clean.stories.tsx',
    },
    angular: {
      componentFile: 'generated/Button.angular.clean.ts',
      storiesFile: 'generated/Button.angular.clean.stories.ts',
    },
  },
  // The deliberate-failure half of the demo chain. Deliberately invented
  // reference (color/red/999), isolated to gate rule 2 only.
  'badge-broken': {
    react: { componentFile: 'generated/Badge.broken.tsx' },
    angular: { componentFile: 'generated/Badge.angular.broken.ts' },
  },
};

interface FrameworkTarget {
  owner: string;
  repo: string;
  baseBranch: string;
  componentPath: (type: string) => string;
  storiesPath: (type: string) => string;
}

// Per-framework landing target. Each real app owns its own repo, base
// branch, and file-naming convention — Angular's is lowercase kebab-case
// (button.component.ts), React's is PascalCase (Button.tsx) — a real
// decision framework routing has to make (ADR 0009), not paper over with
// one shared naming scheme.
const FRAMEWORK_TARGETS: Record<string, FrameworkTarget> = {
  react: {
    owner: 'worthbeer',
    repo: 'ai-builder-styles',
    baseBranch: 'finished',
    componentPath: (type) => `frontend/app/components/${type}.tsx`,
    storiesPath: (type) => `frontend/app/components/${type}.stories.tsx`,
  },
  angular: {
    owner: 'worthbeer',
    repo: 'ai-builder-angular-styles',
    baseBranch: 'main',
    componentPath: (type) => `src/app/components/${type.toLowerCase()}.component.ts`,
    storiesPath: (type) => `src/app/components/${type.toLowerCase()}.stories.ts`,
  },
};

function defaultLog(line: string): void {
  console.log(`> ${line}`);
}

function promptFramework(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Framework ambiguous — which one? (react/angular): ', (answer: string) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

interface GenerateArgs {
  component: string;
  variant: string;
  framework?: string;
  live?: boolean;
  openPr?: boolean;
  onTrace?: (line: string) => void;
  resolveAmbiguity?: (() => Promise<string>) | null;
}

interface GenerateResult {
  gateResult: GateResult;
  criticResult: CriticResult;
  prUrl: string | null;
  componentType: string;
  variant: Record<string, string>;
}

// onTrace/resolveAmbiguity are injectable so the exact same pipeline has
// two entry points (ADR 0002): the CLI prints to the terminal and resolves
// ambiguity via an interactive stdin prompt; the bridge server (for the
// Storybook panel) streams the same lines as SSE events and, since SSE is
// one-directional, can't prompt mid-stream — it ends the stream on
// ambiguity instead, surfacing the question rather than guessing.
async function generate({ component, variant, framework: explicitFramework, live = false, openPr = false, onTrace = defaultLog, resolveAmbiguity = null }: GenerateArgs): Promise<GenerateResult> {
  const fixtureKey = `${component}-${variant}`;
  const fixturePath = path.join(__dirname, 'fixtures', `${fixtureKey}.json`);
  if (!fs.existsSync(fixturePath)) {
    const available = fs.readdirSync(path.join(__dirname, 'fixtures')).filter((f: string) => f.endsWith('.json'));
    throw new Error(`No fixture found for "${fixtureKey}". Available: ${available.join(', ')}`);
  }
  const payload = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  // Framework routing — explicit flag > payload hint > ambiguous, and
  // ambiguous means stop and ask, never default silently.
  let routing = routeFramework({ framework: explicitFramework }, payload);
  if (routing.needsClarification) {
    onTrace('Framework ambiguous — no explicit flag, no payload hint.');
    if (!resolveAmbiguity) {
      throw new Error('Framework ambiguous — please specify a framework (e.g. "...in React" or "...in Angular") and try again.');
    }
    const answer = await resolveAmbiguity();
    routing = routeFramework({ framework: answer }, payload);
    if (routing.needsClarification || !routing.framework) {
      throw new Error('No framework provided — aborting rather than defaulting silently.');
    }
  }
  onTrace(`Framework resolved: ${routing.framework} (source: ${routing.source})`);

  // Retrieval loop — real, deterministic, no model call. Restatement makes
  // a real Anthropic call when `live`, stub otherwise.
  const { intent, resolvedTokens, patterns, restatedIntent } = await run_retrieval_loop(payload, routing.framework, { live });
  const tokenSummary = Object.entries(resolvedTokens as ResolvedTokens)
    .map(([ref, r]) => (r.found ? `${ref} → ${r.value}` : `${ref} → NOT FOUND`))
    .join(', ');
  onTrace(`Reading tokens... ${tokenSummary}`);
  onTrace(`Reading existing patterns... found ${patterns.length ? patterns.map((p: { filename: string }) => p.filename).join(', ') : '(none)'}`);
  onTrace(`Restating intent... ${restatedIntent === null ? '(stubbed — see tools/restate_intent.ts)' : JSON.stringify(restatedIntent)}`);
  if (restatedIntent && 'needsClarification' in restatedIntent && restatedIntent.needsClarification) {
    throw new Error(`restate_intent asked for clarification instead of guessing: ${restatedIntent.question}`);
  }

  // Generation. `--live` calls the real model (tools/generate_component.ts);
  // default path reads a pre-built, already gate/critic-tested fixture from
  // GENERATION_MAP.
  let componentSource: string;
  let storiesSource: string | null;
  if (live) {
    if (!patterns[0]) {
      throw new Error(`Generating component... no pattern file found for "${intent.component}"/"${routing.framework}" to show the model the naming convention.`);
    }
    onTrace('Generating component... (live Anthropic call, see tools/generate_component.ts)');
    const { componentFile, storiesFile } = await generateComponent({ restatedIntent, pattern: patterns[0] });
    componentSource = componentFile.content;
    storiesSource = storiesFile ? storiesFile.content : null;
    onTrace(`Generated ${componentFile.filename}${storiesFile ? ` + ${storiesFile.filename}` : ''}`);
  } else {
    const mapping = GENERATION_MAP[fixtureKey]?.[routing.framework];
    if (!mapping) {
      const available = Object.entries(GENERATION_MAP)
        .flatMap(([key, byFramework]) => Object.keys(byFramework).map((fw) => `${key}:${fw}`))
        .join(', ');
      throw new Error(
        `Generating component... no pre-built generation mapped for "${fixtureKey}" + "${routing.framework}" yet ` +
        `(pass --live for a real model call instead — see traces/generator-prompt-trace.md). ` +
        `Currently mapped: ${available}.`
      );
    }
    onTrace('Generating component... (using pre-built, already gate/critic-tested output — pass --live for a real model call)');
    componentSource = fs.readFileSync(path.join(__dirname, mapping.componentFile), 'utf8');
    storiesSource = mapping.storiesFile
      ? fs.readFileSync(path.join(__dirname, mapping.storiesFile), 'utf8')
      : null;
  }

  // Critic — real, independent re-derivation from resolvedTokens, never
  // from restatedIntent (ADR 0011). Mechanical checks always run; the
  // semantic half (matches_intent) only makes a model call under --live,
  // same cost discipline as restatement/generation (ADR 0014).
  const criticResult: CriticResult = critique(componentSource, { resolvedTokens });
  if (live) {
    const semantic = await critiqueSemantic({ source: componentSource, intent, resolvedTokens, patterns, live });
    if (semantic) criticResult.matches_intent = semantic.matches_intent;
    onTrace(`Running critic (semantic)... matches_intent: ${criticResult.matches_intent} — ${semantic?.explanation ?? ''}`);
  }
  onTrace(`Running critic... ${criticResult.passed ? '✅ passed' : '❌ failed'}, ${criticResult.violations.length} violations`);

  // Gate — real, deterministic, the actual pass/fail authority.
  const tokensJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens.json'), 'utf8'));
  const componentType = intent.component;
  const gateResult: GateResult = runGate(componentSource, tokensJson, componentType);
  onTrace(`Running gate... ${gateResult.passed ? '✅ passed' : '❌ failed'}, ${gateResult.violations.length} violations`);
  if (!gateResult.passed) {
    onTrace('Gate failed — stopping here. Generated code is still available locally; no PR will be opened.');
    for (const v of gateResult.violations) onTrace(`  - ${v.rule}: ${v.detail}`);
    return { gateResult, criticResult, prUrl: null, componentType, variant: intent.variant };
  }

  // open_pr — for real, against the framework's real target repo. Gated on
  // --open-pr (ADR 0013): a passing gate is a precondition for landing,
  // never sufficient on its own to actually touch a real repo.
  if (!openPr) {
    onTrace('Gate passed. Not opening a PR — pass --open-pr to actually land this. (dry run)');
    return { gateResult, criticResult, prUrl: null, componentType, variant: intent.variant };
  }

  const target = FRAMEWORK_TARGETS[routing.framework];
  const branchName = `loom/${fixtureKey}-${routing.framework}-cli-${Date.now()}`;
  onTrace(`Opening PR... ${branchName} (draft)`);
  const { owner, repo, baseBranch } = target;
  await open_pr({
    owner,
    repo,
    baseBranch,
    newBranch: branchName,
    commitMessage: `loom: generate ${componentType} (${variant})`,
    files: [
      { path: target.componentPath(componentType), content: componentSource },
      ...(storiesSource ? [{ path: target.storiesPath(componentType), content: storiesSource }] : []),
    ],
  });
  const token = getToken();
  const pr = await openPullRequest(token, {
    owner,
    repo,
    title: `loom: generate ${componentType} (${variant})`,
    head: branchName,
    base: baseBranch,
  });
  const body = buildCommentBody({
    fixtureLabel: `${fixtureKey}.json`,
    intent,
    resolvedTokens,
    patternFilename: patterns[0] ? patterns[0].filename : '(none matched)',
    framework: routing.framework,
    criticResult,
    gateResult,
    decisionsWorthKeeping: null,
  });
  await postComment(token, { owner, repo, issueNumber: pr.number, body });

  return { gateResult, criticResult, prUrl: pr.html_url, componentType, variant: intent.variant };
}

const USAGE = 'Usage: node loom.ts generate <component> --variant=<x> [--framework=<react|angular>] [--live] [--open-pr]';

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] !== 'generate') {
    console.error(USAGE);
    process.exit(2);
  }
  const component = args[1];
  const flags: Record<string, string> = {};
  const live = args.includes('--live');
  const openPr = args.includes('--open-pr');
  for (const arg of args.slice(2)) {
    const match = arg.match(/^--([\w-]+)=(.*)$/);
    if (match) flags[match[1]] = match[2];
  }
  if (!component || !flags.variant) {
    console.error(USAGE);
    process.exit(2);
  }
  if (live && !process.env.ANTHROPIC_API_KEY) {
    console.error('--live requires ANTHROPIC_API_KEY to be set.');
    process.exit(2);
  }

  generate({ component, variant: flags.variant, framework: flags.framework, live, openPr, resolveAmbiguity: promptFramework })
    .then((result) => {
      console.log();
      console.log(`Summary: ${component} (${flags.variant}) — gate ${result.gateResult.passed ? 'passed' : 'FAILED'}`);
      if (result.prUrl) console.log(`PR: ${result.prUrl}`);
      process.exit(result.gateResult.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}

module.exports = { generate };
