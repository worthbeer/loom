import React from "react";

export type Severity = "low" | "medium" | "high";

const severityColor: Record<Severity, string> = {
  low: "#6B7280",
  medium: "#D97706",
  high: "#D64545",
};

/**
 * This component intentionally mirrors the mocked Figma node
 * (MOCK_METADATA in mockData.ts) field-for-field, so the story can
 * demonstrate "design tokens in → rendered component out" even
 * without a live Figma connection.
 */
export function ReviewCard({
  title,
  severity,
}: {
  title: string;
  severity: Severity;
}) {
  return (
    <div
      style={{
        width: 320,
        borderRadius: 8,
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        padding: 16,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
      <span
        style={{
          display: "inline-block",
          marginTop: 12,
          padding: "4px 10px",
          borderRadius: 6,
          fontSize: 12,
          color: "#FFF",
          background: severityColor[severity],
        }}
      >
        {severity.toUpperCase()}
      </span>
    </div>
  );
}
