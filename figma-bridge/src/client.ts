import type {
  FigmaBridgeClient,
  FigmaNodeRef,
  FigmaMetadataResult,
  FigmaCodeResult,
  FigmaScreenshotResult,
  CodeToCanvasResult,
} from "./types.ts";
const { MOCK_METADATA, MOCK_CODE, MOCK_SCREENSHOT } = require("./mockData.ts");

/**
 * figma-bridge/client.ts
 *
 * MockFigmaBridgeClient: Phase 1. Returns fixture data shaped exactly
 * like real MCP tool output, with a simulated network delay so
 * loading states in Storybook/LOOM behave realistically.
 *
 * RemoteFigmaBridgeClient: Phase 2 stub. Same interface — swapping
 * one for the other at the call site is the whole point of the
 * FigmaBridgeClient contract in types.ts.
 */

const SIMULATED_LATENCY_MS = 350;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

class MockFigmaBridgeClient implements FigmaBridgeClient {
  async getMetadata(_node: FigmaNodeRef): Promise<FigmaMetadataResult> {
    return delay(MOCK_METADATA);
  }

  async getCode(_node: FigmaNodeRef): Promise<FigmaCodeResult> {
    return delay(MOCK_CODE);
  }

  async getScreenshot(_node: FigmaNodeRef): Promise<FigmaScreenshotResult> {
    return delay(MOCK_SCREENSHOT);
  }

  async cloneUrlToCanvas(sourceUrl: string): Promise<CodeToCanvasResult> {
    return delay({
      sourceUrl,
      createdNode: {
        fileKey: "MOCK_FILE_KEY",
        nodeId: "99:001",
        url: "https://www.figma.com/design/MOCK_FILE_KEY/LOOM-Design-System?node-id=99-001",
      },
      status: "complete",
    });
  }
}

/**
 * Phase 2: replace this with a real implementation that calls the
 * Figma remote MCP server (https://mcp.figma.com or the configured
 * client-side MCP connector). Left unimplemented here on purpose —
 * this file is the seam where "mocked in spirit" becomes "live",
 * without touching any calling code.
 */
const NOT_WIRED = "RemoteFigmaBridgeClient not yet wired — Phase 2. See figma-bridge README.";

class RemoteFigmaBridgeClient implements FigmaBridgeClient {
  getMetadata(_node: FigmaNodeRef): Promise<FigmaMetadataResult> {
    return Promise.reject(new Error(NOT_WIRED));
  }
  getCode(_node: FigmaNodeRef): Promise<FigmaCodeResult> {
    return Promise.reject(new Error(NOT_WIRED));
  }
  getScreenshot(_node: FigmaNodeRef): Promise<FigmaScreenshotResult> {
    return Promise.reject(new Error(NOT_WIRED));
  }
  cloneUrlToCanvas(_sourceUrl: string): Promise<CodeToCanvasResult> {
    return Promise.reject(new Error(NOT_WIRED));
  }
}

/**
 * Single point of truth for which adapter is active. Phase 1 hardcodes
 * mock; Phase 2 swaps this based on an env flag (e.g. FIGMA_BRIDGE_MODE).
 */
function createFigmaBridgeClient(): FigmaBridgeClient {
  return new MockFigmaBridgeClient();
}

module.exports = { MockFigmaBridgeClient, RemoteFigmaBridgeClient, createFigmaBridgeClient };
