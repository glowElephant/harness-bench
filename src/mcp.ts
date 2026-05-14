/**
 * MCP server entry for harness-bench.
 *
 * Exposes three tools so Claude Code / Cursor / Codex can call the scanner
 * locally and have their own LLM augment the classic score with judgment-based
 * analysis. No API key needed — the calling agent's LLM does the analysis.
 *
 * Tools:
 *   - harness_scan_classic: 8-axis score (same as CLI default)
 *   - harness_scan_full:    classic + full environment metadata (file names,
 *                           non-standard candidates, detection notes)
 *   - harness_recommend:    accepts an LLM analysis result and returns an
 *                           adjusted score + summary
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { runScan } from './scanner/index.js';
import { scanMcp } from './scanner/mcp.js';
import { envDump } from './scanner/envdump.js';
import { scoreScan } from './scoring/index.js';

const SERVER_NAME = 'harness-bench';
const SERVER_VERSION = '1.0.0';

export async function startMcpServer(): Promise<void> {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'harness_scan_classic',
        description:
          'Run the 8-axis Harness Benchmark scan and return the classic score ' +
          '(same output as `npx harness-bench` JSON mode). No analysis — pure heuristic.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'harness_scan_full',
        description:
          'Run the classic scan AND dump full environment metadata for LLM analysis. ' +
          'Use this when you (the calling agent) want to judge whether the heuristic ' +
          'missed assets, miscategorized something, or has user-specific patterns. ' +
          'The metadata is file-name level only — no content is exposed.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'harness_recommend',
        description:
          'Accept an LLM analysis result (adjustments + recommendations) and return ' +
          'a final report: classic vs adjusted score, character label, and actionable ' +
          'suggestions. Call after analyzing the output of harness_scan_full.',
        inputSchema: {
          type: 'object',
          properties: {
            adjustments: {
              type: 'array',
              description:
                'Per-axis score adjustments (delta from classic). E.g. ' +
                '[{"axis":"adoptionDepth","delta":+1,"reason":"non-standard skill found"}].',
              items: {
                type: 'object',
                properties: {
                  axis: { type: 'string' },
                  delta: { type: 'number' },
                  reason: { type: 'string' },
                },
                required: ['axis', 'delta'],
              },
            },
            findings: {
              type: 'array',
              description: 'Free-form findings the LLM wants surfaced in the final report.',
              items: { type: 'string' },
            },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      if (name === 'harness_scan_classic') {
        const scan = await runScan();
        const mcp = await scanMcp();
        const result = scoreScan(scan, mcp.numStartups);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      if (name === 'harness_scan_full') {
        const [scan, mcp, env] = await Promise.all([runScan(), scanMcp(), envDump()]);
        const classic = scoreScan(scan, mcp.numStartups);
        const payload = {
          classic,
          environment: env,
          instructionsForLlm: [
            'Inspect environment.skillsFiles, environment.agentsFiles, environment.nonStandardCandidates.',
            'For each, decide if the classic scan likely missed an asset (false negative) or wrongly counted one (false positive).',
            'Return per-axis adjustments via the harness_recommend tool. Each adjustment must include a reason citing a file name.',
            'Do NOT read file contents. File names + counts are sufficient — judgments must be name- and structure-based only.',
            'Prefer small adjustments (-2 to +2 per axis). Large adjustments require strong, specific evidence.',
          ],
        };
        return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
      }

      if (name === 'harness_recommend') {
        const scan = await runScan();
        const mcp = await scanMcp();
        const classic = scoreScan(scan, mcp.numStartups);

        const adjustments = (args?.adjustments ?? []) as Array<{
          axis: string;
          delta: number;
          reason?: string;
        }>;
        const findings = (args?.findings ?? []) as string[];

        const adjustedAxes = classic.axes.map((a) => {
          const matching = adjustments.filter((adj) => adj.axis === a.axis);
          const delta = matching.reduce((sum, m) => sum + (m.delta ?? 0), 0);
          const newScore = Math.max(0, Math.min(10, a.score + delta));
          return { ...a, score: newScore, classicScore: a.score, delta };
        });

        const adjustedTotal = adjustedAxes.reduce((s, a) => s + a.score, 0);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  classicTotal: classic.total,
                  adjustedTotal,
                  maxTotal: classic.maxTotal,
                  label: classic.label,
                  axes: adjustedAxes,
                  appliedAdjustments: adjustments,
                  findings,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: 'text', text: `Error in ${name}: ${msg}` }], isError: true };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
