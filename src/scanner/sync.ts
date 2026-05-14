import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { exists } from './io.js';

/**
 * Detect whether the user has a portable Claude harness setup.
 * Looks for common dotfiles/sync conventions across the community.
 *
 * Override via env vars:
 *   HARNESS_BENCH_SYNC_SCRIPT  — absolute path to your sync script
 *   HARNESS_BENCH_DOTFILES_DIR — absolute path to your dotfiles repo
 */
export async function detectSyncSetup(): Promise<{
  hasSyncScript: boolean;
  hasDotfilesRepo: boolean;
}> {
  const home = homedir();

  const envSync = process.env.HARNESS_BENCH_SYNC_SCRIPT;
  const envDot = process.env.HARNESS_BENCH_DOTFILES_DIR;

  const syncCandidates: string[] = [];
  if (envSync) syncCandidates.push(envSync);
  syncCandidates.push(
    join(home, '.claude', 'sync.py'),
    join(home, '.claude', 'sync.sh'),
    join(home, 'dotfiles', 'sync.py'),
    join(home, 'dotfiles', 'sync.sh'),
    join(home, '.dotfiles', 'sync.py'),
    join(home, '.dotfiles', 'sync.sh'),
    join(home, '.dotfiles', 'install'),
    join(home, '.dotfiles', 'install.sh'),
    join(home, '.config', 'chezmoi', 'chezmoi.toml'),
    join(home, '.local', 'share', 'chezmoi'),
    join(home, '.yadm'),
    join(home, '.dotfiles.git'),
    join(home, 'dotfiles.git')
  );

  let hasSyncScript = false;
  for (const p of syncCandidates) {
    if (await exists(p)) {
      hasSyncScript = true;
      break;
    }
  }

  const dotfilesCandidates: string[] = [];
  if (envDot) dotfilesCandidates.push(envDot);
  dotfilesCandidates.push(
    join(home, 'dotfiles'),
    join(home, '.dotfiles'),
    join(home, '.claude', 'dotfiles'),
    join(home, '.config'),
    join(home, '.local', 'share', 'chezmoi'),
    join(home, '.yadm')
  );

  let hasDotfilesRepo = false;
  for (const p of dotfilesCandidates) {
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) {
        if (p === join(home, '.config')) {
          const sub = await fs.readdir(p).catch(() => []);
          if (!sub.some((n) => n === 'chezmoi' || n === 'dotfiles')) continue;
        }
        hasDotfilesRepo = true;
        break;
      }
    } catch {
    }
  }

  return { hasSyncScript, hasDotfilesRepo };
}
