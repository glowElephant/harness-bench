#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import pc from 'picocolors';
import { runScan } from './scanner/index.js';
import { scanMcp } from './scanner/mcp.js';
import { scoreScan } from './scoring/index.js';
import { renderRawDetails, renderTerminal } from './output/terminal.js';
import { renderSvgCard } from './output/svg.js';
import { envDump } from './scanner/envdump.js';
import { analyzeWithAnthropic } from './analyze.js';
import { startMcpServer } from './mcp.js';

interface Args {
  json: boolean;
  raw: boolean;
  debug: boolean;
  help: boolean;
  svgPath: string | null;
  analyze: boolean;
  mcp: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    json: false,
    raw: false,
    debug: false,
    help: false,
    svgPath: null,
    analyze: false,
    mcp: false,
  };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--json') args.json = true;
    else if (a === '--raw' || a === '-v') args.raw = true;
    else if (a === '--debug') args.debug = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--analyze') args.analyze = true;
    else if (a === '--mcp') args.mcp = true;
    else if (a === '--svg') args.svgPath = rest[i + 1] ?? 'harness-card.svg';
    else if (a.startsWith('--svg=')) args.svgPath = a.slice('--svg='.length);
  }
  return args;
}

function printHelp() {
  console.log(`
${pc.bold('harness-bench')} — How AI-Native is your dev environment?

${pc.bold('Usage:')}
  npx harness-bench [options]

${pc.bold('Options:')}
  --json            Output raw JSON instead of styled terminal card
  --raw, -v         Show per-axis raw metrics under the card
  --svg [PATH]      Save a 1200x630 SVG share card (default: ./harness-card.svg)
  --debug           Show tool name histogram and subagent counts
  --analyze         Add LLM-based judgment on top of classic score
                    (requires ANTHROPIC_API_KEY env var)
  --mcp             Run as a stdio MCP server (for Claude Code / Cursor / Codex)
  --help            Show this help

${pc.bold('What it scans (locally only — nothing leaves your machine):')}
  ~/.claude/settings.json        hooks, plugins enabled
  ~/.claude/skills/, agents/     component counts
  ~/.claude.json                 MCP servers, startup count
  ~/.claude/projects/*.jsonl     session metadata (counts only, no content)
  github.com/<user>              public repos (Tool Maker axis, optional)

${pc.bold('Optional env vars:')}
  HARNESS_BENCH_GITHUB_USER      override autodetected GitHub handle

${pc.bold('Privacy:')}
  Code, prompts, and session content are never read or transmitted.
`);
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    return;
  }

  if (args.mcp) {
    await startMcpServer();
    return;
  }

  if (!args.json) {
    console.error(pc.gray('  Scanning ~/.claude/ ...'));
  }

  const scan = await runScan();
  const mcp = await scanMcp();
  const result = scoreScan(scan, mcp.numStartups);

  let analysis = null;
  if (args.analyze) {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error(
        pc.yellow(
          '  --analyze requires ANTHROPIC_API_KEY env var. Skipping LLM analysis.'
        )
      );
    } else {
      if (!args.json) console.error(pc.gray('  Analyzing with Claude...'));
      const env = await envDump();
      try {
        analysis = await analyzeWithAnthropic(result, env);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(pc.yellow(`  LLM analysis failed: ${msg}`));
      }
    }
  }

  if (args.json) {
    console.log(JSON.stringify({ classic: result, analysis }, null, 2));
    return;
  }

  console.log(renderTerminal(result));

  if (analysis) {
    console.log('');
    console.log(pc.bold('  LLM Analysis (Claude)'));
    console.log(pc.dim('  ' + '─'.repeat(54)));
    console.log(`  Classic total : ${pc.bold(`${analysis.classicTotal} / ${analysis.maxTotal}`)}`);
    console.log(`  Adjusted total: ${pc.bold(pc.cyan(`${analysis.adjustedTotal} / ${analysis.maxTotal}`))}`);
    console.log('');
    for (const a of analysis.axes) {
      if (a.delta === 0) continue;
      const sign = a.delta > 0 ? '+' : '';
      console.log(
        `    ${pc.gray(a.axis.padEnd(20))} ${a.classicScore} → ${pc.bold(String(a.adjustedScore))} (${sign}${a.delta})  ${pc.dim(a.reason ?? '')}`
      );
    }
    if (analysis.findings.length > 0) {
      console.log('');
      console.log(pc.bold('  Findings:'));
      for (const f of analysis.findings) console.log(`    ${pc.gray('·')} ${f}`);
    }
    console.log('');
  }
  if (args.raw) {
    console.log(renderRawDetails(result));
  }
  if (args.svgPath) {
    const out = resolve(process.cwd(), args.svgPath);
    await fs.writeFile(out, renderSvgCard(result), 'utf-8');
    console.log(pc.gray(`  SVG card written to ${out}`));
    console.log('');
  }
  if (args.debug) {
    console.log(pc.dim('  Tool name histogram (top 20):'));
    const sorted = Object.entries(scan.toolNameHistogram).sort(
      (a, b) => b[1] - a[1]
    );
    for (const [name, count] of sorted.slice(0, 20)) {
      console.log(`    ${pc.cyan(name.padEnd(36))} ${count}`);
    }
    console.log('');
    console.log(pc.dim(`  Session files: ${scan.sessions} (subagent: ${scan.subagentFiles})`));
    console.log('');
  }
}

main().catch((err) => {
  console.error(pc.red('harness-bench failed:'), err);
  process.exit(1);
});
