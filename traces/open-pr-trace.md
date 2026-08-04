# Hand-traced `open_pr` (button-danger.json → Button.tsx + Button.stories.tsx)

Originally hand-traced with no GitHub API call made, before `tools/open_pr.ts`
was wired for real. Endpoints, payload shapes, and response shapes below are
the real GitHub REST/Git Data API — structurally honest, same standard
applied to the Figma mock (ADR 0004). Written to be copy-pasteable as the
real implementation, which `tools/open_pr.ts` is based on.

Represents landing `generated/Button.clean.tsx` +
`generated/Button.clean.stories.tsx`, both gate-passed (`validate.ts`,
exit 0), critic-passed (`critic.ts`, `passed: true`, zero violations).

Using the Git Data API for an atomic two-file commit (see prior discussion:
avoids a branch left in a half-generated state if a call fails mid-sequence).

---

## 1. Get base branch's latest commit

```
GET /repos/{owner}/{repo}/git/ref/heads/main
```
```json
{ "ref": "refs/heads/main", "object": { "sha": "a1b2c3d", "type": "commit" } }
```

## 2. Get that commit's tree SHA

```
GET /repos/{owner}/{repo}/git/commits/a1b2c3d
```
```json
{ "sha": "a1b2c3d", "tree": { "sha": "e4f5a6b" } }
```

## 3. Create a blob per generated file

```
POST /repos/{owner}/{repo}/git/blobs
{ "content": "<base64 of Button.tsx source>", "encoding": "base64" }
```
```json
{ "sha": "blob-tsx-111" }
```
```
POST /repos/{owner}/{repo}/git/blobs
{ "content": "<base64 of Button.stories.tsx source>", "encoding": "base64" }
```
```json
{ "sha": "blob-stories-222" }
```

## 4. Create a new tree, based on the existing one, adding both files

```
POST /repos/{owner}/{repo}/git/trees
{
  "base_tree": "e4f5a6b",
  "tree": [
    { "path": "src/Button/Button.tsx", "mode": "100644", "type": "blob", "sha": "blob-tsx-111" },
    { "path": "src/Button/Button.stories.tsx", "mode": "100644", "type": "blob", "sha": "blob-stories-222" }
  ]
}
```
```json
{ "sha": "tree-333" }
```

## 5. Create the commit

```
POST /repos/{owner}/{repo}/git/commits
{
  "message": "loom: generate Button (danger/md)",
  "tree": "tree-333",
  "parents": ["a1b2c3d"]
}
```
```json
{ "sha": "commit-444" }
```

## 6. Create the branch, pointing straight at the new commit

Nothing touches `main` until this single call — every prior step only
created loose objects. A failure anywhere in steps 3–5 leaves orphaned
blobs/trees (harmless, GC'd), never a half-updated branch.

```
POST /repos/{owner}/{repo}/git/refs
{ "ref": "refs/heads/loom/button-danger-md", "sha": "commit-444" }
```
```json
{ "ref": "refs/heads/loom/button-danger-md", "object": { "sha": "commit-444" } }
```

## 7. Open the PR — always draft, no exceptions (decision #9)

```
POST /repos/{owner}/{repo}/pulls
{
  "title": "loom: generate Button (danger/md)",
  "head": "loom/button-danger-md",
  "base": "main",
  "draft": true
}
```
```json
{ "number": 128, "html_url": ".../pull/128", "draft": true }
```

## 8. Post the summary comment — built from this session's real critic/gate output

```
POST /repos/{owner}/{repo}/issues/128/comments
```
```json
{
  "body": "**Loom generation summary**\n\n- Source: `button-danger.json` (Button, state=danger, size=md)\n- Tokens used: `color/red/600` → `#C0392B`, `radius/sm` → `4px`\n- Pattern matched: `patterns/react/Button.stories.tsx`\n- Critic: passed, 0 violations, matches_intent not evaluated (regex critic — semantic check would need a model call, not run this trace)\n- Gate (`validate.ts`): passed, 0 violations (no-hardcoded-value, invented-reference — both clean)\n\nThis PR will not auto-merge under any condition. Gate re-runs as an actual CI check on this PR once CI is wired — this comment reflects a local run, not a CI-verified one, and that distinction should be visible in the real comment, not just known privately."
}
```

---

## What this trace deliberately does NOT claim

The comment body is explicit that `matches_intent` wasn't actually evaluated
— the critic never made a model call in this trace, so claiming a semantic
check happened would be exactly the kind of undisclosed mock/real blur
ADR 0004 rules out. Also explicit: this comment reflects a local run of
`validate.ts`, not a CI-verified run — gate-as-CI-check was, at the time
this trace was written, still a separate, unbuilt step. A real PR comment
conflating "I ran this on my machine" with "CI verified this" would be a
trust violation the exact same shape as the gate/critic distinction itself.
