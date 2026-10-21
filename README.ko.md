<div align="center">

```
███████╗███████╗███████╗██╗  ██╗ █████╗ ██╗
██╔════╝██╔════╝██╔════╝██║ ██╔╝██╔══██╗██║
███████╗█████╗  █████╗  █████╔╝ ███████║██║
╚════██║██╔══╝  ██╔══╝  ██╔═██╗ ██╔══██║██║
███████║███████╗███████╗██║  ██╗██║  ██║██║
╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
```

# seekai-bulk-apikey

**자동 생성된 API 키로 [SeekAI](https://seekai.cc) 계정을 대량 생성 — 계정당 하루 $20 체크인 크레딧 — OpenAI 호환 추론 + [9Router](https://9router.com) 커넥터.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20verified-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)

[🛠 빠른 시작](#-quick-start) · [✅ 검증됨](#-verified-working--every-key-is-tested) · [🧭 작동 방식](#-how-it-works) · [🤖 모델 & 무료 티어](#-models--free-tier) · [⚙️ 옵션](#️-cli-options) · [🛰️ 프록시](#️-behind-a-proxy) · [🔌 9Router](#-connect-to-9router) · [🐞 이슈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 왜 만들었나

SeekAI는 `seekai.cc`에서 New API 패널을 운영합니다. 웰컴 크레딧은 반올림 오차 수준(쿼터 `1`)이고, 진짜 무료 티어는 **매일 签到(체크인): 10,000,000 쿼터 = 계정당 $20, 패널 기준 하루에 한 번**입니다. 가입은 평범한 이메일 + 비밀번호 양식입니다 — OAuth도, 전화번호도, 카드도 없습니다 — 하지만 모든 게이트 단계(인증 코드 요청 + 가입, 로그인, 그리고 체크인 자체)에 **Cloudflare Turnstile**이 걸려 있고, 이 패널에서는 그 위젯이 **헤드 모드 Chrome**에서만 발급됩니다. 이 도구는 CDP를 통해 실제 Chrome을 구동하며(의존성 제로), 계정을 소모하기 전에 출구를 검사하고, 키를 발급하고, 그날의 크레딧을 청구하고, 실제 완성 응답을 반환한 키만 보관합니다.

## 🤖 모델 & 무료 티어

| 모델 ID | 비고 |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | 모든 키에서 검증된 유일한 id (2026-10-21 기준 18/18); 추론 라우트로 응답 |

이 계정들에서 `GET /v1/models`는 **29개의 id**를 반환했습니다; `:free` 접미사가 붙은 id는 `401 API key is disabled`로 거부되므로, 게이트는 위의 id를 사용하고 계정이 호출할 수 있는 다른 것으로 폴백합니다.

**추론 함정:** 이 릴레이는 답변을 `message.reasoning`에 넣고 `message.content`는 **비워 둡니다**. `content`만 읽는 게이트는 살아 있는 키를 죽은 것으로 표시합니다 — 이 도구는 `content || reasoning_content || reasoning`을 허용하고 어느 것이 텍스트를 담았는지 보고합니다.

| 무료 티어가 제공하는 것 | 값 |
| --- | --- |
| 일일 체크인 | **10,000,000 쿼터 = 계정당 $20, 패널 기준 하루에 한 번** (`quota_per_unit 500000`) |
| 같은 날 두 번째 호출 | `今日已签到` (멱등 — 정상으로 간주) |
| 패널 기준 하루 | **UTC+8** — 16:00 UTC에 넘어감 |
| 측정된 실행 (2026-10-21) | **38개 계정 중 12개 체크인 → +120,000,000 쿼터 = 한 번에 $240** |
| 속도 제한 | IP당 분당 약 **5 요청** (`您已达到总请求数限制`) → 호출 간격 ≥14초 |
| 카드 / 전화번호 | 흐름 어디에도 없음 |

측정된 속도 제한 동작: 간격을 무시하면 `200 200 200 200 200` 다음 `429`; `already-checked-in`은 `200 {"success":false,"message":"今日已签到"}`로 응답.

## 🛠 빠른 시작

```bash
git clone https://github.com/F0Rextasy/seekai-bulk-apikey
cd seekai-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # OPTIONAL — without it the tool runs direct
node src/launcher.js        # interactive menu
# or directly:
node src/cli.js --count 1        # one sign-up + the daily $20 check-in in a real Chrome
node src/cli.js --verify-only    # re-check every key in keys.txt
node src/cli.js --screen         # HTTP screen of your exit list
```

`keys.txt`는 `GET /v1/models` **그리고** 실제 완성 응답 이후에만 기록됩니다; `accounts.json`은 계정 상태(사용자 이름, 비밀번호, 이메일, 키, 체크인 크레딧)를 보관합니다.

### 🖱️ 런처

`node src/launcher.js`는 위의 워드마크를 출력하고 번호가 매겨진 메뉴를 제공합니다: **mint**(N개 계정, 순차), **verify**(`keys.txt`), **screen**(출구 목록), **settings**(프록시 파일, 모델, 개수 — `launcher.config.json`에 보관), **connect to 9Router**, 도움말 및 종료. 모든 항목은 동일한 `src/cli.js` 플래그를 감싼 얇은 래퍼입니다.

## ✅ 검증됨 — 모든 키가 테스트됩니다

모든 검사는 이 도구로 **2026-10-21**에 실행되었습니다.

| 검사 | 결과 |
| --- | --- |
| `--screen` (HTTP 출구 검사) | 로그인 페이지 렌더링 + `challenges.cloudflare.com/turnstile/v0/api.js` **200** 응답 + API 호스트 응답 |
| 흐름 내 출구 검사 | 위젯이 발급되지 않는 회선은 메일함을 소모하기 **전에** 거부됨 |
| 가입 | 메일로 받은 코드 후 `POST /api/user/register?turnstile=` → **200** |
| 키 발급 | `POST /api/token/` → 목록 → `POST /api/token/<id>/key` → **200**, 48자 키 |
| 일일 체크인 | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`**; 한 번에 12개 계정 = **$240** |
| 키별 채팅 | `deepseek-ai/DeepSeek-V4-Flash-0731`에서 **18 / 18 키 200** (텍스트는 `reasoning`에) |
| 검사에 실패한 키 | `keys.txt`에 절대 기록되지 않음 |

언제든 재검사:

```bash
node src/cli.js --verify-only            # every key in keys.txt through the live gate
curl https://seekai.cc/v1/chat/completions \
  -H "Authorization: Bearer <48-char-key>" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-ai/DeepSeek-V4-Flash-0731","messages":[{"role":"user","content":"Reply with one short sentence: what is 2+2?"}],"max_tokens":64}'
```

## 🧭 작동 방식

| 단계 | 호출 | 비고 |
| --- | --- | --- |
| 검사 | Chrome에서 `/sign-in` | 패널의 위젯이 마운트 **되고 발급되어야** 함; 페이지는 로드되지만 응답이 없는 회선은 가입할 수 없음 |
| 메일함 | Emailnator gmail 박스 | 주소가 재활용되므로 `seekai`에서 온 메일만 허용 |
| 가입 | `GET /api/verification?email=&turnstile=` | **하나의 토큰이 코드 요청과 가입 호출을 모두 커버** |
| 등록 | `POST /api/user/register?turnstile=` | 사용자 이름, 비밀번호, 이메일, verification_code |
| 로그인 | `POST /api/user/login?turnstile=` | 자체 토큰 → `data.access_token` |
| 키 | `POST /api/token/` → 목록 → `/api/token/<id>/key` | 이 라우트들에는 캡차 없음; 목록은 마스크만 표시 |
| 체크인 | `POST /api/user/checkin?turnstile=` | 자체 토큰 → `quota_awarded: 10000000` |
| 게이트 | `GET /v1/models` + 완성 응답 1회 | **`content` 또는 `reasoning`과 함께 200** → 키 기록됨 |

여기서 Turnstile 토큰은 **일회용이며 문서에 바인딩**됩니다; 다른 컨텍스트에서 생성된 토큰은 `Turnstile 校验失败`로 응답합니다. **헤드리스 Chrome은 이 패널에서 작동하지 않습니다** — 측정 결과: `--headless=new`와 `--headless=old`는 위젯을 60초 동안 비워 두는 반면, 헤드 모드 창(보이거나 화면 밖)은 2-4초 만에 응답합니다. `--headless`는 진단용으로만 존재합니다.

## ⚙️ CLI 옵션

| 플래그 | 기본값 | 의미 |
| --- | --- | --- |
| `--count N` | `1` | 생성할 계정 수, 순차 |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | 라이브 게이트에 사용되는 모델 |
| `--pool <file>` | `proxies.txt` | 출구 목록, 한 줄에 프록시 하나 — 선택 사항 |
| `--tries N` | `3` | 계정당 검사할 출구 후보 |
| `--mint-tries N` | `2` | 출구당 전체 가입 시도(새 메일함 + Chrome) |
| `--gap MS` | `20000` | 계정 간 일시 정지 |
| `--panel-gap MS` | `14000` | 이 패널의 API 호출 간 일시 정지 |
| `--code-timeout S` | `240` | 이메일 코드를 기다리는 초 |
| `--keys <file>` | `keys.txt` | `--verify-only` / `--connect-9router`용 키 파일 |
| `--headless` | 꺼짐 | 진단 전용 — Turnstile이 발급되지 않음 |
| `--browser <exe>` | 자동 | Chrome 바이너리 (환경 변수 `CHROME_PATH`) |
| `--debug-port N` | 자동 | Chrome DevTools 포트 |
| `--verify-only` · `--screen` · `--connect-9router` · `--help` | | 모드 |

## 🛰️ 프록시 뒤에서

- **풀 사용 시:** `--pool <file>` (또는 `SEEKAI_PROXIES` 환경 변수). 모든 요청 — Chrome 브라우저 포함 — 이 하나의 출구를 통과하며, fail-closed 방식입니다: 후보를 먼저 검사하고(로그인 렌더링 + Turnstile 스크립트 200) 실행 전체가 해당 계정 동안 그 출구에 고정됩니다.
- **풀 없이:** 도구가 직접 연결하고 `running WITHOUT a proxy (direct)`를 출력합니다. 다른 것은 변하지 않습니다.
- **여기서는 출구 품질이 성공을 좌우합니다.** 2026-10-21에 원시 풀은 대부분 `no login form` / `no turnstile token`을 생성했습니다; 26개 후보 중 **8개**만 레일을 실행할 수 있었습니다. 먼저 검사하고, 그다음 생성하세요.
- 사용자 이름/비밀번호가 있는 SOCKS5 줄은 건너뜁니다(Chrome이 인증할 수 없음); 자격 증명이 있는 HTTP 프록시는 Fetch 도메인을 통해 처리됩니다.

## 📄 파일

| 경로 | 내용 |
| --- | --- |
| `keys.txt` | 라이브 검증된 키 한 줄에 하나 — git 무시됨 |
| `accounts.json` | 사용자 이름 / 비밀번호 / 이메일 / 키 / 체크인 상태 — git 무시됨 |
| `proxies.txt` | 사용자의 출구 — git 무시됨 |
| `out/` | 실행 로그, 실패 스크린샷, `attempts.jsonl` — git 무시됨 |

## 🔌 9Router에 연결

```bash
node src/cli.js --connect-9router                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-9router --9router-base http://localhost:20128 --9router-password 123456
```

기본값: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. 모델은 `seekai/<model id>`로 제공됩니다.

## 🐞 이슈

SeekAI가 가입 양식, Turnstile 사이트 키(`0x4AAAAAAEcpuQE_WXc4ZfG8`), 체크인 보상 또는 모델 카탈로그를 변경하면, 도구는 그 지점에서 멈추고 그렇게 알립니다. 명령과 정확한 출력을 포함해 **[이슈를 열어주세요](../../issues)**.

## 📄 라이선스

[MIT](LICENSE) © seekai-bulk-apikey contributors

---

## ⚠️ 계정 위험과 최소화
