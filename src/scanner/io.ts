import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonSafe<T = unknown>(path: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function countEntries(
  dir: string,
  filter?: (name: string) => boolean
): Promise<number> {
  try {
    const entries = await fs.readdir(dir);
    return filter ? entries.filter(filter).length : entries.length;
  } catch {
    return 0;
  }
}

export async function listDir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

export async function walkJsonlFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string) {
    let entries;
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) {
        await walk(p);
      } else if (e.isFile() && e.name.endsWith('.jsonl')) {
        out.push(p);
      }
    }
  }
  await walk(root);
  return out;
}

export async function fileSize(path: string): Promise<number> {
  try {
    const s = await fs.stat(path);
    return s.size;
  } catch {
    return 0;
  }
}
