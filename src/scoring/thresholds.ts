/**
 * Absolute thresholds for each axis (0-10).
 *
 * Calibrated against:
 *  - CMM/CMMI maturity levels (L1 Ad-hoc -> L5 Optimizing)
 *  - Anthropic Claude Code documentation recommendations
 *  - Public AI-Native engineering writeups (Geoffrey Huntley, Simon Willison, swyx)
 *  - DORA metrics analogy (deployment frequency / lead time tiers)
 *
 * Each threshold table maps `[minValue, score]` ascending; pick the highest
 * tier whose minValue you reach.
 */

export type Tier = [number, number];

export const TIERS = {
  adoptionDepth: [
    [0, 0],
    [1, 2],
    [4, 4],
    [10, 6],
    [20, 8],
    [40, 10],
  ] satisfies Tier[],

  automationRatio: [
    [0, 0],
    [0.05, 2],
    [0.2, 4],
    [0.4, 6],
    [0.6, 8],
    [0.8, 10],
  ] satisfies Tier[],

  toolMakerRepos: [
    [0, 0],
    [1, 3],
    [2, 5],
    [4, 7],
    [6, 9],
    [9, 10],
  ] satisfies Tier[],

  hookCount: [
    [0, 0],
    [1, 2],
    [2, 4],
    [4, 6],
    [6, 8],
    [9, 10],
  ] satisfies Tier[],

  multiAgentPer100: [
    [0, 0],
    [0.2, 2],
    [0.8, 4],
    [2, 6],
    [5, 8],
    [10, 10],
  ] satisfies Tier[],

  numStartups: [
    [0, 0],
    [10, 2],
    [50, 4],
    [150, 6],
    [300, 8],
    [500, 10],
  ] satisfies Tier[],

  avgSessionLines: [
    [0, 0],
    [20, 2],
    [50, 4],
    [100, 6],
    [200, 8],
    [400, 10],
  ] satisfies Tier[],
} as const;

export function tierScore(tiers: Tier[], value: number): number {
  let result = 0;
  for (const [threshold, score] of tiers) {
    if (value >= threshold) result = score;
    else break;
  }
  return result;
}
