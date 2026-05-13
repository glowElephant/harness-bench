import { readJsonSafe } from './io.js';
import { PATHS } from './paths.js';

interface ClaudeJsonShape {
  mcpServers?: Record<string, unknown>;
  projects?: Record<string, { mcpServers?: Record<string, unknown> }>;
  numStartups?: number;
}

export async function scanMcp(): Promise<{
  globalMcpServers: number;
  projectMcpServers: number;
  numStartups: number;
}> {
  const data = (await readJsonSafe<ClaudeJsonShape>(PATHS.claudeJson)) ?? {};
  const global = Object.keys(data.mcpServers ?? {}).length;

  let project = 0;
  for (const proj of Object.values(data.projects ?? {})) {
    project += Object.keys(proj?.mcpServers ?? {}).length;
  }

  return {
    globalMcpServers: global,
    projectMcpServers: project,
    numStartups: data.numStartups ?? 0,
  };
}
