#!/usr/bin/env node
// Bridge server. Storybook addon panels run in the browser and can't
// `require('fs')`/`require('child_process')` directly — this small local
// server is the bridge between the panel (browser, EventSource) and
// loom.js's real Node-side pipeline (the same generate() function the CLI
// uses, not a second implementation — see ADR 0002).
//
// Plain-language parsing here is a small, deterministic keyword matcher,
// not a live model call. It only recognizes the vocabulary this project's
// fixtures actually have; anything else falls through to a clear "don't
// understand" error, never a guess.

const http = require('http');
const { URL } = require('url');
const { generate } = require('./loom');

const PORT = process.env.LOOM_BRIDGE_PORT || 4178;

const KNOWN_COMPONENTS = ['button', 'alert', 'badge', 'chip'];
const KNOWN_VARIANTS = ['danger', 'info', 'broken', 'alert'];
const KNOWN_FRAMEWORKS = ['react', 'angular'];

function parsePrompt(prompt) {
  const lower = prompt.toLowerCase();
  const component = KNOWN_COMPONENTS.find((c) => new RegExp(`\\b${c}\\b`).test(lower));
  const variant = KNOWN_VARIANTS.find((v) => new RegExp(`\\b${v}\\b`).test(lower));
  const framework = KNOWN_FRAMEWORKS.find((f) => new RegExp(`\\b${f}\\b`).test(lower));
  return { component, variant, framework };
}

function sseWrite(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

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
      // free, pre-built fixture path; --live is CLI-only for now (loom.js),
      // a deliberate scope line so browsing the panel never has a cost.
      onTrace: (line) => sseWrite(res, { type: 'trace', line }),
      // No resolveAmbiguity passed — SSE is one-directional; ambiguity
      // ends the stream with a clarifying message instead of guessing.
    });
    sseWrite(res, { type: 'done', result });
  } catch (err) {
    sseWrite(res, { type: 'error', message: err.message });
  }
  res.end();
});

server.listen(PORT, () => {
  console.log(`LOOM bridge server listening on http://localhost:${PORT}`);
});

module.exports = { parsePrompt };
