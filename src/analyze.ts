/**
 * CLI `--analyze` mode: call Anthropic API with classic score + env dump,
 * receive judgment-based adjustments, return adjusted report.
 *
 * Requires ANTHROPIC_API_KEY. Falls back to printing a message if absent.
 *
 * This is the BYO-API-key path. The MCP mode (no key needed) does the same
 * thing but uses the calling agent's LLM. Both exist for different audiences:
 *   - CLI --analyze: one-shot CLI users (devs, CI)
 *   - MCP server:    Claude Code / Cursor / Codex users (no key)
 */

import type { BenchmarkResult } from './types.js';
import type { EnvDump } from './scanner/envdump.js';

interface AdjustmentResult {
  classicTotal: number;
  adjustedTotal: number;
  maxTotal: number;
  axes: Array<{
    axis: string;
    classicScore: number;
    adjustedScore: number;
    delta: number;
    reason?: string;
  }>;
  findings: string[];
  rawLlmText: string;
}

const PROMPT_TEMPLATE = (classic: BenchmarkResult, env: EnvDump): string =>
  `You are auditing a developer's Claude Code environment for Harness Benchmark scoring.

The classic heuristic produced this score (8 axes, 0-10 each):
${JSON.stringify(classic.axes.map((a) => ({ axis: a.axis, score: a.score, rawMetrics: a.rawMetrics })), null, 2)}

Total: ${classic.total} / ${classic.maxTotal}

Here is the full environment metadata (file names only, no contents):
${JSON.stringify(env, null, 2)}

Your task: decide whether the heuristic missed assets, wrongly counted some, or
has user-specific patterns the rigid scoring can't capture.

Output STRICT JSON in this exact format (no other text):
{
  "adjustments": [
    {"axis": "<axis name>", "delta": <number from -2 to +2>, "reason": "<one sentence citing file name>"}
  ],
  "findings": [
    "<free-form insight, one per item>"
  ]
}

Axes available: adoptionDepth, automation, contextEfficiency, toolMaker, safetyGuards, multiAgent, portability, learningSpeed.

Rules:
- Cite specific file names in reasons.
- Prefer small adjustments. Large adjustments need strong evidence.
- Do not invent files that are not in the metadata.
- Findings are optional but appreciated when they reveal real workflow gaps.
`;

interface AdjustmentItem {
  axis: string;
  delta: number;
  reason?: string;
}

interface LlmReply {
  adjustments: AdjustmentItem[];
  findings: string[];
}

export async function analyzeWithAnthropic(
  classic: BenchmarkResult,
  env: EnvDump
): Promise<AdjustmentResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = process.env.HARNESS_BENCH_MODEL ?? 'claude-haiku-4-5-20251001';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: PROMPT_TEMPLATE(classic, env) }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const rawText = data.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('');

  let parsed: LlmReply;
  try {
    const m = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(m ? m[0] : rawText) as LlmReply;
  } catch {
    return {
      classicTotal: classic.total,
      adjustedTotal: classic.total,
      maxTotal: classic.maxTotal,
      axes: classic.axes.map((a) => ({
        axis: a.axis,
        classicScore: a.score,
        adjustedScore: a.score,
        delta: 0,
      })),
      findings: ['LLM response was not valid JSON; no adjustments applied.'],
      rawLlmText: rawText,
    };
  }

  const adjusted = classic.axes.map((a) => {
    const matching = (parsed.adjustments ?? []).filter((adj) => adj.axis === a.axis);
    const delta = matching.reduce((s, m) => s + (m.delta ?? 0), 0);
    const newScore = Math.max(0, Math.min(10, a.score + delta));
    return {
      axis: a.axis,
      classicScore: a.score,
      adjustedScore: newScore,
      delta,
      reason: matching.map((m) => m.reason).filter(Boolean).join('; '),
    };
  });

  const adjustedTotal = adjusted.reduce((s, a) => s + a.adjustedScore, 0);

  return {
    classicTotal: classic.total,
    adjustedTotal,
    maxTotal: classic.maxTotal,
    axes: adjusted,
    findings: parsed.findings ?? [],
    rawLlmText: rawText,
  };
}
