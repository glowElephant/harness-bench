import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { exists } from './io.js';

export async function detectSyncSetup(): Promise<{
  hasSyncScript: boolean;
  hasDotfilesRepo: boolean;
}> {
  const home = homedir();

  const syncCandidates = [
    join(home, '.claude', 'sync.py'),
    join(home, '.claude', 'sync.sh'),
    join(home, 'dotfiles', 'sync.py'),
    join(home, 'dotfiles', 'sync.sh'),
    join('C:/Git', 'graph-RAG-study', 'sync.py'),
  ];

  let hasSyncScript = false;
  for (const p of syncCandidates) {
    if (await exists(p)) {
      hasSyncScript = true;
      break;
    }
  }

  const dotfilesCandidates = [
    join(home, 'dotfiles'),
    join(home, '.dotfiles'),
    join(home, '.claude', 'dotfiles'),
    join('C:/Git', 'graph-RAG-study', 'dotfiles'),
  ];

  let hasDotfilesRepo = false;
  for (const p of dotfilesCandidates) {
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) {
        hasDotfilesRepo = true;
        break;
      }
    } catch {
    }
  }

  return { hasSyncScript, hasDotfilesRepo };
}
