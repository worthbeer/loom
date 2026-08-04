// Shared, minimal Anthropic Messages API client for the two real model-call
// stages (restate_intent, generate_component). No SDK dependency — the
// Messages API is a single POST, and pulling in a full SDK for one endpoint
// would be more surface area than this needs. Both callers gate on an
// explicit `live` flag before ever reaching this module (see
// tools/restate_intent.ts, tools/generate_component.ts) — importing this
// file does not by itself cause any network call or cost.

interface AnthropicContentBlock {
  type: string;
  text: string;
}

interface AnthropicMessagesResponse {
  content: AnthropicContentBlock[];
}

interface CallAnthropicArgs {
  system: string;
  user: string;
  model: string;
  maxTokens: number;
}

async function callAnthropic({ system, user, model, maxTokens }: CallAnthropicArgs): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Live model calls require it — see README.md\'s ' +
      '"What\'s real vs. stubbed" section.'
    );
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as AnthropicMessagesResponse;
  return data.content.map((block) => block.text).join('');
}

// Models wrap output in ```/```json fences fairly often even when told not
// to — a prompt instruction isn't a hard constraint the way the gate is.
// Strip a single leading/trailing fence rather than relying on compliance.
function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[\w-]*\n([\s\S]*?)\n```$/);
  return match ? match[1] : trimmed;
}

module.exports = { callAnthropic, stripCodeFences };
