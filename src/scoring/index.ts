import type { AxisName, AxisScore, BenchmarkResult, ScanResult } from '../types.js';
import {
  adoptionDepth,
  automation,
  contextEfficiency,
  learningSpeed,
  multiAgent,
  portability,
  safetyGuards,
  toolMaker,
} from './axes.js';
import { classify } from './label.js';

export function scoreScan(scan: ScanResult, numStartups: number): BenchmarkResult {
  const axes: AxisScore[] = [
    adoptionDepth(scan),
    automation(scan),
    contextEfficiency(scan),
    toolMaker(scan),
    safetyGuards(scan),
    multiAgent(scan),
    portability(scan),
    learningSpeed(scan, numStartups),
  ];

  const total = axes.reduce((sum, a) => sum + a.score, 0);
  const maxTotal = axes.length * 10;

  const sortedAsc = [...axes].sort((a, b) => a.score - b.score);
  const weakest = sortedAsc[0].axis;
  const strongest = sortedAsc[sortedAsc.length - 1].axis;

  return {
    total,
    maxTotal,
    percentile: null,
    label: classify(axes),
    axes,
    scan,
    weakest,
    strongest,
  };
}

export { axisLabels } from './label.js';
export type { AxisName };
