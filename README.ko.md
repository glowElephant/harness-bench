# harness-bench

> **당신의 개발 환경은 얼마나 AI Native한가?**
> Claude Code 하네스를 8축으로 5초 안에 벤치마크. 데이터는 컴퓨터 밖으로 한 byte도 나가지 않음.

```bash
npx harness-bench
```

## 왜 만들었나

Claude Code 사용자는 다 자기만의 셋업이 있음 — 훅 몇 개, MCP 한두 개, CLAUDE.md 어딘가에. 근데 그 셋업이 **실제로** 발전된 건지, 그냥 바쁘기만 한 건지 어떻게 알지? 프로덕션급인지 cargo-cult인지?

`harness-bench`는 객관적인 점수를 8축으로 제공함. 기준:
- CMM/CMMI 성숙도 모델 (L1 Ad-hoc → L5 Optimizing)
- Anthropic Claude Code 공식 문서 권장사항
- 공개 AI Native 엔지니어링 글들 (Geoffrey Huntley, Simon Willison, swyx)
- DORA 메트릭스 유추 (배포 빈도/리드타임 티어)

주관적이지만, 임계값은 [`src/scoring/thresholds.ts`](src/scoring/thresholds.ts)에 명문화돼 있음. 동의 안 하면 PR 환영.

## 8개 축

| 축 | 측정 대상 | 데이터 소스 |
|---|---|---|
| **Adoption Depth** | MCP + skills + agents 합계 | `~/.claude.json`, `~/.claude/skills/`, `~/.claude/agents/` |
| **Automation** | 어시스턴트 메시지당 tool call | `~/.claude/projects/*.jsonl` (카운트만) |
| **Context Efficiency** | 평균 세션 길이 + compaction 활용 | 세션 메타 |
| **Tool Maker** | AI 인프라 키워드 매칭 public repo 수 | GitHub public API |
| **Safety Guards** | 훅 개수 + 이벤트 종류 다양성 | `~/.claude/settings.json` |
| **Multi-Agent** | 100 메시지당 Task tool 호출 | 세션 메타 |
| **Portability** | CLAUDE.md + dotfiles + sync script | 파일시스템 |
| **Learning Speed** | 실행 횟수 × 컴포넌트 폭 | `~/.claude.json` |

## 6개 캐릭터 라벨

8축 점수 → 1개 페르소나:

- 🛠 **Tool Maker** — Tool Maker + Safety 높음. *AI를 쓰지 않고, AI가 잘 일할 환경을 만든다.*
- ⚡ **Speed Demon** — Automation + Multi-Agent 높음. *병목은 더 이상 타이핑이 아니다.*
- 🧙 **Solo Wizard** — 전반 우수하지만 Portability 낮음. *혼자만 쓸 수 있는 성.*
- 🌊 **Vibe Coder** — Automation 높지만 Safety 낮음. *빠르게 만들고 빠르게 부순다.*
- 🔬 **Tinkerer** — 빠르게 학습·도입 중. *47일째 새 MCP 다 깔아보는 중.*
- 📦 **Cargo Culter** — 설치만 했고 안 씀. *설정만 하고 체화 안 함.*

## 프라이버시

`harness-bench`는 **카운트와 설정만** 읽음. 절대로:
- 메시지 내용, 프롬프트, tool 입출력 읽지 않음
- 저장소 소스 코드 읽지 않음
- 서버로 아무것도 전송하지 않음 (v0.1 — 완전 오프라인)

유일한 네트워크 호출은 GitHub public API로 본인 repo 개수 세는 것뿐. (Tool Maker 축용, `HARNESS_BENCH_GITHUB_USER` 환경변수로 오버라이드 가능)

## 사용법

```bash
npx harness-bench              # 기본 출력
npx harness-bench --json       # JSON 출력
npx harness-bench --raw        # 축별 raw 메트릭 표시
npx harness-bench --svg        # 1200x630 SVG 공유 카드 저장 (X용)
npx harness-bench --debug      # tool 이름 분포 + subagent 카운트
HARNESS_BENCH_GITHUB_USER=yourname npx harness-bench
```

Node.js 18 이상 필요.

## 레퍼런스 벤치마크

저자(glowElephant) 본인의 셋업 점수:

| 축 | 점수 | Raw |
|---|---:|---|
| Adoption Depth | 6/10 | 8 MCP + 10 skills + 1 agent |
| Automation | 8/10 | tool calls 63.5% |
| Context Efficiency | 6/10 | 평균 101줄/세션 |
| Tool Maker | 10/10 | 인프라 repo 10개 |
| Safety Guards | 10/10 | 12개 훅, 9개 이벤트 종류 |
| Multi-Agent | 10/10 | 멀티 에이전트 호출 482회 + 서브에이전트 세션 976/1022 (95.5%) |
| Portability | 10/10 | CLAUDE.md + dotfiles + sync.py |
| Learning Speed | 10/10 | 390 실행 + 10 skills + 8 MCPs |
| **TOTAL** | **72/80** | 🛠 Tool Maker |

만든 사람이 80점이 아닌 72점인 건 의도된 것. 임계값을 본인 자랑용으로 조정한 게 아니라 문헌에 맞춰 잡았기 때문. 더 높은 점수 받으면 본인 점수를 PR로 등록해주세요.

## 로드맵

- **v0.2** — `--svg` 공유 카드, Multi-Agent 정확도 개선 (SendMessage + subagent 파일), `--debug` 모드 ✅
- **v0.3** — PNG 출력 (resvg-js), 익명 글로벌 percentile, Cursor 어댑터
- **v0.4** — Codex/Aider 어댑터, 시계열 ("6개월 동안 내 AI Native 점수 변화")
- **v0.5** — 팀 모드 (조직 단위 평균)

## 라이선스

MIT
