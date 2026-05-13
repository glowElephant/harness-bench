export type AxisName =
  | 'adoptionDepth'
  | 'automation'
  | 'contextEfficiency'
  | 'toolMaker'
  | 'safetyGuards'
  | 'multiAgent'
  | 'portability'
  | 'learningSpeed';

export interface AxisScore {
  axis: AxisName;
  score: number;
  rawMetrics: Record<string, number | string | boolean>;
  rationale: string;
}

export interface ScanResult {
  mcpServers: number;
  skills: number;
  agents: number;
  hooks: number;
  hookKinds: string[];
  hasGlobalClaudeMd: boolean;
  hasSyncScript: boolean;
  hasDotfilesRepo: boolean;
  sessions: number;
  avgSessionMessages: number;
  taskToolCalls: number;
  totalAssistantMessages: number;
  totalToolUses: number;
  compactionEvents: number;
  selfBuiltInfraRepos: number;
  scannedAt: string;
  claudeVersion: string | null;
}

export interface BenchmarkResult {
  total: number;
  maxTotal: number;
  percentile: number | null;
  label: CharacterLabel;
  axes: AxisScore[];
  scan: ScanResult;
  weakest: AxisName;
  strongest: AxisName;
}

export type CharacterLabel =
  | 'Tool Maker'
  | 'Speed Demon'
  | 'Solo Wizard'
  | 'Vibe Coder'
  | 'Tinkerer'
  | 'Cargo Culter';

export interface CharacterDefinition {
  label: CharacterLabel;
  emoji: string;
  description: string;
  tagline: string;
}
