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

**자동 생성된 API 키로 SeekAI (seekai.cc) 계정을 대량 생성하고 매일 $20 체크인 크레딧을 받으세요 — OpenAI 호환 추론 + 9Router 커넥터.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20served-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 빠른 시작](#-quick-start) · [🎁 무료 티어](#-free-tier--how-much-you-get) · [🤖 모델](#-models--all-1-of-them) · [🧪 API 사용하기](#-how-to-use-the-api) · [✅ 검증됨](#-verified-working--every-key-is-tested) · [🧭 작동 방식](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 옵션](#️-cli-options) · [🛰️ 프록시](#️-behind-a-proxy) · [🐞 이슈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 왜 만들었나

SeekAI는 `seekai.cc`에서 New API 패널(`v1.0.0-rc.25`)을 운영하며, **무료 티어는 매일 签到(체크인)입니다: 10,000,000 쿼터 = 계정당 $20, 패널 날짜당 한 번 수령**. 가입은 일반 이메일 + 비밀번호 양식이며(OAuth 불필요), 웰컴 크레딧은 토큰(쿼터 1)에 불과합니다 — 체크인이 곧 돈입니다. 모든 게이트 단계 — 코드 요청 + 가입, 로그인, 체크인 자체 — 는 **Cloudflare Turnstile** 토큰을 요구하며, 이 위젯은 이 패널에서 **헤드리스가 아닌 Chrome**에서만 발급됩니다. 그래서 이 도구는 CDP를 통해 실제 브라우저를 구동하고, 계정을 소모하기 전에 출구를 검증합니다.

## 🎁 무료 티어 — 얼마나 받을 수 있나

| 항목 | 값 |
| --- | --- |
| 일일 크레딧 | **패널 날짜당 계정당 체크인 한 번 = 10,000,000 쿼터 = $20** (`quota_per_unit 500000`) |
| 웰컴 크레딧 | 쿼터 `1` (≈ $0.000002) — 무료 티어는 가입이 아니라 체크인입니다 |
| 측정된 실행 | **2026-10-21에 38개 계정 중 12개 체크인 → +120,000,000 쿼터 = 한 번에 $240** (`providers/seekai.cc/out/checkin-2026-10-21.json`) |
| 같은 날 두 번째 호출 | `今日已签到` (멱등, 정상으로 간주) |
| 패널 날짜 | **UTC+8** — 16:00 UTC에 넘어갑니다 |
| 요청 제한 | 패널은 전체 IP를 분당 약 **5회 요청**으로 제한합니다 (`您已达到总请求数限制`) → 호출 간격 ≥14초 |
| 카드 / 전화 | **없음** — 결제 단계가 어디에도 없고 전화번호도 요구하지 않습니다 |
| 다중 계정 조항 | 공개되지 않음: `/api/user/agreement`는 관리자 전용 (403 `AUTH_INSUFFICIENT_PRIVILEGE`) |

> 💡 무료 티어는 SeekAI가 정하며 변경될 수 있습니다. 실시간 수치는 [seekai.cc](https://seekai.cc)에서 확인하세요 — 그리고 도구 자체의 게이트가 판단하게 하세요:

```bash
node src/cli.js --verify-only     # keys.txt의 모든 키를 실제 채팅 호출로 재검증
```

## 🤖 모델 — 단 1개

패널은 이 도구가 생성한 계정에서 검증된 채팅 id 하나를 광고합니다:

| 모델 ID | 비고 |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | 2026-10-21에 모든 키 채팅 검증됨; 추론 라우트로 응답 |

`GET /v1/models`는 이 계정이 호출할 수 있는 id를 반환합니다; `:free` 접미사가 붙은 id는 **401 `API key is disabled`**로 거부되므로, 도구는 위 id로 게이트하고(거부되지 않은 `/v1/models`가 제공하는 것으로 폴백합니다).

응답 형태가 중요합니다: 이 릴레이는 텍스트를 **`message.reasoning`**에 넣고 `message.content`는 **비워둡니다**(짧은 `max_tokens`에서는 `finish_reason`이 `length`). `content`만 보는 게이트는 살아있는 키를 사용 불가로 판정하므로, 도구는 `content || reasoning_content || reasoning`을 허용하고 어느 것이 답을 담았는지 보고합니다.

## 🧪 API 사용 방법

Base URL **`https://seekai.cc/v1`** — OpenAI 호환 채팅 완성. 키는 **`sk-` 접두사 없는 48자**입니다(패널 목록은 마스킹하며, 도구는 `POST /api/token/<id>/key`로 값을 노출합니다).

```bash
curl https://seekai.cc/v1/chat/completions \
  -H "Authorization: Bearer <48-char-key>" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-ai/DeepSeek-V4-Flash-0731","messages":[{"role":"user","content":"Reply with one short sentence: what is 2+2?"}],"max_tokens":64}'
```

```python
from openai import OpenAI
c = OpenAI(base_url="https://seekai.cc/v1", api_key="<your key>")
m = c.chat.completions.create(model="deepseek-ai/DeepSeek-V4-Flash-0731",
      messages=[{"role": "user", "content": "hi"}], max_tokens=64).choices[0].message
print(m.content or m.reasoning)   # this relay may answer in reasoning
```

자체 `remain_quota`가 0이고 무제한이 아닌 토큰은 아예 인증되지 않습니다 — 키를 `unlimited_quota: true`로 생성하세요(도구가 그렇게 합니다).

## 🛠 빠른 시작

```bash
cd seekai-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # 선택 사항 — 없으면 도구는 직접 연결로 실행됩니다
node src/launcher.js        # 대화형: 생성 / 검증 / 스크린

# 또는 직접:
node src/cli.js --count 1        # 실제 Chrome에서 가입 1회 + 매일 $20 체크인
node src/cli.js --verify-only    # keys.txt에 이미 있는 모든 키 재검증
node src/cli.js --screen         # 출구 목록 HTTP 스크린
```

가입(및 체크인)에는 실제 **헤드리스가 아닌** Chrome이 필요합니다: 이 패널에서 측정한 결과 `--headless=new`와 `--headless=old`는 Turnstile 위젯을 60초 동안 비워두는 반면, 헤드리스가 아닌 창 — 보이든 화면 밖이든 — 은 2-4초 만에 응답합니다. `keys.txt`는 `GET /v1/models` **그리고** 실제 완성 이후에만 기록됩니다; `accounts.json`은 계정 상태(사용자명, 비밀번호, 이메일, 키, 체크인 크레딧)를 보관합니다.

### 🖱️ 런처

`node src/launcher.js`는 작업 모듈 위의 메뉴입니다: **mint**(새 계정, 검증된 이메일, 키 및 매일 $20 체크인), **verify**(`keys.txt`에 대해 채팅 게이트 재실행), **screen**(출구 목록에 대한 HTTP 패스). 설정 — 프록시 목록, 계정 수, 모델 — 은 `launcher.config.json`에 유지됩니다. 아래의 모든 플래그는 CLI에서 직접 사용할 수 있습니다.

## 🚀 명령 하나로

캡차는 자동으로 해결됩니다 — 명령 하나로 N개 계정(매일 $20 체크인 크레딧 포함)을 생성하고 실제 채팅 호출로 검증된 키만 유지합니다:

```bash
node src/cli.js --count N        # N개 계정, 직렬 — Turnstile 위젯은 실제 Chrome에서 응답됩니다
```

`--auto`가 기본값이며 아무것도 전달할 필요가 없습니다: 내장된 `src/solver.js`가 헤드리스가 아닌 Chrome을 열고, 패널의 Turnstile 위젯을 마운트하고 토큰을 자동으로 반환합니다. `--dry`는 결정된 계획(개수, 출구 풀, 솔버, 모델)을 출력하고 **파일 기록도 네트워크 호출도 없이** 종료합니다. `node src/launcher.js`(또는 `npm start`)는 같은 경로를 메뉴로 제공합니다.

> ⚠️ **약관 및 계정 위험.** 이것은 자동화 도구이지 계정 판매자가 아닙니다. 대량 가입과 키 생성은 전적으로 귀하의 책임입니다: 제공자의 서비스 약관을 위반할 수 있으며 주소, 출구 또는 계정이 차단될 수 있습니다. 자동화가 허용된 인프라에서만 사용하고 요청 속도를 낮게 유지하세요.

## ✅ 검증됨 — 모든 키가 테스트됩니다

아래 모든 검사는 **2026-10-21**에 배포된 CLI에서 재실행되었습니다(출구 풀, WARP 없음).

| 검사 | 결과 |
| --- | --- |
| `--screen` (HTTP 출구 검증) | 로그인 페이지가 렌더링되어야 함 + `challenges.cloudflare.com/turnstile/v0/api.js`가 200을 반환해야 함 + API 호스트가 응답해야 함 |
| Chrome에서 출구 스크린 (인플로우) | 위젯이 절대 발급되지 않는 라인은 메일박스를 소모하기 **전에** 거부됨 (이것이 2026-10-14의 블로커였고, 이제 하드 게이트임) |
| 가입 | 메일 코드 후 `POST /api/user/register?turnstile=` → **200** (`success: true`) |
| 키 생성 | `POST /api/token/` → 목록 → `POST /api/token/<id>/key` → **200**, 48자 키 |
| 일일 체크인 | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`** ($20); 한 번에 12개 계정 = **$240** |
| 키별 채팅 | `deepseek-ai/DeepSeek-V4-Flash-0731`에서 **모든 키 200** (답변이 `reasoning`에 담김) — 이 CLI에서 출구 로테이션과 함께 재실행 |
| `401 API key is disabled` | **출구 의존적이며 키 판정이 아님**: 세 개의 키가 한 출구에서 이 응답을 받고 같은 분에 다른 출구에서 200을 받았으므로, 게이트는 그 응답을 다음 출구에서 재시도함 |
| 검사에 실패한 키 | `keys.txt`에 절대 기록되지 않음 (게이트는 출구 등급 실패를 한 번 재시도함) |

> **품질 게이트.** 여기의 모든 키는 `keys.txt`에 기록되기 전에 실제 `chat-200`을 통과했습니다
> (죽은 키는 절대 배포되지 않습니다). 라우터 콤보도 모델 수준에서 같은 규칙을 따릅니다: 항목은
> **모델이 `chat-200`으로 응답하고 도구를 호출할 수 있을 때만** 추가됩니다 — 도구 지원이 없는 모델,
> 죽은 키 또는 죽은 제공자는 추가되지 않고 제거됩니다. 언제든 검증 단계를 재실행하세요;
> 실패는 보고되며 절대 숨겨지지 않습니다.

## 🧭 작동 방식

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: SeekAI page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://seekai.cc/v1/chat/completions → real content = the key is live
```

| 단계 | 호출 | 비고 |
| --- | --- | --- |
| 스크린 | Chrome에서 `/sign-in` | 패널 자체 위젯이 마운트 **되고 발급되어야** 함; 페이지는 로드되지만 절대 응답하지 않는 라인은 가입할 수 없음 |
| 메일박스 | Emailnator gmail 박스 | 레일이 주소를 재활용하므로 `seekai`에서 온 메일만 허용됨 |
| 가입 | `/sign-up` → `GET /api/verification?email=&turnstile=` | 하나의 토큰이 코드 요청 **과** 가입 호출을 모두 커버함 |
| 등록 | `POST /api/user/register?turnstile=` | 본문: 사용자명, 비밀번호, 이메일, verification_code |
| 로그인 | `POST /api/user/login?turnstile=` | 자체 토큰 → `data.access_token` |
| 키 | `POST /api/token/` → 목록 → `/api/token/<id>/key` | 이 라우트에는 캡차 없음; 목록은 마스크만 표시함 |
| 체크인 | `POST /api/user/checkin?turnstile=` | 자체 토큰 → `quota_awarded: 10000000` |
| 게이트 | `GET /v1/models` + 완성 한 번 | `content` **또는** `reasoning`과 함께 200 → 키가 기록됨 |

패널은 또한 키와 아무 관련 없는 이유로 **`401 API key is disabled`**를 반환합니다(2026-10-21 측정: 같은 키, 한 출구에서 401, 다른 출구에서 1분 내 200) — 검증 실행은 이를 믿기 전에 출구를 로테이션해야 합니다.

여기서 Turnstile 토큰은 **일회용이며 문서에 바인딩됩니다**: 다른 컨텍스트에서 생성된 토큰은 `Turnstile 校验失败`로 응답합니다. Playwright 스타일 자동화는 필요하지 않습니다 — 일반 CDP `Runtime.evaluate` + `Input.dispatchMouseEvent` 클릭이면 충분하며, 이것이 이 제로 의존성 클라이언트가 하는 일입니다.

## ⚙️ CLI 옵션

```bash
node src/cli.js --count 5                  # 다섯 개 가입, 직렬 (한 번에 하나의 헤드리스가 아닌 Chrome)
node src/cli.js --model deepseek-ai/DeepSeek-V4-Flash-0731
node src/cli.js --verify-only              # keys.txt 재검증
node src/cli.js --screen                   # 출구 목록 HTTP 스크린
node src/cli.js --connect-9router          # 로컬 9Router에 제공자 + 키 등록
node src/cli.js --help
```

| 플래그 | 기본값 | 의미 |
| --- | --- | --- |
| `--count N` | `1` | 생성할 계정 수, 직렬 |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | 실제 게이트에 사용되는 모델 |
| `--pool <file>` | `proxies.txt` | 출구 목록, 프록시당 한 줄 — 선택 사항 |
| `--tries N` | `3` | 계정당 스크린되는 출구 후보 |
| `--mint-tries N` | `2` | 출구당 전체 가입 시도 (새 메일박스 + Chrome) |
| `--gap MS` | `20000` | 계정 간 일시정지 |
| `--panel-gap MS` | `14000` | 이 패널의 API 호출 간 일시정지 (분당 5회 요청) |
| `--code-timeout S` | `240` | 이메일 코드를 기다리는 초 |
| `--keys <file>` | `keys.txt` | `--verify-only` / `--connect-9router`용 키 파일 |
| `--headless` | 꺼짐 | **진단 전용** — Turnstile이 발급되지 않아 모든 생성이 실패함 |

## 🛰️ 프록시 뒤에서

**선택 사항 — 대규모에서는 권장됨 (IP별 제한, 차단).** 이 도구는 프록시 없이도 작동합니다.

- **풀 사용 시:** `--pool <file>`을 전달하거나(또는 `SEEKAI_PROXIES` 설정) 모든 요청 — Chrome 브라우저 포함 — 이 해당 목록의 출구를 통해 나가며, fail-closed 방식입니다: 각 후보는 먼저 검증되고(로그인 페이지 렌더링 + Turnstile 스크립트 200) 실행은 계정 전체에 걸쳐 그 출구에 고정됩니다.
- **풀 없이:** CLI는 `running WITHOUT a proxy (direct)`를 출력하고 직접 연결합니다. 가입, 키 생성 또는 체크인에 대해 바뀌는 것은 없습니다 — 패킷이 나가는 위치만 다릅니다.
- **출구 품질이 여기서 성공을 결정합니다.** 2026-10-21에 원시 풀은 대부분 `no login form` / `no turnstile token`을 반환했습니다; 26개 후보 중 실제로 레일을 실행할 수 있는 것은 **8개**뿐이었습니다. 먼저 스크린하고, 그다음 생성하세요.
- 사용자명/비밀번호가 있는 SOCKS5 라인은 건너뜁니다: Chrome이 이에 인증할 수 없습니다(자격 증명이 있는 HTTP 프록시는 Fetch 도메인을 통해 처리됩니다).

## 📄 파일

| 경로 | 내용 |
| --- | --- |
| `keys.txt` | 한 줄에 하나의 실제 검증된 키 — git 무시됨 |
| `accounts.json` | 사용자명 / 비밀번호 / 이메일 / 키 / 체크인 상태, 실패한 시도 포함 |
| `proxies.txt` | 귀하의 출구 — git 무시됨 |
| `out/` | 실행 로그, 실패 스크린샷, `attempts.jsonl` 원장 — git 무시됨 |

## 🔌 9Router에 연결

[9Router](https://9router.com)는 자체 호스팅, OpenAI 호환 라우터입니다:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

기본값: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. 모델은 `seekai/<model id>`로 제공됩니다. CLI도 한 번에 같은 작업을 할 수 있습니다: `node src/cli.js --connect-9router`.

## 🔌 OmniRoute에 연결

[OmniRoute](https://omniroute.online)는 자체 호스팅, OpenAI 호환 라우터입니다:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

기본값: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. 모델은 `seekai/<model id>`로 제공됩니다. CLI도 한 번에 같은 작업을 할 수 있습니다: `node src/cli.js --connect-omniroute`.

## 🔑 키 하나로 얻는 것

| | |
| --- | --- |
| 🏢 제공자 | **SeekAI** — [seekai.cc](https://seekai.cc) |
| 🎁 제공자가 주는 것 | **계정당 하루 $20**, 체크인 한 번으로 수령 (`quota_awarded: 10000000`) |
| 🔑 키 하나로 얻는 것 | `https://seekai.cc/v1`의 계정 모델 목록, 체크인 크레딧으로 청구됨 |
| 🌐 API 형태 | OpenAI 호환: `POST https://seekai.cc/v1/chat/completions` (답변이 `reasoning`에 도착할 수 있음) |
| 🔒 귀하의 데이터 | `seekai.cc`와 귀하의 메일박스 백엔드만 접촉됩니다 |

## 🐞 이슈

SeekAI가 가입 양식, Turnstile 사이트 키(`0x4AAAAAAEcpuQE_WXc4ZfG8`), 체크인 보상 또는 모델 카탈로그를 변경하면, 도구는 그 지점에서 멈추고 그렇게 알립니다. 명령과 정확한 출력을 포함하여 **[이슈를 열어주세요](../../issues)**.

## 📄 라이선스

MIT © 2026 — [LICENSE](LICENSE) 참조.

<div align="center">

**[MIT](LICENSE)** © 2026 seekai-bulk-apikey 기여자들

</div>