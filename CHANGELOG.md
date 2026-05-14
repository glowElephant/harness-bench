# Changelog

## v1.0.0 — 2026-05-14

### Major
- **MCP server mode (`--mcp`)** — run as stdio MCP for Claude Code / Cursor / Codex.
  Exposes `harness_scan_classic`, `harness_scan_full`, `harness_recommend` tools.
  The calling agent's LLM does judgment-based analysis; no API key needed.
- **CLI `--analyze` mode** — adds LLM-based judgment on top of the classic score.
  BYO ANTHROPIC_API_KEY. Catches assets the heuristic misses, miscategorizations,
  and user-specific patterns. Returns classic + adjusted scores.
- **`envDump()` function** — exposes full environment metadata (file names only,
  never contents) so an LLM can audit the heuristic's blind spots.

### Why this is v1.0
v0.x relied on rigid heuristics calibrated against the author's n=1 environment.
Anyone with a non-standard `~/.claude/` layout, custom dotfiles location, or
domain-specific naming saw inaccurate scores. v1.0 fixes the n=1 problem two ways:
- **Heuristic side:** env var overrides (`HARNESS_BENCH_SYNC_SCRIPT`,
  `HARNESS_BENCH_DOTFILES_DIR`, `HARNESS_BENCH_GITHUB_USER`), broader
  detection paths (chezmoi, yadm, .config, .dotfiles), and `gh CLI` /
  git remote URL fallbacks for username detection.
- **LLM side:** an agent that already has local access (Claude Code, Cursor,
  Codex) can call the MCP server and inspect the full environment dump, returning
  per-axis adjustments that the heuristic alone can't produce.

### Author's reference benchmark update
- Without env vars (pure v1 heuristics): **67/80** — Portability tanked because
  the author's sync.py lives in a non-standard `graph-RAG-study/` location.
- With env vars: **74/80** (same as v0.2 measurement).

The 67 ↔ 74 gap is intentional and illustrative: the heuristic can't and shouldn't
know about every user's idiosyncratic setup. That's what `--analyze` and `--mcp`
exist to fix.

### Changed
- `sync.ts` removed hardcoded `C:/Git/graph-RAG-study/` paths (rule violation in v0.x).
- `github.ts` no longer derives username from gitconfig email split. Now tries
  `gh api user` → git remote URL → gitconfig `user.user` field in that order.
- `INFRA_KEYWORDS` expanded: now includes `copilot`, `cursor`, `codex`, `aider`,
  `windsurf`, `gpt`, `gemini`, `llm`, `vector`, `embedding`, `retrieval` alongside
  Claude-ecosystem terms.

### Privacy invariant (unchanged)
File names, counts, hook events, and config values may be sent to the LLM in
`--analyze` mode. Message content, source code, and prompt bodies are never read.

## v0.2.0 — 2026-05-14

### Added
- `--svg [PATH]` flag: writes a 1200×630 share card SVG (X/Twitter, OG image friendly)
- `--debug` flag: prints tool-name histogram + subagent file count for transparency
- `subagentFiles` / `subagentRatio` tracking in `ScanResult` — captures parallel session usage that pure tool-call counts miss
- Multi-Agent axis now considers: Task, Agent, **SendMessage**, **TaskCreate**, **TaskUpdate**, **Skill** (was Task+Agent only)
- Multi-Agent axis adds subagent-ratio bonus (up to +4) on top of tool-call base score

### Changed
- Compaction event types now include `ai-title`, `last-prompt` (closer to actual jsonl emissions); `summary`/`compact` kept
- Author's reference benchmark updated: **62/80 → 72/80** — almost entirely from Multi-Agent measurement correctness, not threshold loosening

### Why this matters
v0.1's Multi-Agent score was misleadingly low because we only counted `Task`/`Agent` tool names from a SAMPLE_PER_FILE=200 window. Real parallel-agent usage shows up as subagent jsonl files and as `SendMessage`/`TaskCreate` calls. v0.2 captures both. Thresholds were not changed.

## v0.1.0 — 2026-05-14

Initial release.
- Scanner: settings/mcp/components/sessions/github/sync
- 8-axis scoring with absolute thresholds (CMM + Anthropic + industry sources)
- 6 character labels (Tool Maker / Speed Demon / Solo Wizard / Vibe Coder / Tinkerer / Cargo Culter)
- CLI with `--json`, `--raw`, `--help`
- Privacy: metadata only, never reads message content or transmits anything
- Author's reference: 62/80, Tool Maker
