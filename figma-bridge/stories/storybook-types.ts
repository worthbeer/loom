/**
 * figma-bridge/stories/storybook-types.ts
 *
 * Minimal shape of the two Storybook CSF types these stories need
 * (`Meta`, `StoryObj`), modeled on `@storybook/react`'s public types.
 * Loom has no Storybook runtime dependency (see figma-bridge/README.md
 * and ADR 0004's disclosed-mock pattern) — this shim exists so the story
 * file type-checks against the real CSF shape without requiring the
 * actual package to be installed.
 */
import type { ReactElement } from "react";

export interface Meta {
  title: string;
}

export interface StoryObj {
  render: () => ReactElement;
}
