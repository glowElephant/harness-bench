# r/ClaudeAI post draft — harness-bench

Channel: https://www.reddit.com/r/ClaudeAI
Best timing: Tue–Thu 09:00–11:00 ET (= Korea Wed–Fri 22:00–24:00).
Attach: `docs/sample-card.svg` (export to PNG first — reddit prefers raster).
**Required flair: "Built with Claude"** (most popular flair, fits Rule #7).
Stay in thread for first 60 minutes — answer every top-level comment.

---

## Subreddit rules compliance (r/ClaudeAI, 12 rules verified 2026-05-18)

The only relevant gate is **Rule #7 — Showcase**. It permits self-promotion if
ALL of these hold. Audit before posting:

| Requirement | Status | Where in post |
|---|---|---|
| Built with Claude/Claude Code or specifically FOR Claude, BY YOU | ✅ | Add sentence: "Built FOR Claude Code users — `harness-bench` reads `~/.claude/`." |
| Clear description of what was built + how Claude helped + what it does | ✅ | 8-axis table + author-score section |
| Free to try, and say so | ✅ | "MIT, free, no paid tier" — add explicitly |
| Promotional language minimal | ⚠️ | Variant A title is clickbait-ish; B/C safer |
| No referral links | ✅ | Only github.com + npmjs.com |

Other rules — quick check:
- #1 Respectful, #2 Relevant (Claude-specific), #3 Constructive — ✅
- #4 Performance complaints in Megathread only — N/A
- #6 Competitor posts — N/A
- #9 Use relevant flair — set "Built with Claude"
- #10 No vote manipulation — **do NOT message friends to upvote** (instant ban)

**Posting account hygiene** — reddit auto-mod may filter:
- Accounts < 30 days old or low karma → may auto-remove. If author account is
  new/low-karma, message mods first via modmail with a 2-line pitch.

---

---

## Title (pick one)

**A. Score-bait (recommended for r/ClaudeAI engagement)**
> I built a CLI that scores your Claude Code setup across 8 axes. I got 74/80 — what's yours?

**B. Question-first**
> How AI-Native is your Claude Code setup, actually? I wrote a 5-second benchmark to find out.

**C. Tool-first (drier, safer)**
> harness-bench: open-source CLI that scores your ~/.claude/ across 8 axes (npx, 5 seconds, offline)

---

## Body

Hey r/ClaudeAI 👋

Every time someone posts "my Claude Code setup" here, I find myself wondering: *is
this person actually advanced, or just busy?* Everyone has hooks, MCP servers,
CLAUDE.md files — but there's no shared yardstick for whether the setup is
production-grade or cargo-cult.

So I built one — **a CLI built specifically for Claude Code users**, that reads
your local `~/.claude/` and scores it. MIT, free, no paid tier. I built it with
Claude Code itself (eating my own dogfood — the multi-agent and tool-maker axes
exist because Claude Code's parallel-agent and skill-authoring affordances are
what I wanted to measure).

```
npx harness-bench
```

Runs in ~5 seconds. Reads `~/.claude/` **metadata only** — counts of skills, MCP
servers, hook events, session line counts. **It never opens message content, prompts,
or your source code.** The only network call is the public GitHub API to count your
infra repos (and you can disable that).

### The 8 axes

| Axis | What it measures |
|---|---|
| Adoption Depth | MCP servers + skills + agents installed and used |
| Automation | Tool calls per assistant message |
| Context Efficiency | Avg session length + compaction usage |
| Tool Maker | Public repos matching AI-infra keywords |
| Safety Guards | Hook count + event diversity (PreToolUse blocks for rm-rf, .env, force-push, etc.) |
| Multi-Agent | Parallel subagent usage |
| Portability | Global CLAUDE.md + dotfiles repo + sync script |
| Learning Speed | Startup count × component breadth |

Thresholds are anchored to **CMM/CMMI maturity levels, Anthropic's Claude Code docs,
DORA metrics analogy**, and public AI-Native engineering writeups (Geoffrey Huntley,
Simon Willison, swyx). The threshold tables are 60 lines of TypeScript with sources
in comments — disagree and PR.

You also get one of 6 character labels:
- 🛠 **Tool Maker** — high Tool Maker + Safety
- ⚡ **Speed Demon** — high Automation + Multi-Agent
- 🧙 **Solo Wizard** — broad mastery, low Portability
- 🌊 **Vibe Coder** — high Automation, low Safety
- 🔬 **Tinkerer** — adopting fast, components growing
- 📦 **Cargo Culter** — installed but unused

### My own score

**74/80, Tool Maker.**

Three axes (Adoption Depth, Automation, Context Efficiency) sit at 8/10. That's in
the README as the reference benchmark — if the thresholds were tuned to make me look
good they'd be useless. v0.1 of this tool actually scored me 62. v0.2 → 72, v1.1 →
74. Every bump came from fixing measurement bugs, not loosening thresholds (see
CHANGELOG).

[sample card image attached]

### Repo / npm

- GitHub: https://github.com/glowElephant/harness-bench
- npm: https://www.npmjs.com/package/harness-bench
- MIT, TypeScript

### What I'd love feedback on

1. **Are the 8 axes the right ones?** What's missing? (especially: any signal for
   "learning speed" that doesn't just proxy off startup count?)
2. **If you ran it, what's your score?** What's the gap between the number and how
   advanced you *feel*? That mismatch is the most interesting data.
3. **Cursor / Codex / Aider users** — v1.0 has an MCP-server mode that lets your
   agent's LLM analyze the env dump. Would adapters for other tools change your use
   of it?

I'll be in the thread for the next hour.

---

## Comment-ready answers

**"Privacy — does it really not send my code?"**
> Only network call is `api.github.com/users/{you}/repos` (metadata only). You can
> set `HARNESS_BENCH_GITHUB_USER=none` to skip even that. Source: `src/scanner/` is
> ~300 lines, easy to audit. Nothing else touches the network.

**"How were thresholds set?"**
> Each axis is anchored to one of: (a) CMM/CMMI maturity tiers, (b) Anthropic's
> Claude Code docs recommendations, (c) public writeups by Huntley/Willison/swyx,
> (d) DORA metrics analogy. `src/scoring/thresholds.ts` has the tier tables with
> one-line citations per tier.

**"Only Claude Code?"**
> Scanner reads `~/.claude/` today. v1.0 added MCP server mode so Cursor/Codex/Aider
> users can invoke it from their own agent — the LLM does the analysis instead of
> the heuristic. Native adapters (reading `~/.cursor/`, `~/.codex/`) are on the v1.2
> roadmap.

**"Why 'harness'?"**
> Geoffrey Huntley's term, now common in AI-Native engineering writeups. Captures
> the idea that you're not running the LLM, you're running an apparatus *around* it.

**"I scored low — does that mean I'm bad?"**
> No — it means the heuristic didn't find your setup. If you have a non-standard
> layout (custom dotfiles dir, sync script in a weird place), set the env vars
> (`HARNESS_BENCH_SYNC_SCRIPT`, `HARNESS_BENCH_DOTFILES_DIR`) or use `--analyze` /
> `--mcp` mode so an LLM can audit what the heuristic missed.

**"This is just survey-ware / vibe-checking."**
> Data is from your machine, not self-report. `src/scanner/` is the entire data
> source. Run with `--debug` to see the raw counts the heuristic used.

**"What if I'm a Cargo Culter?"**
> That's the point of the mirror. Better signal than not knowing.

---

## Stay-in-thread rules (first 60 min)

- **Engage critique substantively.** Don't get defensive on thresholds — invite PRs.
- **If someone posts their score**, ask which axis surprised them most. That's the
  highest-engagement question.
- **If someone says "this is gatekeeping"**, agree it could look like that and
  re-emphasize: thresholds are anchored to public literature, author scores 74 not
  80, source is open.
- **If someone asks about non-Claude tools**, validate v1.2 roadmap honestly. Don't
  oversell timeline.
- **Don't link other repos** in the same thread (will look promotional). If asked
  about Molten / claude-session-manager / context-forge, mention by name only.

---

## Post-publish checklist

- [ ] Sample card PNG attached (not SVG — reddit fights SVG)
- [ ] Flair set (check sub rules — likely "Tool" or "Showcase")
- [ ] First comment posted by author with `--debug` example output (seeds Q&A)
- [ ] Watch first 30 min — top comment determines the thread's direction
- [ ] If thread takes off: cross-post to r/LocalLLaMA (different sub, different framing required)
- [ ] If thread flops: do NOT delete. Wait 24h, then post Variant B or C with a different angle.
