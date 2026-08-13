import type {
  FigmaMetadataResult,
  FigmaCodeResult,
  FigmaScreenshotResult,
  FigmaNodeRef,
} from "./types.ts";

/**
 * figma-bridge/mockData.ts
 *
 * Hand-authored fixtures shaped like real Figma MCP tool output.
 * These stand in for a live "PR Review Ops Dashboard" card component
 * until Phase 2 swaps in one real pulled response.
 */

const MOCK_NODE_REF: FigmaNodeRef = {
  fileKey: "MOCK_FILE_KEY",
  nodeId: "12:345",
  url: "https://www.figma.com/design/MOCK_FILE_KEY/LOOM-Design-System?node-id=12-345",
};

const MOCK_METADATA: FigmaMetadataResult = {
  node: MOCK_NODE_REF,
  layout: {
    id: "12:345",
    name: "ReviewCard",
    type: "COMPONENT",
    width: 320,
    height: 140,
    x: 0,
    y: 0,
    variables: ["var:color-surface", "var:radius-md", "var:space-4"],
    children: [
      {
        id: "12:346",
        name: "Title",
        type: "TEXT",
        width: 280,
        height: 24,
        x: 20,
        y: 20,
      },
      {
        id: "12:347",
        name: "SeverityBadge",
        type: "INSTANCE",
        width: 80,
        height: 28,
        x: 20,
        y: 56,
        variables: ["var:color-danger"],
      },
    ],
  },
  variables: [
    {
      id: "var:color-surface",
      name: "color/surface/default",
      collection: "color",
      value: "#FFFFFF",
      mode: "light",
    },
    {
      id: "var:color-danger",
      name: "color/status/danger",
      collection: "color",
      value: "#D64545",
      mode: "light",
    },
    {
      id: "var:radius-md",
      name: "radius/md",
      collection: "radius",
      value: 8,
      mode: "default",
    },
    {
      id: "var:space-4",
      name: "space/4",
      collection: "spacing",
      value: 16,
      mode: "default",
    },
  ],
  components: [
    {
      key: "comp:review-card",
      name: "ReviewCard",
      description: "Card used in the PR Review Ops Dashboard finding list.",
      // codeConnectPath intentionally omitted — Code Connect requires
      // Org/Enterprise tier, not available in Phase 1/2.
    },
  ],
};

const MOCK_CODE: FigmaCodeResult = {
  node: MOCK_NODE_REF,
  language: "tsx",
  code: `export function ReviewCard({ title, severity }: { title: string; severity: "low" | "medium" | "high" }) {
  return (
    <div className="rounded-md bg-surface p-4">
      <h3>{title}</h3>
      <SeverityBadge level={severity} />
    </div>
  );
}`,
};

const MOCK_SCREENSHOT: FigmaScreenshotResult = {
  node: MOCK_NODE_REF,
  assetUrl: "/mock-assets/review-card.png",
  width: 320,
  height: 140,
};

module.exports = { MOCK_NODE_REF, MOCK_METADATA, MOCK_CODE, MOCK_SCREENSHOT };
