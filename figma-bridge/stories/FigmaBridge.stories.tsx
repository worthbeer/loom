import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "./storybook-types";
import type {
  FigmaMetadataResult,
  FigmaCodeResult,
  CodeToCanvasResult,
} from "../src/types";
import { ReviewCard } from "../src/ReviewCard";

// require(), not a static import — client.ts/mockData.ts are CommonJS
// (see tools/read_figma_node.ts for the same convention), so their
// exports aren't statically visible to `import { x } from`.
const { createFigmaBridgeClient } = require("../src/client.ts");
const { MOCK_NODE_REF } = require("../src/mockData.ts");

/**
 * These stories exist to demo the FIGMA MCP integration structurally —
 * "in spirit" — using the mock adapter from figma-bridge/client.ts.
 * Phase 2 swaps createFigmaBridgeClient() to the remote adapter and
 * every story below should keep working unmodified.
 */

const meta: Meta = {
  title: "Integrations/Figma Bridge (Mocked)",
};
export default meta;

/** 1. Metadata round-trip: fetch tokens/layout, render the real component from them */
export const MetadataToComponent: StoryObj = {
  render: () => {
    const [metadata, setMetadata] = useState<FigmaMetadataResult | null>(null);

    useEffect(() => {
      createFigmaBridgeClient().getMetadata(MOCK_NODE_REF).then(setMetadata);
    }, []);

    if (!metadata) return <p>Loading Figma metadata (mocked)…</p>;

    return (
      <div>
        <p style={{ fontFamily: "monospace", fontSize: 12, color: "#6B7280" }}>
          node: {metadata.node.nodeId} · {metadata.variables.length} variables ·{" "}
          {metadata.components.length} component(s)
        </p>
        <ReviewCard title="Missing null check on line 42" severity="high" />
      </div>
    );
  },
};

/** 2. Generated code preview — what get_code would hand back */
export const GeneratedCodePreview: StoryObj = {
  render: () => {
    const [code, setCode] = useState<string>("Loading…");

    useEffect(() => {
      createFigmaBridgeClient()
        .getCode(MOCK_NODE_REF)
        .then((res: FigmaCodeResult) => setCode(res.code));
    }, []);

    return (
      <pre
        style={{
          background: "#0B1020",
          color: "#D6E2FF",
          padding: 16,
          borderRadius: 8,
          fontSize: 13,
          overflowX: "auto",
        }}
      >
        {code}
      </pre>
    );
  },
};

/** 3. Code-to-Canvas simulation — clone a running Storybook URL into Figma */
export const CloneToCanvas: StoryObj = {
  render: () => {
    const [result, setResult] = useState<CodeToCanvasResult | null>(null);
    const [pending, setPending] = useState(false);

    const handleClone = () => {
      setPending(true);
      createFigmaBridgeClient()
        .cloneUrlToCanvas("http://localhost:6006/?path=/story/reviewcard")
        .then((res: CodeToCanvasResult) => {
          setResult(res);
          setPending(false);
        });
    };

    return (
      <div>
        <button onClick={handleClone} disabled={pending}>
          {pending ? "Cloning…" : "Clone this story into Figma"}
        </button>
        {result && (
          <p style={{ marginTop: 12, fontFamily: "monospace", fontSize: 12 }}>
            status: {result.status} → new node {result.createdNode.nodeId}
          </p>
        )}
      </div>
    );
  },
};
