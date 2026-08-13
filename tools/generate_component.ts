import type { RestatedIntent, PatternFile, GeneratedFile, GenerationResult } from './types.ts';

// Real generation call. Only reached when the caller explicitly opts in
// (loom.ts's `--live` CLI flag) — same discipline as tools/restate_intent.ts,
// and for the same reason: nothing in the existing regression suite, the
// GENERATION_MAP fixture path, or the demo chain should start silently
// costing money just because ANTHROPIC_API_KEY happens to be present in
// the shell.
//
// The prompt is the one hand-traced in traces/generator-prompt-trace.md,
// copy-pasted rather than reinvented. Consumes restatedIntent as its
// primary input, not raw intent + resolvedTokens passed separately —
// keeping prose out of the factual layer (see ADR 0011). pattern is passed
// through unfiltered/verbatim: restatement is scoped to prop/token
// vocabulary, not to a pattern file's structural conventions.

const SYSTEM_PROMPT = `You are generating a single component + Storybook story for an existing design system. You will be given:
  - restatedIntent: a checked paraphrase of the requested component, variant, content, and exact token refs/values to use — already verified to contain no invented and no dropped terms relative to the original tool output
  - pattern: one existing pattern/story file showing the prop-naming convention for this component type, passed through unfiltered

Hard constraints:
  - Use only the token refs/values named in restatedIntent. Do not introduce colors, radii, or spacing not present there, and do not write literal hex/px values in the output even if they happen to match a resolved value — reference the token, don't restate it.
  - Match the prop names shown in pattern exactly (e.g. if pattern uses \`state\` and \`size\`, do not invent \`variant\` or \`color\` for the same concept).
  - Output exactly two files, following pattern's story structure. Respond with ONLY the two files, each wrapped exactly like this, no other text and no markdown fences outside the blocks:

===FILE: <filename>===
<file content>
===END===

===FILE: <filename>===
<file content>
===END===`;

function parseFileBlocks(raw: string): Record<string, string> {
  const files: Record<string, string> = {};
  const regex = /===FILE: (.+?)===\n([\s\S]*?)\n===END===/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    files[match[1].trim()] = match[2];
  }
  if (Object.keys(files).length === 0) {
    throw new Error(`generateComponent: could not parse any files from model output:\n${raw}`);
  }
  return files;
}

interface GenerateComponentArgs {
  restatedIntent: RestatedIntent;
  pattern: PatternFile;
}

async function generateComponent({ restatedIntent, pattern }: GenerateComponentArgs): Promise<GenerationResult> {
  const { callAnthropic } = require('./anthropic_client.ts');

  const userPayload = {
    restatedIntent,
    pattern: { filename: pattern.filename, source: pattern.source },
  };

  const raw: string = await callAnthropic({
    system: SYSTEM_PROMPT,
    user: `${JSON.stringify(userPayload, null, 2)}\n\nRequest: generate the component and story file for this intent.`,
    model: 'claude-sonnet-5', // the one stage where judgment belongs — not the cheap/small model used for restatement
    maxTokens: 2048,
  });

  const files = parseFileBlocks(raw);
  const entries = Object.entries(files);
  const storiesEntry = entries.find(([filename]) => /\.stories\.|stories\.ts/i.test(filename));
  const componentEntry = entries.find(([filename]) => filename !== storiesEntry?.[0]);

  if (!componentEntry) {
    throw new Error(`generateComponent: could not identify a component file among: ${entries.map(([f]) => f).join(', ')}`);
  }

  const result: GenerationResult = {
    componentFile: { filename: componentEntry[0], content: componentEntry[1] },
    storiesFile: storiesEntry ? { filename: storiesEntry[0], content: storiesEntry[1] } : null,
  };
  return result;
}

module.exports = { generateComponent, parseFileBlocks };

if (require.main === module) {
  // Run for real: feed button-danger.json, get back Button.tsx +
  // Button.stories.tsx written to disk under generated/live/.
  // Requires ANTHROPIC_API_KEY; this file is never invoked as part of any
  // other script's default path (see the file header).
  (async () => {
    const fs: typeof import('fs') = require('fs');
    const path: typeof import('path') = require('path');
    const { run_retrieval_loop } = require('./run_retrieval_loop.ts');

    const buttonDanger = require('../fixtures/button-danger.json');
    const { resolvedTokens, patterns, restatedIntent } = await run_retrieval_loop(buttonDanger, 'react', { live: true });

    console.log('restatedIntent:', restatedIntent);
    if (restatedIntent && 'needsClarification' in restatedIntent && restatedIntent.needsClarification) {
      console.log('Model asked for clarification instead of guessing:', restatedIntent.question);
      return;
    }

    const { componentFile, storiesFile }: { componentFile: GeneratedFile; storiesFile: GeneratedFile | null } =
      await generateComponent({ restatedIntent, pattern: patterns[0] });

    const outDir = path.join(__dirname, '..', 'generated', 'live');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, componentFile.filename), componentFile.content);
    console.log(`Wrote generated/live/${componentFile.filename}`);
    if (storiesFile) {
      fs.writeFileSync(path.join(outDir, storiesFile.filename), storiesFile.content);
      console.log(`Wrote generated/live/${storiesFile.filename}`);
    }

    const { critique } = require('./critic.ts');
    const criticResult = critique(componentFile.content, { resolvedTokens });
    console.log('critic:', JSON.stringify(criticResult, null, 2));

    const { runGate } = require('./gate.ts');
    const tokensJson = require('../tokens.json');
    const gateResult = runGate(componentFile.content, tokensJson, 'Button');
    console.log('gate:', JSON.stringify(gateResult, null, 2));
  })().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
