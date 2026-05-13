import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { countEntries, exists, listDir, readJsonSafe } from './io.js';
import { PATHS } from './paths.js';

export async function scanSkills(): Promise<{ user: number; plugin: number }> {
  const user = await countEntries(PATHS.skillsDir, (n) => !n.startsWith('.'));

  let plugin = 0;
  const pluginsRoot = join(PATHS.claudeHome, 'plugins', 'cache');
  if (await exists(pluginsRoot)) {
    const owners = await listDir(pluginsRoot);
    for (const owner of owners) {
      const ownerPath = join(pluginsRoot, owner);
      let stat;
      try {
        stat = await fs.stat(ownerPath);
      } catch {
        continue;
      }
      if (!stat.isDirectory()) continue;
      const plugins = await listDir(ownerPath);
      for (const pkg of plugins) {
        const skillsDir = join(ownerPath, pkg, 'skills');
        plugin += await countEntries(skillsDir, (n) => !n.startsWith('.'));
      }
    }
  }

  return { user, plugin };
}

export async function scanAgents(): Promise<{ count: number }> {
  const entries = await listDir(PATHS.agentsDir);
  const count = entries.filter((n) => n.endsWith('.md') && !n.startsWith('.')).length;
  return { count };
}

export async function scanPlugins(): Promise<{ installed: number }> {
  const data = await readJsonSafe<Record<string, unknown>>(PATHS.pluginsInstalledJson);
  if (!data) return { installed: 0 };
  return { installed: Object.keys(data).length };
}

export async function scanGlobalClaudeMd(): Promise<{ exists: boolean; sizeBytes: number }> {
  try {
    const stat = await fs.stat(PATHS.globalClaudeMd);
    return { exists: true, sizeBytes: stat.size };
  } catch {
    return { exists: false, sizeBytes: 0 };
  }
}
