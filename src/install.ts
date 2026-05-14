/**
 * `harness-bench install` — one-shot MCP registration for popular AI coding agents.
 *
 * Currently auto-installs to:
 *   - Claude Code  (~/.claude.json)
 *
 * For Cursor / Codex / Gemini CLI / Aider users, prints copy-paste instructions
 * because their MCP config formats differ and surface area is moving.
 *
 * Auto-detects:
 *   - GitHub username (via gh CLI or git remote)
 *   - sync script location (common paths)
 *   - dotfiles repo location (common paths)
 *
 * Prints a summary of what will be written, then asks for confirmation unless
 * --yes is passed.
 */

import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline/promises';
import pc from 'picocolors';

const execAsync = promisify(exec);

interface DetectedEnv {
  HARNESS_BENCH_GITHUB_USER?: string;
  HARNESS_BENCH_SYNC_SCRIPT?: string;
  HARNESS_BENCH_DOTFILES_DIR?: string;
}

export async function runInstall(args: { yes: boolean }): Promise<void> {
  const home = homedir();
  const claudeJsonPath = join(home, '.claude.json');

  console.log(pc.bold('\n  harness-bench install\n'));
  console.log(pc.gray('  Detects your AI coding agent setup and registers harness-bench as an MCP server.\n'));

  const claudeExists = await pathExists(claudeJsonPath);
  if (!claudeExists) {
    console.log(pc.yellow('  Claude Code config (~/.claude.json) not found.'));
    console.log(pc.gray('  For other agents, see manual instructions at the end.\n'));
    printOtherAgentInstructions();
    return;
  }

  console.log(pc.green('  ✓') + ' Detected Claude Code (~/.claude.json)');

  const env = await detectEnv();
  printEnvSummary(env);

  if (!args.yes) {
    const ok = await confirm('  Proceed with registration?');
    if (!ok) {
      console.log(pc.gray('\n  Aborted. No changes made.\n'));
      return;
    }
  }

  await registerWithClaudeCode(claudeJsonPath, env);
  console.log(pc.green('\n  ✓') + ' Registered harness-bench in ~/.claude.json (user scope)');
  console.log(pc.gray('  Restart Claude Code (or open a new session) to use the new MCP tools:\n'));
  console.log('    • harness_scan_classic');
  console.log('    • harness_scan_full');
  console.log('    • harness_recommend');
  console.log('');

  printOtherAgentInstructions();
}

async function detectEnv(): Promise<DetectedEnv> {
  const out: DetectedEnv = {};

  // GitHub user
  try {
    const { stdout } = await execAsync('gh api user --jq .login', { timeout: 5000 });
    const login = stdout.trim();
    if (login) out.HARNESS_BENCH_GITHUB_USER = login;
  } catch {
  }
  if (!out.HARNESS_BENCH_GITHUB_USER) {
    const fromRemote = await detectFromGitRemote(process.cwd());
    if (fromRemote) out.HARNESS_BENCH_GITHUB_USER = fromRemote;
  }

  // Sync script — common paths
  const home = homedir();
  const syncCandidates = [
    join(home, '.claude', 'sync.py'),
    join(home, '.claude', 'sync.sh'),
    join(home, 'dotfiles', 'sync.py'),
    join(home, 'dotfiles', 'sync.sh'),
    join(home, '.dotfiles', 'sync.py'),
    join(home, '.dotfiles', 'install.sh'),
  ];
  for (const p of syncCandidates) {
    if (await pathExists(p)) {
      out.HARNESS_BENCH_SYNC_SCRIPT = p;
      break;
    }
  }

  // Dotfiles dir
  const dotCandidates = [
    join(home, 'dotfiles'),
    join(home, '.dotfiles'),
    join(home, '.local', 'share', 'chezmoi'),
    join(home, '.yadm'),
  ];
  for (const p of dotCandidates) {
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) {
        out.HARNESS_BENCH_DOTFILES_DIR = p;
        break;
      }
    } catch {
    }
  }

  return out;
}

function printEnvSummary(env: DetectedEnv): void {
  console.log('\n  ' + pc.bold('Detected env vars:'));
  const keys: Array<keyof DetectedEnv> = [
    'HARNESS_BENCH_GITHUB_USER',
    'HARNESS_BENCH_SYNC_SCRIPT',
    'HARNESS_BENCH_DOTFILES_DIR',
  ];
  for (const k of keys) {
    if (env[k]) {
      console.log(`    ${pc.gray('·')} ${k} = ${pc.cyan(env[k] ?? '')}`);
    } else {
      console.log(`    ${pc.gray('·')} ${k} = ${pc.dim('(not detected — you can set it later)')}`);
    }
  }
  console.log('');
}

async function registerWithClaudeCode(
  claudeJsonPath: string,
  env: DetectedEnv
): Promise<void> {
  const raw = await fs.readFile(claudeJsonPath, 'utf-8');
  const data = JSON.parse(raw) as { mcpServers?: Record<string, unknown> };
  if (!data.mcpServers) data.mcpServers = {};

  // Preserve any existing env vars the user manually configured before.
  const existing = (data.mcpServers as Record<string, unknown>)['harness-bench'] as
    | { env?: Record<string, string> }
    | undefined;
  const existingEnv = existing?.env ?? {};

  const mergedEnv: Record<string, string> = { ...existingEnv };
  // Only fill in detected values for keys the user hasn't already set.
  for (const [k, v] of Object.entries(env)) {
    if (v && !mergedEnv[k]) mergedEnv[k] = v;
  }

  const entry: Record<string, unknown> = {
    type: 'stdio',
    command: 'npx',
    args: ['-y', 'harness-bench', '--mcp'],
  };
  if (Object.keys(mergedEnv).length > 0) entry.env = mergedEnv;

  (data.mcpServers as Record<string, unknown>)['harness-bench'] = entry;

  const backupPath = `${claudeJsonPath}.harness-bench-backup-${Date.now()}`;
  await fs.copyFile(claudeJsonPath, backupPath);
  console.log(pc.gray(`  Backup written to ${backupPath}`));

  await fs.writeFile(claudeJsonPath, JSON.stringify(data, null, 2), 'utf-8');

  const preserved = Object.keys(existingEnv).filter((k) => mergedEnv[k] === existingEnv[k]);
  if (preserved.length > 0) {
    console.log(
      pc.gray(`  Preserved existing env vars: ${preserved.join(', ')}`)
    );
  }
}

function printOtherAgentInstructions(): void {
  console.log(pc.bold('  Other agents:'));
  console.log('');
  console.log(pc.bold('  Cursor'));
  console.log(pc.gray('    Add to ~/.cursor/mcp.json (or via UI: Settings → MCP):'));
  console.log(`    ${pc.cyan(JSON.stringify(
    {
      mcpServers: {
        'harness-bench': {
          command: 'npx',
          args: ['-y', 'harness-bench', '--mcp'],
        },
      },
    },
    null,
    2
  ).replace(/\n/g, '\n    '))}`);
  console.log('');
  console.log(pc.bold('  Codex CLI / Aider / Gemini CLI'));
  console.log(pc.gray('    Each tool has its own MCP config — consult your tool docs.'));
  console.log(pc.gray('    Server command is always:'));
  console.log(`    ${pc.cyan('npx -y harness-bench --mcp')}`);
  console.log('');
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function detectFromGitRemote(startDir: string): Promise<string | null> {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    try {
      const cfg = await fs.readFile(join(dir, '.git', 'config'), 'utf-8');
      const match = cfg.match(/url\s*=\s*(?:https:\/\/github\.com\/|git@github\.com:)([^/]+)\//i);
      if (match) return match[1];
    } catch {
    }
    const parent = join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${question} [Y/n]: `);
    const trimmed = answer.trim().toLowerCase();
    return trimmed === '' || trimmed === 'y' || trimmed === 'yes';
  } finally {
    rl.close();
  }
}
