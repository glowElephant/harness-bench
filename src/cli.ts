#!/usr/bin/env node
import pc from 'picocolors';
import { runScan } from './scanner/index.js';
import { scanMcp } from './scanner/mcp.js';
import { scoreScan } from './scoring/index.js';
import { renderRawDetails, renderTerminal } from './output/terminal.js';

interface Args {
  json: boolean;
  raw: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { json: false, raw: false, help: false };
  for (const a of argv.slice(2)) {
    if (a === '--json') args.json = true;
    else if (a === '--raw' || a === '-v') args.raw = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`
${pc.bold('harness-bench')} — How AI-Native is your dev environment?

${pc.bold('Usage:')}
  npx harness-bench [options]

${pc.bold('Options:')}
  --json     Output raw JSON instead of styled terminal card
  --raw, -v  Show per-axis raw metrics under the card
  --help     Show this help

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

  if (!args.json) {
    console.error(pc.gray('  Scanning ~/.claude/ ...'));
  }

  const scan = await runScan();
  const mcp = await scanMcp();
  const result = scoreScan(scan, mcp.numStartups);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(renderTerminal(result));
  if (args.raw) {
    console.log(renderRawDetails(result));
  }
}

main().catch((err) => {
  console.error(pc.red('harness-bench failed:'), err);
  process.exit(1);
});
