# Show HN drafts — harness-bench

Two variants. Pick one, post at Tue–Thu 09:00 PT (= Korea Wed–Fri 01:00).
Stay in the thread for the first 60 minutes — comments matter more than upvotes.

---

## Variant A — Honest / Self-deprecating (recommended)

**Title (≤ 80 chars):**
Show HN: Harness Bench – How AI-Native is your Claude Code setup? (I score 72/80)

**Body:**

I kept seeing the same question on Discord and Twitter: "How is your Claude Code setup
actually configured?" Everyone has an opinion, nobody has a number.

So I built `harness-bench` — a CLI that scans your local `~/.claude/` and scores it
across 8 axes (Adoption Depth, Automation, Context Efficiency, Tool Maker, Safety
Guards, Multi-Agent, Portability, Learning Speed).

```
npx harness-bench
```

Thresholds are calibrated against CMM maturity levels, Anthropic's Claude Code docs,
and public AI-Native engineering writeups (Geoffrey Huntley, Simon Willison, swyx).
The thresholds are written down in `src/scoring/thresholds.ts` — disagree and PR.

A few things I tried to get right:

1. **It only reads metadata.** Counts of skills, MCP servers, hook events, session
   line counts. It never opens message content, prompts, or your repo source. The
   only network call is the public GitHub API (and you can disable it).

2. **The author doesn't score 80/80.** I score 72 — my Adoption Depth and Context
   Efficiency are middling, and that's in the README as the reference benchmark. If
   the thresholds were tuned to make me look good they'd be useless.

3. **The most interesting finding so far:** my v0.1 told me my Multi-Agent score was
   2/10 because I was only counting `Task`/`Agent` tool names. In v0.2 I started
   counting subagent jsonl files (which Claude Code spawns for parallel work) and
   found that 976 of my 1,022 session files were subagents — 95.5%. The measurement,
   not the behavior, was wrong. README and CHANGELOG document the change.

It runs in ~5 seconds on my setup. Source is MIT, written in TypeScript.

Repo: https://github.com/glowElephant/harness-bench
NPM:  https://www.npmjs.com/package/harness-bench

What I'd love feedback on:
- Are the 8 axes the right ones? What's missing? (Especially: any signal for
  "learning speed" that doesn't just proxy off startup count?)
- Should the percentile leaderboard be opt-in upload or fully local-only?

---

## Variant B — Provocative / Industry-positioning

**Title (≤ 80 chars):**
Show HN: I built an AI-Native dev environment benchmark. Here are my scores.

**Body:**

Almost every engineer I talk to either says "AI doesn't help me much" or "AI gives me
10x productivity." Neither side has a yardstick.

`harness-bench` is one yardstick — eight axes that try to capture *how* you use Claude
Code, not just *whether* you use it. It runs against your local `~/.claude/`,
takes 5 seconds, sends nothing.

```
npx harness-bench
```

The axes:
- Adoption Depth (MCP + skills + agents)
- Automation (tool calls per assistant message)
- Context Efficiency (session length + compaction)
- Tool Maker (do you build AI infra, or just consume it?)
- Safety Guards (hook count + diversity — PreToolUse blocks for rm-rf, force-push, .env, etc.)
- Multi-Agent (parallel subagent usage)
- Portability (can a new machine reproduce your setup?)
- Learning Speed (proxy: startup count × component breadth)

Each axis has an absolute 0–10 threshold table (CMM/Anthropic-anchored), and a
character label that combines them (Tool Maker / Speed Demon / Solo Wizard / Vibe
Coder / Tinkerer / Cargo Culter).

My own score: **72/80, "Tool Maker"** — the weakest axis is Adoption Depth, which
told me my problem isn't building more tools, it's actually configuring more of the
ones that already exist. That kind of mirror is what the tool is for.

The thresholds are opinionated and I'd love HN to argue with them. The relevant file
is `src/scoring/thresholds.ts` (~60 lines).

Repo: https://github.com/glowElephant/harness-bench
NPM:  https://www.npmjs.com/package/harness-bench

---

## Comment readiness — answers to predicted questions

**Q: Privacy. Are you sure it doesn't send my code?**
A: The only network call is the public GitHub API for repo metadata. You can disable
it by not setting `HARNESS_BENCH_GITHUB_USER`. Source: `src/scanner/`. Nothing else
touches the network.

**Q: How are thresholds derived?**
A: I anchored each axis to one of (a) CMM/CMMI maturity levels, (b) Anthropic's
Claude Code docs recommendations, (c) public writeups by Geoffrey Huntley / Simon
Willison / swyx, (d) DORA metrics analogy. See `src/scoring/thresholds.ts` for the
explicit tier tables. Each tier comment has a one-line rationale.

**Q: Only Claude Code? What about Cursor/Codex/Aider?**
A: v0.3+ will ship adapters. Most of the work was building the score-calibration
framework. The scanner is the swappable part.

**Q: Why "harness"?**
A: Geoffrey Huntley's term, increasingly common in AI-Native engineering writeups.
It captures the idea that you're not running the LLM, you're running an apparatus
around it.

**Q: The author scoring 72/80 — isn't that suspicious?**
A: If I'd tuned the thresholds to my setup, I'd score 80. The thresholds were set
first (anchored to literature), then I measured myself. v0.1 score was 62 — v0.2's
improvement came from fixing measurement bugs, not loosening thresholds.

**Q: What if I run this and it just tells me I'm a Cargo Culter?**
A: That's the point. Better signal than not knowing.

---

## Distribution checklist (post-publish)

- [x] npm publish v0.2.0
- [ ] Verify `npx harness-bench` works on fresh machine (no node_modules cache)
- [ ] Generate sample SVG card → commit to `docs/sample-card.svg` → embed in README
- [ ] Submit to awesome-claude-code, awesome-claude-skills (PR with "type: tool")
- [ ] Post to r/ClaudeAI with terminal screenshot + npm link
- [ ] X/Twitter: post SVG card + 1-line + repo link, tag @AnthropicAI cautiously
- [ ] Discord (Anthropic official #showcase)
- [ ] GeekNews (news.hada.io) — Korean community
- [ ] Show HN — pick variant, post Tue–Thu 09:00 PT (Korea Wed–Fri 01:00)

## Stay-in-thread responses (first 60 min)

- Engage critique substantively. Don't get defensive on thresholds — invite PRs.
- If someone posts their score in the comments, ask which axis surprised them most.
- If someone says "this is just survey-ware," point to `src/scanner/` and emphasize
  that the data is from their machine, not a self-report.
- If someone asks about non-Claude tools, validate it as v0.3 work, don't oversell timeline.
