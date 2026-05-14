# Changelog

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
