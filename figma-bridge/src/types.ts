/**
 * figma-bridge/types.ts
 *
 * Type shapes modeled on what the Figma MCP server's tools return
 * (get_code, get_variable_defs, get_screenshot, get_metadata, etc.)
 * as of the Feb 2026 Code-to-Canvas update.
 *
 * Phase 1 goal: define the CONTRACT first, so mocks and the eventual
 * live client are interchangeable behind the same interface.
 */

export type FigmaNodeType =
  | "FRAME"
  | "COMPONENT"
  | "COMPONENT_SET"
  | "INSTANCE"
  | "TEXT"
  | "GROUP"
  | "VECTOR";

export interface FigmaNodeRef {
  fileKey: string;
  nodeId: string;
  url: string;
}

export interface FigmaVariable {
  id: string;
  name: string;
  /** e.g. "color", "spacing", "radius", "typography" */
  collection: string;
  /** resolved value for the current mode (light/dark/etc.) */
  value: string | number;
  mode: string;
}

export interface FigmaComponentToken {
  key: string;
  name: string;
  description?: string;
  /** Code Connect mapping, if present (Org/Enterprise tier only) */
  codeConnectPath?: string;
}

export interface FigmaLayoutNode {
  id: string;
  name: string;
  type: FigmaNodeType;
  /** px */
  width: number;
  height: number;
  x: number;
  y: number;
  children?: FigmaLayoutNode[];
  variables?: string[]; // FigmaVariable ids referenced by this node
}

export interface FigmaMetadataResult {
  node: FigmaNodeRef;
  layout: FigmaLayoutNode;
  variables: FigmaVariable[];
  components: FigmaComponentToken[];
}

export interface FigmaCodeResult {
  node: FigmaNodeRef;
  /** Generated code stub — mocked as plain markup/JSX string in Phase 1 */
  code: string;
  language: "tsx" | "jsx" | "html";
}

export interface FigmaScreenshotResult {
  node: FigmaNodeRef;
  /** data URL or asset path — mocked as a placeholder path in Phase 1 */
  assetUrl: string;
  width: number;
  height: number;
}

export interface CodeToCanvasResult {
  sourceUrl: string;
  createdNode: FigmaNodeRef;
  status: "queued" | "rendering" | "complete" | "error";
}

/**
 * The bridge contract. Both the mock adapter (Phase 1) and the real
 * MCP-backed adapter (Phase 2+) implement this same interface, so
 * LOOM / Storybook code never has to know which one it's talking to.
 */
export interface FigmaBridgeClient {
  getMetadata(node: FigmaNodeRef): Promise<FigmaMetadataResult>;
  getCode(node: FigmaNodeRef): Promise<FigmaCodeResult>;
  getScreenshot(node: FigmaNodeRef): Promise<FigmaScreenshotResult>;
  /** "Code to Canvas": clone a running UI URL into an editable Figma frame */
  cloneUrlToCanvas(sourceUrl: string): Promise<CodeToCanvasResult>;
}
