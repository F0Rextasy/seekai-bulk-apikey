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

**Bulk-create SeekAI (seekai.cc) accounts with auto-generated API keys and claim the daily $20 check-in credit — OpenAI-compatible inference + 9Router connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20served-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Quick start](#-quick-start) · [🎁 Free tier](#-free-tier--how-much-you-get) · [🤖 Models](#-models--all-1-of-them) · [🧪 Use the API](#-how-to-use-the-api) · [✅ Verified](#-verified-working--every-key-is-tested) · [🧭 How it works](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Why this exists

SeekAI runs a New API panel (`v1.0.0-rc.25`) on `seekai.cc` whose **free tier is a daily 签到 (check-in): 10,000,000 quota = $20 per account, claimed once per panel day**. Registration is an ordinary e-mail + password form (no OAuth is required), and the welcome credit is only token (quota 1) — the check-in *is* the money. Every gated step — code request + register, sign-in, and the check-in itself — carries a **Cloudflare Turnstile** token, and that widget only mints in a **headed Chrome** on this panel, which is why the tool drives a real browser over CDP and screens the exit before spending an account on it.

## 🎁 Free tier — how much you get

| What | Value |
| --- | --- |
| Daily credit | **one check-in per account per panel day = 10,000,000 quota = $20** (`quota_per_unit 500000`) |
| Welcome credit | quota `1` (≈ $0.000002) — the free tier is the check-in, not the signup |
| Measured run | **12 of 38 accounts checked in on 2026-10-21 → +120,000,000 quota = $240 in one pass** (`providers/seekai.cc/out/checkin-2026-10-21.json`) |
| Second call, same day | `今日已签到` (idempotent, counts as healthy) |
| Panel day | **UTC+8** — it rolls at 16:00 UTC |
| Rate limit | the panel caps the whole IP at ~**5 requests/min** (`您已达到总请求数限制`) → space calls ≥14 s |
| Card / phone | **none** — no payment step anywhere, and no phone number is asked for |
| Multi-account clause | not published: `/api/user/agreement` is admin-only (403 `AUTH_INSUFFICIENT_PRIVILEGE`) |

> 💡 The free tier is set by SeekAI and can change. Check the live numbers at [seekai.cc](https://seekai.cc) — and let the tool's own gate decide:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Models — all 1 of them

The panel advertises one verified chat id on the accounts this tool mints:

| Model ID | note |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | chat-verified every key on 2026-10-21; answers as a reasoning route |

`GET /v1/models` returns the ids this account may call; ids carrying a `:free` suffix are rejected with **401 `API key is disabled`**, so the tool gates on the id above (and falls back to whatever `/v1/models` offers that is not rejected).

The reply shape matters: this relay puts the text in **`message.reasoning`** and leaves `message.content` **empty** (its `finish_reason` is `length` for short `max_tokens`). A gate that only looks at `content` calls live keys unusable, so the tool accepts `content || reasoning_content || reasoning` and reports which one carried the answer.

## 🧪 How to use the API

Base URL **`https://seekai.cc/v1`** — OpenAI-compatible chat completions. Keys are **48 characters without an `sk-` prefix** (the panel's list masks them; the tool reveals the value with `POST /api/token/<id>/key`).

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

A token whose own `remain_quota` is 0 and that is not unlimited does not authenticate at all — create the key with `unlimited_quota: true` (the tool does).

## 🛠 Quick start

```bash
cd seekai-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen
# or directly:
node src/cli.js --count 1        # one sign-up + daily $20 check-in in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

The sign-up (and the check-in) needs a real, **headed** Chrome: measured on this panel, `--headless=new` and `--headless=old` leave the Turnstile widget empty for 60 s, while a headed window — visible or off-screen — answers in 2-4 s. `keys.txt` is written only after `GET /v1/models` **and** a real completion; `accounts.json` keeps the account state (username, password, e-mail, key, check-in credit).

### 🖱️ The launcher

`node src/launcher.js` is a menu over the task modules: **mint** (a fresh account, its verified e-mail, the key and the daily $20 check-in), **verify** (re-run the chat gate over `keys.txt`) and **screen** (HTTP pass over the exit list). Settings — proxy list, account count, model — persist in `launcher.config.json`. Every flag below is reachable from the CLI directly.

## ✅ Verified working — every key is tested

All checks below were re-run on **2026-10-21** from the shipped CLI (exit pool, no WARP).

| Check | Result |
| --- | --- |
| `--screen` (HTTP exit vet) | sign-in page must render + `challenges.cloudflare.com/turnstile/v0/api.js` must answer 200 + the API host must answer |
| exit screen in Chrome (in-flow) | a line whose widget never mints is refused **before** a mailbox is spent (this is the 2026-10-14 blocker, now a hard gate) |
| sign-up | `POST /api/user/register?turnstile=` → **200** (`success: true`) after the mail code |
| key mint | `POST /api/token/` → list → `POST /api/token/<id>/key` → **200**, 48-char key |
| daily check-in | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`** ($20); 12 accounts in one run = **$240** |
| chat per key | **every key 200** on `deepseek-ai/DeepSeek-V4-Flash-0731` (answer carried in `reasoning`) — re-run from this CLI, with exit rotation |
| `401 API key is disabled` | **exit-dependent, not a key verdict**: three keys answered it from one exit and 200 from another in the same minute, so the gate retries that answer on the next exit |
| a key that fails its check | never written to `keys.txt` (the gate retries exit-class failures once) |

> **Quality gates.** Every key here passed a live `chat-200` before it was written to `keys.txt`
> (dead keys are never shipped). Router combos follow the same rule at the model level: an entry is
> added **only if the model answers `chat-200` and can call tools** — a model without tool support,
> a dead key or a dead provider is dropped instead of added. Re-run the verify step any time;
> failures are reported, never hidden.

## 🧭 How it works

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: SeekAI page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://seekai.cc/v1/chat/completions → real content = the key is live
```

| Step | Call | Notes |
| --- | --- | --- |
| screen | `/sign-in` in Chrome | the panel's own widget must mount **and mint**; a line that loads the page but never answers cannot register |
| mailbox | Emailnator gmail box | the rail recycles addresses, so only mail from `seekai` is accepted |
| sign-up | `/sign-up` → `GET /api/verification?email=&turnstile=` | one token covers the code request **and** the register call |
| register | `POST /api/user/register?turnstile=` | body: username, password, e-mail, verification_code |
| login | `POST /api/user/login?turnstile=` | its own token → `data.access_token` |
| key | `POST /api/token/` → list → `/api/token/<id>/key` | no captcha on these routes; the list only shows a mask |
| check-in | `POST /api/user/checkin?turnstile=` | its own token → `quota_awarded: 10000000` |
| gate | `GET /v1/models` + one completion | 200 with `content` **or** `reasoning` → the key is written |

The panel also answers **`401 API key is disabled`** for reasons that have nothing to do with the key (measured 2026-10-21: same key, one exit 401, another 200 within a minute) — a verify run should rotate exits before believing it.

Turnstile tokens here are **single-use and document-bound**: a token produced in another context answers `Turnstile 校验失败`. Playwright-style automation is not required — a plain CDP `Runtime.evaluate` + `Input.dispatchMouseEvent` click is enough, which is what this zero-dependency client does.

## ⚙️ CLI options

```bash
node src/cli.js --count 5                  # five sign-ups, serial (one headed Chrome at a time)
node src/cli.js --model deepseek-ai/DeepSeek-V4-Flash-0731
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `--count N` | `1` | accounts to mint, serial |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | model used for the live gate |
| `--pool <file>` | `proxies.txt` | exit list, one line per proxy — optional |
| `--tries N` | `3` | exit candidates screened per account |
| `--mint-tries N` | `2` | full sign-up attempts (fresh mailbox + Chrome) per exit |
| `--gap MS` | `20000` | pause between accounts |
| `--panel-gap MS` | `14000` | pause between this panel's API calls (5 req/min) |
| `--code-timeout S` | `240` | seconds to wait for the e-mail code |
| `--keys <file>` | `keys.txt` | key file for `--verify-only` / `--connect-9router` |
| `--headless` | off | **diagnostic only** — Turnstile will not mint, every mint fails |

## 🛰️ Behind a proxy

**Optional — recommended at scale (per-IP limits, bans).** The tool works without a proxy too.

- **With a pool:** pass `--pool <file>` (or set `SEEKAI_PROXIES`) and every request — the Chrome browser included — goes through an exit from that list, fail-closed: each candidate is vetted first (sign-in page renders + Turnstile script 200) and the run then stays pinned to that exit for the whole account.
- **Without a pool:** the CLI prints `running WITHOUT a proxy (direct)` and connects directly. Nothing about sign-up, key minting or the check-in changes — only where the packets leave from.
- **Exit quality decides success here.** On 2026-10-21 a raw pool gave mostly `no login form` / `no turnstile token`; of 26 candidates only **8** could actually run the rail. Screen first, then mint.
- SOCKS5 lines with a username/password are skipped: Chrome cannot authenticate to them (HTTP proxies with credentials are handled through the Fetch domain).

## 📄 Files

| Path | Contents |
| --- | --- |
| `keys.txt` | one live-verified key per line — git-ignored |
| `accounts.json` | username / password / e-mail / key / check-in state, incl. failed attempts |
| `proxies.txt` | your exits — git-ignored |
| `out/` | run log, failure screenshots, `attempts.jsonl` ledger — git-ignored |

## 🔌 Connect to 9Router

[9Router](https://9router.com) is a self-hosted, OpenAI-compatible router:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Defaults: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Models are served as `seekai/<model id>`. The CLI can do the same in one shot: `node src/cli.js --connect-9router`.

## 🔌 Connect to OmniRoute

[OmniRoute](https://omniroute.online) is a self-hosted, OpenAI-compatible router:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Defaults: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Models are served as `seekai/<model id>`. The CLI can do the same in one shot: `node src/cli.js --connect-omniroute`.

## 🔑 What one key gets you

| | |
| --- | --- |
| 🏢 Provider | **SeekAI** — [seekai.cc](https://seekai.cc) |
| 🎁 What the provider gives | **$20 per account per day**, claimed with one check-in (`quota_awarded: 10000000`) |
| 🔑 What one key gets you | the account's model list on `https://seekai.cc/v1`, billed against the check-in credit |
| 🌐 API shape | OpenAI-compatible: `POST https://seekai.cc/v1/chat/completions` (answers may arrive in `reasoning`) |
| 🔒 Your data | only `seekai.cc` and your inbox backend are contacted |

## 🐞 Issues

If SeekAI changes its sign-up form, its Turnstile site key (`0x4AAAAAAEcpuQE_WXc4ZfG8`), the check-in award or the model catalogue, the tool stops there and says so. **[Open an issue](../../issues)** with the command and the exact output.

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 seekai-bulk-apikey contributors

</div>
