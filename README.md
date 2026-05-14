# harness-bench

[![npm version](https://img.shields.io/npm/v/harness-bench.svg)](https://www.npmjs.com/package/harness-bench)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-brightgreen.svg)](https://nodejs.org)

> **How AI-Native is your dev environment?**
> A CLI that benchmarks your Claude Code harness across 8 axes — in under 5 seconds, with zero data leaving your machine.

```bash
npx harness-bench
```

<p align="center">
  <img src="docs/sample-card.svg?v=v1.1" alt="Sample score card — author's own setup" width="780">
</p>

<details>
<summary>Terminal output preview</summary>

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Harness Benchmark                                v1.1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Adoption Depth   ███████████░░░  8/10
  Automation       ███████████░░░  8/10
  Context Eff.     ███████████░░░  8/10
  Tool Maker       ██████████████ 10/10
  Safety Guards    ██████████████ 10/10
  Multi-Agent      ██████████████ 10/10
  Portability      ██████████████ 10/10
  Learning Speed   ██████████████ 10/10

──────────────────────────────────────────────────────
  TOTAL            74 / 80
  LABEL            🛠  Tool Maker

  You don't use AI. You build environments where AI thrives.
──────────────────────────────────────────────────────
```

</details>

---

## Why this exists

Every Claude Code user has a setup — some hooks here, an MCP server there, a CLAUDE.md file
somewhere. But how do you know if that setup is **actually** advanced, or just busy?
Is it production-grade or cargo-cult?

`harness-bench` gives you an objective score across 8 axes, calibrated against:
- CMM/CMMI maturity levels (L1 Ad-hoc → L5 Optimizing)
- Anthropic Claude Code documentation recommendations
- Public AI-Native engineering writeups (Geoffrey Huntley, Simon Willison, swyx)
- DORA metrics analogy (deployment frequency / lead time tiers)

It is opinionated, but the thresholds are written down in
[`src/scoring/thresholds.ts`](src/scoring/thresholds.ts) — disagree and PR.

## The 8 axes

| Axis | What it measures | Where the data comes from |
|---|---|---|
| **Adoption Depth** | MCP servers + skills + agents | `~/.claude.json`, `~/.claude/skills/`, `~/.claude/agents/` |
| **Automation** | Tool calls per assistant message | `~/.claude/projects/*.jsonl` (counts only) |
| **Context Efficiency** | Avg session length + compaction usage | session metadata |
| **Tool Maker** | Public repos matching AI-infra keywords | GitHub public API |
| **Safety Guards** | Hook count + event diversity | `~/.claude/settings.json` |
| **Multi-Agent** | Task tool calls per 100 messages | session metadata |
| **Portability** | Global CLAUDE.md + dotfiles repo + sync script | filesystem |
| **Learning Speed** | Startup count × component breadth | `~/.claude.json` |

## The 6 character labels

Your 8 scores → one personality:

- 🛠 **Tool Maker** — high Tool Maker + Safety. *You build environments where AI thrives.*
- ⚡ **Speed Demon** — high Automation + Multi-Agent. *The bottleneck is no longer typing.*
- 🧙 **Solo Wizard** — broad mastery but low Portability. *A castle built for one.*
- 🌊 **Vibe Coder** — high Automation, low Safety. *Ships fast — and breaks fast.*
- 🔬 **Tinkerer** — adopting fast, components growing. *Day 47 of trying every new MCP.*
- 📦 **Cargo Culter** — installed but unused. *Configured but not internalized.*

## Privacy

`harness-bench` reads **counts and configuration only**. It never:
- reads message content, prompts, or tool inputs/outputs
- reads source code in your repos
- transmits anything to a server (v0.1 — fully offline)

The only network call is to the public GitHub REST API to count your public repos
(optional, for the Tool Maker axis — set `HARNESS_BENCH_GITHUB_USER` to override).

## Usage

### Three modes

```bash
# 1. Classic (heuristic only — fast, deterministic, no network)
npx harness-bench

# 2. LLM-augmented (BYO API key — judgment on top of heuristic)
ANTHROPIC_API_KEY=sk-... npx harness-bench --analyze

# 3. MCP server (no API key — your agent's LLM does the analysis)
npx harness-bench install     # one-shot: detects Claude Code, registers, sets env vars
# Then in Claude Code (new session): "Run harness-bench scan and analyze my environment"
```

The `install` command auto-detects Claude Code, fills env vars, backs up your config,
and prints copy-paste instructions for Cursor / Codex / Gemini CLI / Aider users.

Why three? The classic heuristic is calibrated against author's environment (n=1)
and miss assets in non-standard locations. The LLM-augmented modes inspect your
actual file layout and adjust the score per-axis.

### Other options

```bash
npx harness-bench --json              # Raw JSON
npx harness-bench --raw               # Per-axis raw metrics
npx harness-bench --svg               # 1200x630 SVG share card
npx harness-bench --svg=./my.svg
npx harness-bench --debug             # Tool histogram + subagent counts
```

### Env vars (override autodetection)

```bash
HARNESS_BENCH_GITHUB_USER=yourname        # Override github user
HARNESS_BENCH_SYNC_SCRIPT=/path/to/sync   # Non-standard sync script location
HARNESS_BENCH_DOTFILES_DIR=/path/to/dot   # Non-standard dotfiles dir
HARNESS_BENCH_MODEL=claude-sonnet-4-6     # Model for --analyze (default: haiku)
```

Requires Node.js ≥ 18. Works on macOS, Linux, and Windows (Git Bash / PowerShell / cmd).

## Reference benchmark

The author's own setup, as of release:

| Axis | Score | Raw |
|---|---:|---|
| Adoption Depth | 8/10 | 8 MCP + 10 skills + 8 agents = 26 |
| Automation | 8/10 | 11,699 tool uses / 18,402 msgs = 63.6% |
| Context Efficiency | 8/10 | avg 102 lines/session + compaction events present |
| Tool Maker | 10/10 | 10 infra repos |
| Safety Guards | 10/10 | 12 hooks across 9 event kinds |
| Multi-Agent | 10/10 | 455 multi-agent calls + 978/1022 subagent files (95.5%) |
| Portability | 10/10 | CLAUDE.md + dotfiles + sync.py (env var required for non-standard location) |
| Learning Speed | 10/10 | 390 startups + 10 skills + 8 MCPs |
| **TOTAL** | **74/80** | 🛠 Tool Maker |

> Note: 74/80 requires env vars set (`HARNESS_BENCH_SYNC_SCRIPT`, `HARNESS_BENCH_DOTFILES_DIR`).
> Without env vars the heuristic alone scores 67/80 — this gap is intentional and explains why v1.0+ added `--mcp` / `--analyze` modes.

The author scores 74, not 80, on purpose. The thresholds aren't calibrated to make the
maintainer look good — they're calibrated to the literature. If you score higher, ship a
PR with your reference benchmark.

## Roadmap

- **v0.2** — `--svg` share card, better Multi-Agent detection (SendMessage + subagent files), `--debug` mode ✅
- **v0.3** — PNG output (resvg-js), anonymous global percentile, Cursor adapter
- **v0.4** — Codex and Aider adapters, time series ("your AI-Native score over 6 months")
- **v0.5** — team mode (org-level aggregates)

## Contributing

Disagreements about thresholds are the whole point. If you think Tool Maker shouldn't
weigh keyword-match so heavily, or that Multi-Agent should account for parallel-agent
patterns beyond the Task tool — open an issue or PR against
[`src/scoring/`](src/scoring/).

## License

MIT — see [LICENSE](LICENSE).

## Related

- [`context-forge`](https://github.com/glowElephant/context-forge) — bootstrap a fully
  context-engineered repo from a 5-minute discussion. The harness this benchmark
  measures is the one `context-forge` helps you build.

---

한국어 README는 [README.ko.md](README.ko.md) 참고.
