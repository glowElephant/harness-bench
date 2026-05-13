import pc from 'picocolors';
import type { BenchmarkResult } from '../types.js';
import { axisLabels, CHARACTERS } from '../scoring/label.js';

const BAR_WIDTH = 14;
const AXIS_LABEL_WIDTH = 16;

function bar(score: number): string {
  const filled = Math.round((score / 10) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const color =
    score >= 8 ? pc.green : score >= 5 ? pc.cyan : score >= 3 ? pc.yellow : pc.red;
  return color('█'.repeat(filled)) + pc.gray('░'.repeat(empty));
}

function pad(s: string, width: number): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

export function renderTerminal(result: BenchmarkResult): string {
  const lines: string[] = [];
  const char = CHARACTERS[result.label];

  const headerLeft = pc.bold('  Harness Benchmark');
  const headerRight = pc.gray(`v0.1.0`);
  lines.push('');
  lines.push(pc.dim('━'.repeat(54)));
  lines.push(`${headerLeft}${' '.repeat(54 - 22 - headerRight.length)}${headerRight}`);
  lines.push(pc.dim('━'.repeat(54)));
  lines.push('');

  for (const axis of result.axes) {
    const label = pad(axisLabels[axis.axis], AXIS_LABEL_WIDTH);
    const scoreStr = pc.bold(`${axis.score.toString().padStart(2)}/10`);
    lines.push(`  ${pc.gray(label)} ${bar(axis.score)} ${scoreStr}`);
  }

  lines.push('');
  lines.push(pc.dim('─'.repeat(54)));

  const totalLine = `  ${pc.bold('TOTAL')}            ${pc.bold(
    `${result.total} / ${result.maxTotal}`
  )}`;
  lines.push(totalLine);

  const labelLine = `  ${pc.bold('LABEL')}            ${char.emoji}  ${pc.bold(
    pc.cyan(char.label)
  )}`;
  lines.push(labelLine);

  lines.push('');
  lines.push(`  ${pc.italic(pc.gray(char.tagline))}`);
  lines.push(`  ${pc.gray(char.description)}`);

  lines.push('');
  lines.push(pc.dim('─'.repeat(54)));
  lines.push(`  ${pc.gray('Strongest:')} ${axisLabels[result.strongest]}`);
  lines.push(`  ${pc.gray('Weakest:')}   ${axisLabels[result.weakest]}`);
  lines.push(pc.dim('━'.repeat(54)));
  lines.push('');
  lines.push(pc.gray('  Privacy: only metadata counts were read. No prompts, code,'));
  lines.push(pc.gray('  or session content were accessed or transmitted.'));
  lines.push('');

  return lines.join('\n');
}

export function renderRawDetails(result: BenchmarkResult): string {
  const lines: string[] = [];
  lines.push(pc.dim('  Raw metrics:'));
  for (const axis of result.axes) {
    lines.push(`  ${pc.gray(axisLabels[axis.axis])}:`);
    for (const [k, v] of Object.entries(axis.rawMetrics)) {
      lines.push(`    ${pc.gray('·')} ${k} = ${pc.cyan(String(v))}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}
