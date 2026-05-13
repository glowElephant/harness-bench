import { promises as fs } from 'node:fs';

const INFRA_KEYWORDS = [
  'claude',
  'mcp',
  'agent',
  'rag',
  'harness',
  'forge',
  'context',
  'session',
  'skill',
  'hook',
  'prompt',
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
  const fromEnv =
    process.env.HARNESS_BENCH_GITHUB_USER ||
    process.env.GITHUB_USER ||
    process.env.GH_USER;
  if (fromEnv) return fromEnv;

  try {
    const home = process.env.HOME || process.env.USERPROFILE;
    if (!home) return null;
    const gitConfig = await fs.readFile(`${home}/.gitconfig`, 'utf-8');
    const match = gitConfig.match(/^\s*email\s*=\s*(.+)$/im);
    if (match) {
      const user = match[1].trim().split('@')[0];
      if (user) return user;
    }
  } catch {
  }
  return null;
}
