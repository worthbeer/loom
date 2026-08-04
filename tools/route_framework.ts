import type { RouteResult } from './types.ts';

interface RouteRequest {
  framework?: string;
}

interface RoutePayload {
  targetPlatform?: string;
}

// Framework routing is explicit and inspectable, never silently inferred
// inside the generation prompt (see ADR 0009). Priority order, no
// exceptions: explicit request flag -> payload hint -> ambiguous.
// Ambiguous means stop and ask, never default silently.
function routeFramework(request: RouteRequest | undefined, payload: RoutePayload | undefined): RouteResult {
  if (request && request.framework) {
    return { framework: request.framework, source: 'explicit' };
  }
  if (payload && payload.targetPlatform) {
    return { framework: payload.targetPlatform, source: 'payload' };
  }
  return { framework: null, source: 'ambiguous', needsClarification: true };
}

module.exports = { routeFramework };

if (require.main === module) {
  const buttonDanger = require('../fixtures/button-danger.json');
  const buttonDangerAngularHint = require('../fixtures/button-danger-angular-hint.json');

  console.log('Explicit flag test:', routeFramework({ framework: 'react' }, buttonDanger));
  console.log('Payload-inferred test:', routeFramework({}, buttonDangerAngularHint));
  console.log('Ambiguous test:', routeFramework({}, buttonDanger));
}
