import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { homedir } from 'node:os';

const execAsync = promisify(exec);

const INFRA_KEYWORDS = [
  // Claude / Anthropic ecosystem
  'claude',
  'anthropic',
  // generic LLM / AI
  'llm',
  'gpt',
  'gemini',
  'ai-',
  '-ai',
  'agent',
  // other coding agents
  'copilot',
  'cursor',
  'codex',
  'aider',
  'continue',
  'windsurf',
  // protocols / infra
  'mcp',
  'rag',
  'graph',
  'prompt',
  'context',
  'harness',
  'forge',
  'session',
  'skill',
  'hook',
  // memory / retrieval
  'embedding',
  'vector',
  'retrieval',
];

export interface GithubScanResult {
  detected: boolean;
  user: string | null;
  infraRepos: number;
  totalOriginalRepos: number;
}

export async function scanGithub(): Promise<GithubScanResult> {
  const user = await detectGithubUser();
  if (!user) {
    return { detected: false, user: null, infraRepos: 0, totalOriginalRepos: 0 };
  }

  try {
    const repos = await fetchPublicRepos(user);
    const originals = repos.filter((r) => !r.fork);
    const infra = originals.filter((r) => {
      const haystack = `${r.name} ${r.description ?? ''}`.toLowerCase();
      return INFRA_KEYWORDS.some((k) => haystack.includes(k));
    });

    return {
      detected: true,
      user,
      infraRepos: infra.length,
      totalOriginalRepos: originals.length,
    };
  } catch {
    return { detected: true, user, infraRepos: 0, totalOriginalRepos: 0 };
  }
}

interface RepoShape {
  name: string;
  description: string | null;
  fork: boolean;
}

async function fetchPublicRepos(user: string): Promise<RepoShape[]> {
  const out: RepoShape[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://api.github.com/users/${user}/repos?per_page=100&page=${page}`,
      {
        headers: {
          accept: 'application/vnd.github+json',
          'user-agent': 'harness-bench',
        },
      }
    );
    if (!res.ok) break;
    const batch = (await res.json()) as RepoShape[];
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

async function detectGithubUser(): Promise<string | null> {
  // 1. Explicit env override (most reliable)
  const fromEnv =
    process.env.HARNESS_BENCH_GITHUB_USER ||
    process.env.GITHUB_USER ||
    process.env.GH_USER;
  if (fromEnv) return fromEnv;

  // 2. `gh` CLI auth state (works if user logged in via gh)
  try {
    const { stdout } = await execAsync('gh api user --jq .login', { timeout: 5000 });
    const login = stdout.trim();
    if (login) return login;
  } catch {
  }

  // 3. Walk up from cwd looking for a git remote whose origin points to github.com
  const fromRemote = await detectFromGitRemote(process.cwd());
  if (fromRemote) return fromRemote;

  // 4. Fall back: scan ~/.gitconfig for github user (NOT email — email is unreliable)
  try {
    const home = homedir();
    const gitConfig = await fs.readFile(join(home, '.gitconfig'), 'utf-8');
    const ghUserMatch = gitConfig.match(/^\s*user\s*=\s*(.+)$/im);
    if (ghUserMatch) {
      const u = ghUserMatch[1].trim();
      if (u && !u.includes('@')) return u;
    }
  } catch {
  }

  return null;
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
