import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { exists } from './io.js';

/**
 * Full environment metadata dump intended for an LLM analyzer to read.
 *
 * Privacy invariant: file *names* only — never reads message content,
 * source code, or hook script bodies. Only listings, counts, and standard
 * locations.
 */
export interface EnvDump {
  home: string;
  claudeHome: string;
  skillsFiles: string[];
  agentsFiles: string[];
  pluginsInstalled: string[];
  hookEvents: string[];
  hookCounts: Record<string, number>;
  mcpServerNames: string[];
  enabledPluginNames: string[];
  globalClaudeMdExists: boolean;
  globalClaudeMdBytes: number;
  sessionFilesCount: number;
  subagentFilesCount: number;
  nonStandardCandidates: string[];
  detectionNotes: string[];
}

const NON_STANDARD_HINTS = [
  '.config/claude',
  '.config/anthropic',
  '.local/share/claude',
  '.local/share/anthropic',
  '.cursor',
  '.codex',
  '.aider',
  '.config/cursor',
];

export async function envDump(): Promise<EnvDump> {
  const home = homedir();
  const claudeHome = join(home, '.claude');

  const skillsFiles = await listAllFiles(join(claudeHome, 'skills'));
  const agentsFiles = await listAllFiles(join(claudeHome, 'agents'));

  let pluginsInstalled: string[] = [];
  try {
    const raw = await fs.readFile(
      join(claudeHome, 'plugins', 'installed_plugins.json'),
      'utf-8'
    );
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    pluginsInstalled = Object.keys(parsed);
  } catch {
  }

  const { hookEvents, hookCounts } = await dumpHooks(claudeHome);

  const { mcpServerNames } = await dumpMcp(home);

  let enabledPluginNames: string[] = [];
  try {
    const raw = await fs.readFile(join(claudeHome, 'settings.json'), 'utf-8');
    const parsed = JSON.parse(raw) as { enabledPlugins?: Record<string, boolean> };
    enabledPluginNames = Object.entries(parsed.enabledPlugins ?? {})
      .filter(([, v]) => v)
      .map(([k]) => k);
  } catch {
  }

  let globalClaudeMdExists = false;
  let globalClaudeMdBytes = 0;
  try {
    const stat = await fs.stat(join(claudeHome, 'CLAUDE.md'));
    globalClaudeMdExists = true;
    globalClaudeMdBytes = stat.size;
  } catch {
  }

  const { sessionFilesCount, subagentFilesCount } = await countSessions(
    join(claudeHome, 'projects')
  );

  const nonStandardCandidates: string[] = [];
  for (const rel of NON_STANDARD_HINTS) {
    const p = join(home, rel);
    if (await exists(p)) nonStandardCandidates.push(p);
  }

  const detectionNotes: string[] = [];
  if (nonStandardCandidates.length > 0) {
    detectionNotes.push(
      `Found ${nonStandardCandidates.length} non-standard locations that may contain assets the classic heuristic misses. LLM analysis should inspect their names and decide whether they affect axis scores.`
    );
  }
  if (agentsFiles.length === 0) {
    detectionNotes.push(
      'No custom agents found. Most working Claude Code users have at least one (code-reviewer etc). If user has agents elsewhere, score may be off.'
    );
  }
  if (skillsFiles.length < 3) {
    detectionNotes.push(
      'Skills count is low. User may store skills in a non-standard location or rely on plugin-shipped skills only.'
    );
  }

  return {
    home,
    claudeHome,
    skillsFiles,
    agentsFiles,
    pluginsInstalled,
    hookEvents,
    hookCounts,
    mcpServerNames,
    enabledPluginNames,
    globalClaudeMdExists,
    globalClaudeMdBytes,
    sessionFilesCount,
    subagentFilesCount,
    nonStandardCandidates,
    detectionNotes,
  };
}

async function listAllFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string, depth: number) {
    if (depth > 3) return;
    let entries;
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        await walk(full, depth + 1);
      } else if (e.isFile()) {
        if (e.name.startsWith('.')) continue;
        out.push(full.replace(/\\/g, '/'));
      }
    }
  }
  await walk(dir, 0);
  return out;
}

async function dumpHooks(claudeHome: string): Promise<{
  hookEvents: string[];
  hookCounts: Record<string, number>;
}> {
  const events = new Set<string>();
  const counts: Record<string, number> = {};
  for (const file of ['settings.json', 'settings.local.json']) {
    try {
      const raw = await fs.readFile(join(claudeHome, file), 'utf-8');
      const parsed = JSON.parse(raw) as {
        hooks?: Record<string, Array<{ hooks?: Array<unknown> }>>;
      };
      const groups = parsed.hooks ?? {};
      for (const [event, list] of Object.entries(groups)) {
        if (!Array.isArray(list)) continue;
        for (const g of list) {
          const n = Array.isArray(g?.hooks) ? g.hooks.length : 0;
          if (n > 0) {
            events.add(event);
            counts[event] = (counts[event] ?? 0) + n;
          }
        }
      }
    } catch {
    }
  }
  return { hookEvents: Array.from(events).sort(), hookCounts: counts };
}

async function dumpMcp(home: string): Promise<{ mcpServerNames: string[] }> {
  try {
    const raw = await fs.readFile(join(home, '.claude.json'), 'utf-8');
    const parsed = JSON.parse(raw) as {
      mcpServers?: Record<string, unknown>;
      projects?: Record<string, { mcpServers?: Record<string, unknown> }>;
    };
    const names = new Set<string>();
    for (const k of Object.keys(parsed.mcpServers ?? {})) names.add(k);
    for (const p of Object.values(parsed.projects ?? {})) {
      for (const k of Object.keys(p?.mcpServers ?? {})) names.add(k);
    }
    return { mcpServerNames: Array.from(names).sort() };
  } catch {
    return { mcpServerNames: [] };
  }
}

async function countSessions(projectsDir: string): Promise<{
  sessionFilesCount: number;
  subagentFilesCount: number;
}> {
  let session = 0;
  let sub = 0;
  async function walk(d: string) {
    let entries;
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile() && e.name.endsWith('.jsonl')) {
        session++;
        if (full.includes('subagents')) sub++;
      }
    }
  }
  await walk(projectsDir);
  return { sessionFilesCount: session, subagentFilesCount: sub };
}
