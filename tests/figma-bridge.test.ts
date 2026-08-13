// Unit coverage for figma-bridge's mock adapter (the active Phase 1
// implementation) and the intentionally-unwired Phase 2 stub — see
// figma-bridge/README.md and ADR 0012.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { MockFigmaBridgeClient, RemoteFigmaBridgeClient, createFigmaBridgeClient } = require('../figma-bridge/src/client.ts');
const { MOCK_NODE_REF, MOCK_METADATA, MOCK_CODE, MOCK_SCREENSHOT } = require('../figma-bridge/src/mockData.ts');

test('MockFigmaBridgeClient.getMetadata resolves the fixture metadata', async () => {
  const result = await new MockFigmaBridgeClient().getMetadata(MOCK_NODE_REF);
  assert.deepEqual(result, MOCK_METADATA);
});

test('MockFigmaBridgeClient.getCode resolves the fixture code result', async () => {
  const result = await new MockFigmaBridgeClient().getCode(MOCK_NODE_REF);
  assert.deepEqual(result, MOCK_CODE);
});

test('MockFigmaBridgeClient.getScreenshot resolves the fixture screenshot result', async () => {
  const result = await new MockFigmaBridgeClient().getScreenshot(MOCK_NODE_REF);
  assert.deepEqual(result, MOCK_SCREENSHOT);
});

test('MockFigmaBridgeClient.cloneUrlToCanvas echoes sourceUrl and reports complete', async () => {
  const sourceUrl = 'http://localhost:6006/?path=/story/reviewcard';
  const result = await new MockFigmaBridgeClient().cloneUrlToCanvas(sourceUrl);
  assert.equal(result.sourceUrl, sourceUrl);
  assert.equal(result.status, 'complete');
  assert.ok(result.createdNode.nodeId);
});

test('RemoteFigmaBridgeClient: all four methods reject with the "not yet wired" error, not throw', async () => {
  const client = new RemoteFigmaBridgeClient();
  await assert.rejects(() => client.getMetadata(MOCK_NODE_REF), /not yet wired/);
  await assert.rejects(() => client.getCode(MOCK_NODE_REF), /not yet wired/);
  await assert.rejects(() => client.getScreenshot(MOCK_NODE_REF), /not yet wired/);
  await assert.rejects(() => client.cloneUrlToCanvas('http://localhost:6006'), /not yet wired/);
});

test('createFigmaBridgeClient: defaults to the mock adapter', () => {
  assert.ok(createFigmaBridgeClient() instanceof MockFigmaBridgeClient);
});
