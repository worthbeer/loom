// Real GitHub Git Data API calls. Implements steps 1-6 of
// traces/open-pr-trace.md: get base ref -> get base commit's
// tree -> create a blob per generated file -> create a new tree -> create
// the commit -> create the branch pointing at it. Nothing touches the base
// branch until the single ref-creation call in step 6 - every prior step
// only creates loose, harmless objects (GC'd if anything fails midway).
// Opening the actual PR + comment (steps 7-8) is a separate concern below,
// not this part of the file.

const { execSync } = require('child_process');

const GITHUB_API = 'https://api.github.com';

function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  return execSync('gh auth token', { encoding: 'utf8' }).trim();
}

async function githubRequest(token, method, apiPath, body) {
  const res = await fetch(`${GITHUB_API}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`GitHub API ${method} ${apiPath} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

// files: [{ path, content }] - path relative to repo root, content raw text.
async function open_pr({ owner, repo, baseBranch, newBranch, commitMessage, files }) {
  const token = getToken();

  // 1. Get base branch's latest commit
  const baseRef = await githubRequest(token, 'GET', `/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`);
  const baseSha = baseRef.object.sha;

  // 2. Get that commit's tree SHA
  const baseCommit = await githubRequest(token, 'GET', `/repos/${owner}/${repo}/git/commits/${baseSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  // 3. Create a blob per generated file
  const blobs = [];
  for (const file of files) {
    const blob = await githubRequest(token, 'POST', `/repos/${owner}/${repo}/git/blobs`, {
      content: Buffer.from(file.content, 'utf8').toString('base64'),
      encoding: 'base64',
    });
    blobs.push({ path: file.path, sha: blob.sha });
  }

  // 4. Create a new tree, based on the existing one, adding both files
  const newTree = await githubRequest(token, 'POST', `/repos/${owner}/${repo}/git/trees`, {
    base_tree: baseTreeSha,
    tree: blobs.map((b) => ({ path: b.path, mode: '100644', type: 'blob', sha: b.sha })),
  });

  // 5. Create the commit
  const newCommit = await githubRequest(token, 'POST', `/repos/${owner}/${repo}/git/commits`, {
    message: commitMessage,
    tree: newTree.sha,
    parents: [baseSha],
  });

  // 6. Create the branch, pointing straight at the new commit.
  const newRef = await githubRequest(token, 'POST', `/repos/${owner}/${repo}/git/refs`, {
    ref: `refs/heads/${newBranch}`,
    sha: newCommit.sha,
  });

  return { baseSha, treeSha: newTree.sha, commitSha: newCommit.sha, branch: newRef.ref };
}

// Steps 7-8: separate functions, since opening a PR and commenting on it
// is independent of whether the branch/commit above was just created or
// already existed. Never called with anything but draft: true — never
// auto-merge (ADR 0008) is not a parameter, it's hardcoded, so nothing
// upstream can accidentally flip it.
async function openPullRequest(token, { owner, repo, title, head, base }) {
  return githubRequest(token, 'POST', `/repos/${owner}/${repo}/pulls`, {
    title,
    head,
    base,
    draft: true,
  });
}

async function postComment(token, { owner, repo, issueNumber, body }) {
  return githubRequest(token, 'POST', `/repos/${owner}/${repo}/issues/${issueNumber}/comments`, { body });
}

// Built from real retrieval-loop/critic/gate output, never hand-wavy prose.
// decisionsWorthKeeping is omitted entirely, not filled with a placeholder,
// when the generation genuinely didn't surface anything non-obvious worth
// flagging in the PR comment.
function buildCommentBody({ fixtureLabel, intent, resolvedTokens, patternFilename, framework, criticResult, gateResult, decisionsWorthKeeping }) {
  const tokenLines = Object.entries(resolvedTokens)
    .map(([ref, r]) => `\`${ref}\` → \`${r.value}\``)
    .join(', ');
  const variantLines = Object.entries(intent.variant)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  const criticLine = criticResult.matches_intent === null
    ? `passed: ${criticResult.passed}, ${criticResult.violations.length} violations, matches_intent not evaluated (regex critic — semantic check would need a model call, not run here)`
    : `passed: ${criticResult.passed}, ${criticResult.violations.length} violations, matches_intent: ${criticResult.matches_intent}`;
  const gateLine = `passed: ${gateResult.passed}, ${gateResult.violations.length} violations`;

  let body = `**Loom generation summary**\n\n` +
    `- Source: \`${fixtureLabel}\` (${intent.component}, ${variantLines})\n` +
    `- Tokens used: ${tokenLines}\n` +
    `- Pattern matched: \`patterns/${framework || 'react'}/${patternFilename}\`\n` +
    `- Critic: ${criticLine}\n` +
    `- Gate (\`validate.js\`): ${gateLine}\n`;

  if (decisionsWorthKeeping) {
    body += `- Decisions worth keeping: ${decisionsWorthKeeping}\n`;
  }

  body += `\nThis PR will not auto-merge under any condition. The gate result ` +
    `above is from this local run; the CI check on this PR is the authoritative ` +
    `one and may re-run against the same content.`;

  return body;
}

module.exports = {
  open_pr,
  openPullRequest,
  postComment,
  buildCommentBody,
  githubRequest,
  getToken,
};

if (require.main === module) {
  (async () => {
    const fs = require('fs');
    const path = require('path');
    const { run_retrieval_loop } = require('./run_retrieval_loop');
    const { critique } = require('./critic');
    const { runGate } = require('./gate');

    const OWNER = 'worthbeer';
    const REPO = 'ai-builder-styles';

    const buttonTsx = fs.readFileSync(path.join(__dirname, '..', 'generated', 'Button.clean.tsx'), 'utf8');
    const buttonStories = fs.readFileSync(path.join(__dirname, '..', 'generated', 'Button.clean.stories.tsx'), 'utf8');
    const buttonDanger = require('../fixtures/button-danger.json');
    const tokensJson = require('../tokens.json');

    const token = getToken();
    const { intent, resolvedTokens, patterns } = await run_retrieval_loop(buttonDanger, 'react');
    const criticResult = critique(buttonTsx, { resolvedTokens });
    const gateResult = runGate(buttonTsx, tokensJson, 'Button');

    openPullRequest(token, {
      owner: OWNER,
      repo: REPO,
      title: 'loom: generate Button (danger/md)',
      head: 'loom/button-danger-md',
      base: 'finished',
    })
      .then((pr) => {
        console.log('PR opened:', pr.html_url, '(draft:', pr.draft, ')');
        const body = buildCommentBody({
          fixtureLabel: 'button-danger.json',
          intent,
          resolvedTokens,
          patternFilename: patterns[0] ? patterns[0].filename : '(none matched)',
          criticResult,
          gateResult,
          decisionsWorthKeeping: null, // clean baseline case, nothing non-obvious surfaced
        });
        return postComment(token, { owner: OWNER, repo: REPO, issueNumber: pr.number, body }).then((comment) => ({ pr, comment }));
      })
      .then(({ pr, comment }) => {
        console.log('Comment posted:', comment.html_url);
      })
      .catch((err) => {
        console.error(err.message);
        process.exit(1);
      });
  })();
}
