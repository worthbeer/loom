# Architecture Decision Records

Each file here records one architectural decision: the context that forced
it, what was decided, and the consequences — including tradeoffs accepted,
not just benefits. Records are immutable once accepted; a changed decision
gets a new record that supersedes the old one, rather than an edit that
erases why the original choice was made.

| # | Decision |
|---|---|
| [0001](0001-agentic-not-attached.md) | Agentic library, not attached |
| [0002](0002-one-pipeline-two-entry-points.md) | One pipeline, two entry points |
| [0003](0003-storybook-render-substrate.md) | Storybook is the render substrate, not replaced |
| [0004](0004-mock-figma-input-honestly.md) | Mock Figma input structurally, disclose the boundary |
| [0005](0005-reuse-github-landing-pipeline.md) | Reuse the existing GitHub landing pipeline |
| [0006](0006-generator-critic-split.md) | Generator and critic are separate, independent calls |
| [0007](0007-deterministic-gate-is-authority.md) | The deterministic gate is the pass/fail authority |
| [0008](0008-never-auto-merge.md) | Never auto-merge |
| [0009](0009-explicit-framework-routing.md) | Framework/brand routing is explicit; ambiguity halts and asks |
| [0010](0010-consumer-driven-registry.md) | Registry choice is driven by consumer, not tooling novelty |
| [0011](0011-restatement-is-a-checkpoint.md) | Restatement is a comprehension checkpoint, not ground truth |
| [0012](0012-figma-bridge-is-a-disclosed-seam.md) | figma-bridge is a disclosed seam, not a live integration |
| [0013](0013-pr-landing-requires-explicit-opt-in.md) | PR landing requires explicit opt-in, mirroring --live's discipline |
