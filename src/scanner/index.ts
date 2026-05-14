import type { ScanResult } from '../types.js';
import { scanAgents, scanGlobalClaudeMd, scanPlugins, scanSkills } from './components.js';
import { scanGithub } from './github.js';
import { scanMcp } from './mcp.js';
import { scanSessions } from './sessions.js';
import { scanSettings } from './settings.js';
import { detectSyncSetup } from './sync.js';

export async function runScan(): Promise<ScanResult> {
  const [settings, mcp, skills, agents, plugins, claudeMd, sessions, sync, github] =
    await Promise.all([
      scanSettings(),
      scanMcp(),
      scanSkills(),
      scanAgents(),
      scanPlugins(),
      scanGlobalClaudeMd(),
      scanSessions(),
      detectSyncSetup(),
      scanGithub(),
    ]);

  const avgSessionMessages =
    sessions.files > 0 ? Math.round(sessions.totalLines / sessions.files) : 0;

  return {
    mcpServers: mcp.globalMcpServers + mcp.projectMcpServers,
    skills: skills.user + skills.plugin,
    agents: agents.count,
    hooks: settings.hooks,
    hookKinds: settings.hookKinds,
    hasGlobalClaudeMd: claudeMd.exists,
    hasSyncScript: sync.hasSyncScript,
    hasDotfilesRepo: sync.hasDotfilesRepo,
    sessions: sessions.files,
    avgSessionMessages,
    taskToolCalls: sessions.taskToolCalls,
    totalAssistantMessages: sessions.assistantMessages,
    totalToolUses: sessions.toolUses,
    compactionEvents: sessions.compactionEvents,
    subagentFiles: sessions.subagentFiles,
    toolNameHistogram: sessions.toolNameHistogram,
    selfBuiltInfraRepos: github.infraRepos,
    scannedAt: new Date().toISOString(),
    claudeVersion: null,
  };
}

export type { GithubScanResult } from './github.js';
