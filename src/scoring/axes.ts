import type { AxisScore, ScanResult } from '../types.js';
import { TIERS, tierScore } from './thresholds.js';

const SAFETY_KINDS = ['PreToolUse', 'PostToolUse', 'UserPromptSubmit', 'Notification', 'Stop', 'SubagentStop', 'PreCompact', 'SessionStart', 'SessionEnd'];

export function adoptionDepth(scan: ScanResult): AxisScore {
  const value = scan.mcpServers + scan.skills + scan.agents;
  return {
    axis: 'adoptionDepth',
    score: tierScore(TIERS.adoptionDepth, value),
    rawMetrics: {
      mcpServers: scan.mcpServers,
      skills: scan.skills,
      agents: scan.agents,
      total: value,
    },
    rationale:
      'Sum of MCP servers + skills + agents. Higher = more components actively configured.',
  };
}

export function automation(scan: ScanResult): AxisScore {
  const ratio =
    scan.totalAssistantMessages > 0
      ? scan.totalToolUses / scan.totalAssistantMessages
      : 0;
  return {
    axis: 'automation',
    score: tierScore(TIERS.automationRatio, ratio),
    rawMetrics: {
      toolUses: scan.totalToolUses,
      assistantMessages: scan.totalAssistantMessages,
      ratio: Number(ratio.toFixed(3)),
    },
    rationale:
      'Tool calls per assistant message across sampled sessions. Higher = more work delegated to tools.',
  };
}

export function contextEfficiency(scan: ScanResult): AxisScore {
  const linesScore = tierScore(TIERS.avgSessionLines, scan.avgSessionMessages);
  const hasCompaction = scan.compactionEvents > 0 ? 2 : 0;
  const score = Math.min(10, linesScore + hasCompaction);
  return {
    axis: 'contextEfficiency',
    score,
    rawMetrics: {
      avgSessionMessages: scan.avgSessionMessages,
      compactionEvents: scan.compactionEvents,
    },
    rationale:
      'Average session length + presence of compaction events. Long sessions with compaction = managed context window.',
  };
}

export function toolMaker(scan: ScanResult): AxisScore {
  const score = tierScore(TIERS.toolMakerRepos, scan.selfBuiltInfraRepos);
  return {
    axis: 'toolMaker',
    score,
    rawMetrics: {
      infraRepos: scan.selfBuiltInfraRepos,
    },
    rationale:
      'GitHub public repos matching AI infrastructure keywords (claude/mcp/agent/rag/harness/...). Higher = builds tools, not just uses them.',
  };
}

export function safetyGuards(scan: ScanResult): AxisScore {
  const countScore = tierScore(TIERS.hookCount, scan.hooks);
  const safetyKindCount = scan.hookKinds.filter((k) => SAFETY_KINDS.includes(k)).length;
  const kindBonus = Math.min(2, Math.floor(safetyKindCount / 2));
  const score = Math.min(10, countScore + kindBonus);
  return {
    axis: 'safetyGuards',
    score,
    rawMetrics: {
      hooks: scan.hooks,
      hookKinds: scan.hookKinds.length,
      kinds: scan.hookKinds.join(','),
    },
    rationale:
      'Number of hooks + diversity of hook event kinds (PreToolUse/PostToolUse/etc). Anthropic recommends PreToolUse hooks for safety.',
  };
}

export function multiAgent(scan: ScanResult): AxisScore {
  const per100 =
    scan.totalAssistantMessages > 0
      ? (scan.taskToolCalls / scan.totalAssistantMessages) * 100
      : 0;
  const baseScore = tierScore(TIERS.multiAgentPer100, per100);

  const subagentRatio =
    scan.sessions > 0 ? scan.subagentFiles / scan.sessions : 0;
  let subagentBonus = 0;
  if (subagentRatio >= 0.5) subagentBonus = 4;
  else if (subagentRatio >= 0.2) subagentBonus = 3;
  else if (subagentRatio >= 0.05) subagentBonus = 2;
  else if (subagentRatio > 0) subagentBonus = 1;

  return {
    axis: 'multiAgent',
    score: Math.min(10, baseScore + subagentBonus),
    rawMetrics: {
      multiAgentToolCalls: scan.taskToolCalls,
      per100Messages: Number(per100.toFixed(2)),
      subagentFiles: scan.subagentFiles,
      subagentRatio: Number(subagentRatio.toFixed(3)),
    },
    rationale:
      'Multi-agent tool calls (Task/Agent/SendMessage/Skill) per 100 msgs + ratio of subagent session files. Captures both direct delegation and active parallel sessions.',
  };
}

export function portability(scan: ScanResult): AxisScore {
  let score = 0;
  if (scan.hasGlobalClaudeMd) score += 3;
  if (scan.hasDotfilesRepo) score += 3;
  if (scan.hasSyncScript) score += 4;
  return {
    axis: 'portability',
    score: Math.min(10, score),
    rawMetrics: {
      globalClaudeMd: scan.hasGlobalClaudeMd,
      dotfilesRepo: scan.hasDotfilesRepo,
      syncScript: scan.hasSyncScript,
    },
    rationale:
      'Global CLAUDE.md (3pt) + dotfiles repo (3pt) + sync script (4pt). Can you reproduce this setup on a new machine?',
  };
}

export function learningSpeed(scan: ScanResult, numStartups: number): AxisScore {
  const startupsScore = tierScore(TIERS.numStartups, numStartups);
  const componentBoost = scan.skills >= 10 && scan.mcpServers >= 5 ? 2 : 0;
  const score = Math.min(10, startupsScore + componentBoost);
  return {
    axis: 'learningSpeed',
    score,
    rawMetrics: {
      numStartups,
      skills: scan.skills,
      mcpServers: scan.mcpServers,
    },
    rationale:
      'Claude Code launch count (proxy for active usage) + breadth of adopted components. v2 will measure model-release-to-adoption latency directly.',
  };
}
