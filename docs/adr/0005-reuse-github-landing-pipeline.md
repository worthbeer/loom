# 0005 — Reuse the existing GitHub landing pipeline

**Status:** Accepted

## Context
Landing a generated change needs branch creation, commits, a PR, and a
follow-up comment against a real repository. This mechanism — a capped
tool loop against the GitHub REST API — already exists, built and proven
in a prior project (a PR review automation tool), rather than needing to
be designed from scratch.

## Decision
Reuse that mechanism directly: `open_pr` performs the same sequence (get
ref → get tree → create blobs → create tree → create commit → create
branch → open PR → post comment) via the real Git Data API, re-skinned for
component generation instead of PR review.

## Consequences
- Landing is proven infrastructure, not new surface area to debug.
- Every PR opens as a draft by design (see 0008) — `draft: true` is
  hardcoded in `openPullRequest`, not a caller-supplied parameter.
