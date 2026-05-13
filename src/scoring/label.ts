import type { AxisName, AxisScore, CharacterDefinition, CharacterLabel } from '../types.js';

export const axisLabels: Record<AxisName, string> = {
  adoptionDepth: 'Adoption Depth',
  automation: 'Automation',
  contextEfficiency: 'Context Eff.',
  toolMaker: 'Tool Maker',
  safetyGuards: 'Safety Guards',
  multiAgent: 'Multi-Agent',
  portability: 'Portability',
  learningSpeed: 'Learning Speed',
};

export const CHARACTERS: Record<CharacterLabel, CharacterDefinition> = {
  'Tool Maker': {
    label: 'Tool Maker',
    emoji: '🛠',
    description:
      'You build tools, not just use them. High infra-repo count + strong safety guards.',
    tagline: "You don't use AI. You build environments where AI thrives.",
  },
  'Speed Demon': {
    label: 'Speed Demon',
    emoji: '⚡',
    description:
      'Maximum delegation. High automation + multi-agent usage. Things move fast.',
    tagline: 'The bottleneck is no longer typing.',
  },
  'Solo Wizard': {
    label: 'Solo Wizard',
    emoji: '🧙',
    description:
      'Broad mastery but low portability. Powerful setup that only you can run.',
    tagline: 'A castle built for one.',
  },
  'Vibe Coder': {
    label: 'Vibe Coder',
    emoji: '🌊',
    description:
      'High automation, low safety. Things ship fast — and break fast.',
    tagline: 'It works on my machine. Sometimes.',
  },
  Tinkerer: {
    label: 'Tinkerer',
    emoji: '🔬',
    description:
      'Exploring, learning, adopting fast. Components growing, but not yet integrated.',
    tagline: 'Day 47 of trying every new MCP that drops.',
  },
  'Cargo Culter': {
    label: 'Cargo Culter',
    emoji: '📦',
    description:
      'Many components installed, low actual usage. Configured but not internalized.',
    tagline: 'Installed. Untouched. Repeat.',
  },
};

export function classify(axes: AxisScore[]): CharacterLabel {
  const byAxis: Record<AxisName, number> = axes.reduce(
    (acc, a) => {
      acc[a.axis] = a.score;
      return acc;
    },
    {} as Record<AxisName, number>
  );

  const total = axes.reduce((s, a) => s + a.score, 0);
  const avg = total / axes.length;

  if (byAxis.toolMaker >= 7 && byAxis.safetyGuards >= 7) return 'Tool Maker';

  if (byAxis.automation >= 7 && byAxis.multiAgent >= 7) return 'Speed Demon';

  if (avg >= 6 && byAxis.portability <= 4) return 'Solo Wizard';

  if (byAxis.automation >= 6 && byAxis.safetyGuards <= 3) return 'Vibe Coder';

  if (byAxis.adoptionDepth >= 5 && avg < 5) return 'Cargo Culter';

  return 'Tinkerer';
}
