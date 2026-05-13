# CLAUDE.md — harness-bench

이 파일은 사람용 README가 아니라 **다음 세션의 AI(=Claude)가 이 코드를 헷갈리지 않게 파악**하기 위한 문서입니다. 짧고 단정적으로, why 중심으로 적습니다.

## 한 줄 요약
Claude Code 사용자의 `~/.claude/` 환경을 8축으로 점수화하는 CLI. 메타데이터만 읽고 본문/코드/프롬프트는 절대 읽지 않음.

## 빌드/실행

```bash
npm install
npm run dev      # tsx로 src/cli.ts 직접 실행 (개발용)
npm run build    # dist/ 산출 (tsc)
node dist/cli.js # 빌드 산출물 실행
```

Node 18+, ES Module 프로젝트. `import` 경로는 `.js` 확장자로 표기 (TS → JS 빌드 후 동작 위함).

## 디렉토리 구조

```
src/
├── cli.ts                # 엔트리포인트. 인자 파싱 + 출력
├── index.ts              # 라이브러리 export
├── types.ts              # 공유 타입
├── scanner/              # ~/.claude/ 읽기 — 메타만, 본문 X
│   ├── paths.ts          # 절대 경로 상수 (homedir 기반)
│   ├── io.ts             # readJsonSafe, walkJsonlFiles 등 헬퍼
│   ├── settings.ts       # ~/.claude/settings.json + .local.json
│   ├── mcp.ts            # ~/.claude.json (MCP + numStartups)
│   ├── components.ts     # skills/, agents/, plugins/, CLAUDE.md
│   ├── sessions.ts       # projects/*/*.jsonl 메타 카운트
│   ├── github.ts         # GitHub public API로 infra repo 카운트
│   ├── sync.ts           # dotfiles/sync 스크립트 존재 여부
│   └── index.ts          # 통합 진입점 (Promise.all)
├── scoring/
│   ├── thresholds.ts     # 절대 임계값 테이블 + 출처 주석
│   ├── axes.ts           # 축별 점수 산출 함수
│   ├── label.ts          # 6 캐릭터 분류 + 메타데이터
│   └── index.ts          # scoreScan() 통합
└── output/
    └── terminal.ts       # picocolors 기반 ASCII 카드
```

## 핵심 설계 결정

### 1. 본문 절대 안 읽음
`sessions.ts`가 jsonl을 라인별로 파싱하지만 `message.content` 본문은 사용 안 함. `role`, `content[].type === 'tool_use'`, `content[].name`만 카운트. **이 원칙을 깨면 안 됨** — README와 Privacy 섹션이 거짓말이 됨.

### 2. SAMPLE_PER_FILE = 200
파일당 200줄까지만 상세 파싱(tool_use 카운트 등), 그 이후는 라인 수만 카운트. 이유: 본인 환경에서 1,022개 파일 × 평균 100줄 = 10만+ 라인. 전체 파싱 시 수 초 → 5초 안에 끝내려고 제한.

### 3. 임계값 = 절대값, percentile은 별도
`thresholds.ts`의 티어 테이블은 절대 기준 (CMM/Anthropic/산업 자료 인용). 글로벌 percentile은 v0.2 서버 도입 후 별도 필드(`result.percentile`).

### 4. 만든 사람이 만점 안 받는 게 정직성 시그널
저자 본인 점수 62/80. 임계값을 본인 자랑용으로 조정하지 않았다는 증거가 README의 Reference Benchmark 섹션. **임계값 수정 시 이 점수가 어떻게 바뀌는지 README 동시 갱신 필수.**

### 5. GitHub API는 비로그인 60req/h 한계
`scanGithub()`은 최대 5 페이지(500 repos) 페치. 더 많으면 잘림. v0.2에서 PAT 옵션 추가 고려.

## 실패한 접근 / 알려진 한계

### compactionEvents 0으로 잡힘
현재 코드는 `type === 'summary'` 또는 `type === 'compact'`를 찾는데, 본인 1,022 jsonl에서 0개로 잡힘 → jsonl 실제 포맷에서 compaction 이벤트의 type 이름이 다른 듯.
**다음 작업**: 본인 jsonl 한 줄 샘플 떠서 실제 type 종류 파악 (단, 본문은 보지 말 것 — type 필드만).

### Multi-Agent 비율이 낮게 나옴
본인 96 Task call / 18,349 messages = 0.52/100. 임계값상 2점. 그러나 본인이 실제로 멀티 에이전트 활용 많이 함. 가능 원인:
1. 대부분 단일 Task로 끝나고 conversation 길이가 길어서 분모가 큼
2. Agent 호출이 Task tool 이외 경로(SendMessage 등)로 들어옴 → 미감지

**다음 작업**: tool name 분포를 디버그 모드로 출력해서 확인. `--debug` 플래그 추가 고려.

### GitHub user 자동 감지 약함
`~/.gitconfig`의 email에서 추출 → 본인 환경에선 `gksdk1029@gmail.com`이라 'gksdk1029' 추출. 실제 GitHub user는 'glowElephant'. **현재는 `HARNESS_BENCH_GITHUB_USER` env 강제 권장**. v0.2에서 `gh auth status` 폴백 추가.

### 빌드 후 dist 실행 시 ESM import 주의
`type: module` + `moduleResolution: bundler`라서 TS 파일 안에서도 `.js`로 import해야 함. 빠뜨리면 런타임 ERR_MODULE_NOT_FOUND.

## 임계값 변경 가이드

`src/scoring/thresholds.ts`만 수정. 변경 시:
1. 본인(저자) 점수 재측정 → README의 Reference Benchmark 표 갱신
2. CHANGELOG.md에 "근거 + 이전/이후 점수" 기록
3. 외부 인용 출처(CMM 단계, Anthropic 문서) 주석에 명시

## 의존성 정책

- 런타임은 `picocolors` 하나만. 가볍게 유지 (npx 다운로드 시간 단축)
- PNG 카드(v0.2) 도입 시 satori + sharp는 optional peer dependency로 (기본 CLI 무겁게 하지 말 것)

## 커밋 규칙

- 커밋 메시지 한글
- 코드 변경 시 이 CLAUDE.md 또는 README 갱신 (commit-docs 훅이 강제)
- 임계값 변경 = README의 본인 점수 표 동시 갱신 (안 그러면 거짓말됨)
