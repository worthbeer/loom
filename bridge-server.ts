#!/usr/bin/env node
// Bridge server. Storybook addon panels run in the browser and can't
// `require('fs')`/`require('child_process')` directly — this small local
// server is the bridge between the panel (browser, EventSource) and
// loom.ts's real Node-side pipeline (the same generate() function the CLI
// uses, not a second implementation — see ADR 0002).
//
// Plain-language parsing here is a small, deterministic keyword matcher,
// not a live model call. It only recognizes the vocabulary this project's
// fixtures actually have; anything else falls through to a clear "don't
// understand" error, never a guess.

import type { IncomingMessage, ServerResponse } from 'http';

const http: typeof import('http') = require('http');
const { URL }: typeof import('url') = require('url');
const { generate } = require('./loom.ts');

const PORT = Number(process.env.LOOM_BRIDGE_PORT) || 4178;

const KNOWN_COMPONENTS = ['button', 'alert', 'badge', 'chip'];
const KNOWN_VARIANTS = ['danger', 'info', 'broken', 'alert'];
const KNOWN_FRAMEWORKS = ['react', 'angular'];

interface ParsedPrompt {
  component?: string;
  variant?: string;
  framework?: string;
}

function parsePrompt(prompt: string): ParsedPrompt {
  const lower = prompt.toLowerCase();
  const component = KNOWN_COMPONENTS.find((c) => new RegExp(`\\b${c}\\b`).test(lower));
  const variant = KNOWN_VARIANTS.find((v) => new RegExp(`\\b${v}\\b`).test(lower));
  const framework = KNOWN_FRAMEWORKS.find((f) => new RegExp(`\\b${f}\\b`).test(lower));
  return { component, variant, framework };
}

function sseWrite(res: ServerResponse, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url || '', `http://localhost:${PORT}`);

  // CORS: Storybook's manager/panel is served from a different port.
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (url.pathname !== '/generate-stream') {
    res.writeHead(404);
    res.end();
    return;
  }

  const prompt = url.searchParams.get('prompt') || '';
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const { component, variant, framework } = parsePrompt(prompt);
  // openPr defaults to false — same opt-in discipline as loom.ts's
  // --open-pr (ADR 0013): browsing the panel never touches a real repo
  // unless the caller explicitly asks it to.
  const openPr = url.searchParams.get('openPr') === 'true';
  sseWrite(res, {
    type: 'trace',
    line: `Parsed request: component=${component || '?'}, variant=${variant || '?'}, framework=${framework || '(none given — will route)'}`,
  });

  if (!component || !variant) {
    sseWrite(res, {
      type: 'error',
      message: `Could not recognize a component/variant in "${prompt}". Known components: ${KNOWN_COMPONENTS.join(', ')}. Known variants: ${KNOWN_VARIANTS.join(', ')}.`,
    });
    res.end();
    return;
  }

  try {
    const result = await generate({
      component,
      variant,
      framework,
      // live defaults to false (not passed) — the panel always uses the
      // free, pre-built fixture path; --live is CLI-only for now (loom.ts),
      // a deliberate scope line so browsing the panel never has a cost.
      openPr,
      onTrace: (line: string) => sseWrite(res, { type: 'trace', line }),
      // No resolveAmbiguity passed — SSE is one-directional; ambiguity
      // ends the stream with a clarifying message instead of guessing.
    });
    sseWrite(res, { type: 'done', result });
  } catch (err) {
    sseWrite(res, { type: 'error', message: (err as Error).message });
  }
  res.end();
});

server.listen(PORT, () => {
  console.log(`LOOM bridge server listening on http://localhost:${PORT}`);
});

module.exports = { parsePrompt };
