// Sync agent instruction bodies from .claude/agents/<name>.md → .github/agents/<name>.agent.md
//
// The two copies must carry IDENTICAL instruction bodies but keep their own
// platform-specific YAML frontmatter:
//   .claude  → `tools: Read, …, mcp__playwright-test__…`   `model: sonnet`        (Claude Code)
//   .github  → `tools:` list with `playwright-test/…`       `model: …(copilot)`    (GitHub Copilot)
// Making frontmatter identical would break tool resolution on one platform, so this
// script copies ONLY the body (everything after the frontmatter), normalised to LF / no-BOM.
//
// Usage:
//   node scripts/sync-agents.js          # sync .claude bodies into .github files
//   node scripts/sync-agents.js --check  # CI mode: write nothing, exit 1 if any are out of sync
//
// `.claude/agents/` is the source of truth for body content.

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join('.claude', 'agents');
const GITHUB_DIR = path.join('.github', 'agents');

const check = process.argv.includes('--check');

const norm = (s) => s.replace(/^﻿/, '').replace(/\r\n/g, '\n');

function split(text, file) {
  const normalized = norm(text);
  const m = normalized.match(/^---\n[\s\S]*?\n---\n/);
  if (!m) throw new Error(`No YAML frontmatter found in ${file}`);
  return { frontmatter: m[0], body: normalized.slice(m[0].length) };
}

// Recursively finds every .md file under `dir` (agents may live directly under
// .claude/agents/ or in subfolders like .claude/agents/ui/, .claude/agents/api/).
function findMarkdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findMarkdownFiles(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

function pairs() {
  if (!fs.existsSync(CLAUDE_DIR)) throw new Error(`Missing ${CLAUDE_DIR}`);
  return findMarkdownFiles(CLAUDE_DIR).map((claudePath) => {
    // The .github counterpart is always flat and keyed by base filename only —
    // subfolder placement under .claude/agents/ doesn't affect the agent's name.
    const name = path.basename(claudePath).replace(/\.md$/, '');
    return {
      name,
      claude: claudePath,
      github: path.join(GITHUB_DIR, `${name}.agent.md`),
    };
  });
}

let outOfSync = 0;
let written = 0;

for (const p of pairs()) {
  if (!fs.existsSync(p.github)) {
    console.warn(`⚠ skip ${p.name}: no counterpart at ${p.github}`);
    continue;
  }
  const claudeBody = split(fs.readFileSync(p.claude, 'utf8'), p.claude).body;
  const githubRaw = fs.readFileSync(p.github, 'utf8');
  const githubFm = split(githubRaw, p.github).frontmatter;
  const desired = githubFm + claudeBody;

  if (norm(githubRaw) === desired) {
    console.log(`✓ ${p.name} — in sync`);
    continue;
  }

  if (check) {
    console.error(`✗ ${p.name} — OUT OF SYNC (run: npm run sync:agents)`);
    outOfSync++;
  } else {
    fs.writeFileSync(p.github, desired, 'utf8'); // LF, no BOM
    console.log(`→ ${p.name} — body synced into ${p.github}`);
    written++;
  }
}

if (check && outOfSync > 0) {
  console.error(`\n${outOfSync} agent file(s) out of sync.`);
  process.exit(1);
}
if (!check) {
  console.log(`\nDone. ${written} file(s) updated, ${pairs().length - written} already in sync.`);
}
