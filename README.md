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

**Bulk-create [SeekAI](https://seekai.cc) accounts with auto-generated API keys — a $20 check-in credit per account per day — OpenAI-compatible inference + [9Router](https://9router.com) connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20verified-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)

[🛠 Quick start](#-quick-start) · [✅ Verified](#-verified-working--every-key-is-tested) · [🧭 How it works](#-how-it-works) · [🤖 Models & free tier](#-models--free-tier) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🔌 9Router](#-connect-to-9router) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Why this exists

SeekAI runs a New API panel on `seekai.cc`. Its welcome credit is a rounding error (quota `1`); the real free tier is the **daily 签到 (check-in): 10,000,000 quota = $20 per account, once per panel day**. Sign-up is an ordinary e-mail + password form — no OAuth, no phone, no card — but every gated step (code request + register, sign-in, and the check-in itself) carries a **Cloudflare Turnstile**, and that widget only mints in a **headed Chrome** on this panel. This tool drives a real Chrome over CDP (zero dependencies), screens the exit before spending an account on it, mints the key, claims the day's credit and keeps only the keys that answered a real completion.

## 🤖 Models & free tier

| Model ID | note |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | the one id verified on every key (18/18 on 2026-10-21); answers as a reasoning route |

`GET /v1/models` returned **29 ids** for these accounts; ids carrying a `:free` suffix are rejected with `401 API key is disabled`, so the gate uses the id above and falls back to whatever the account may call.

**The reasoning trap:** this relay puts the answer in `message.reasoning` and leaves `message.content` **empty**. A gate that only reads `content` marks live keys dead — this tool accepts `content || reasoning_content || reasoning` and reports which one carried the text.

| What the free tier gives | Value |
| --- | --- |
| Daily check-in | **10,000,000 quota = $20 per account, once per panel day** (`quota_per_unit 500000`) |
| Second call the same day | `今日已签到` (idempotent — counts as healthy) |
| Panel day | **UTC+8** — it rolls at 16:00 UTC |
| Measured run (2026-10-21) | **12 of 38 accounts checked in → +120,000,000 quota = $240 in one pass** |
| Rate limit | ~**5 requests/min per IP** (`您已达到总请求数限制`) → calls are spaced ≥14 s |
| Card / phone | none, anywhere in the flow |

Rate-limit behaviour, measured: `200 200 200 200 200` then `429` if the spacing is ignored; `already-checked-in` answers `200 {"success":false,"message":"今日已签到"}`.

## 🛠 Quick start

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

`keys.txt` is written only after `GET /v1/models` **and** a real completion; `accounts.json` keeps the account state (username, password, e-mail, key, check-in credit).

### 🖱️ The launcher

`node src/launcher.js` prints the wordmark above and offers a numbered menu: **mint** (N accounts, serial), **verify** (`keys.txt`), **screen** (exit list), **settings** (proxy file, model, count — kept in `launcher.config.json`), **connect to 9Router**, help and exit. Every item is a thin wrapper over the same `src/cli.js` flags.

## ✅ Verified working — every key is tested

All checks were run on **2026-10-21** from this tool.

| Check | Result |
| --- | --- |
| `--screen` (HTTP exit vet) | sign-in page renders + `challenges.cloudflare.com/turnstile/v0/api.js` answers **200** + the API host answers |
| exit screen inside the flow | a line whose widget never mints is refused **before** a mailbox is spent |
| sign-up | `POST /api/user/register?turnstile=` → **200** after the mailed code |
| key mint | `POST /api/token/` → list → `POST /api/token/<id>/key` → **200**, 48-char key |
| daily check-in | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`**; 12 accounts in one run = **$240** |
| chat per key | **18 / 18 keys 200** on `deepseek-ai/DeepSeek-V4-Flash-0731` (text in `reasoning`) |
| a key that fails its check | never written to `keys.txt` |

Re-check any time:

```bash
node src/cli.js --verify-only            # every key in keys.txt through the live gate
curl https://seekai.cc/v1/chat/completions \
  -H "Authorization: Bearer <48-char-key>" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-ai/DeepSeek-V4-Flash-0731","messages":[{"role":"user","content":"Reply with one short sentence: what is 2+2?"}],"max_tokens":64}'
```

## 🧭 How it works

| Step | Call | Notes |
| --- | --- | --- |
| screen | `/sign-in` in Chrome | the panel's widget must mount **and mint**; a line that loads the page but never answers cannot register |
| mailbox | Emailnator gmail box | addresses are recycled, so only mail from `seekai` is accepted |
| sign-up | `GET /api/verification?email=&turnstile=` | **one token covers the code request and the register call** |
| register | `POST /api/user/register?turnstile=` | username, password, e-mail, verification_code |
| login | `POST /api/user/login?turnstile=` | its own token → `data.access_token` |
| key | `POST /api/token/` → list → `/api/token/<id>/key` | no captcha on these routes; the list shows only a mask |
| check-in | `POST /api/user/checkin?turnstile=` | its own token → `quota_awarded: 10000000` |
| gate | `GET /v1/models` + one completion | **200 with `content` or `reasoning`** → the key is written |

Turnstile tokens here are **single-use and document-bound**; a token produced in another context answers `Turnstile 校验失败`. **Headless Chrome does not work on this panel** — measured: `--headless=new` and `--headless=old` leave the widget empty for 60 s, while a headed window (visible or off-screen) answers in 2-4 s. `--headless` exists only as a diagnostic.

## ⚙️ CLI options

| Flag | Default | Meaning |
| --- | --- | --- |
| `--count N` | `1` | accounts to mint, serial |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | model used for the live gate |
| `--pool <file>` | `proxies.txt` | exit list, one line per proxy — optional |
| `--tries N` | `3` | exit candidates screened per account |
| `--mint-tries N` | `2` | full sign-up attempts (fresh mailbox + Chrome) per exit |
| `--gap MS` | `20000` | pause between accounts |
| `--panel-gap MS` | `14000` | pause between this panel's API calls |
| `--code-timeout S` | `240` | seconds to wait for the e-mail code |
| `--keys <file>` | `keys.txt` | key file for `--verify-only` / `--connect-9router` |
| `--headless` | off | diagnostic only — Turnstile will not mint |
| `--browser <exe>` | auto | Chrome binary (env `CHROME_PATH`) |
| `--debug-port N` | auto | Chrome DevTools port |
| `--verify-only` · `--screen` · `--connect-9router` · `--help` | | modes |

## 🛰️ Behind a proxy

- **With a pool:** `--pool <file>` (or the `SEEKAI_PROXIES` env). Every request — the Chrome browser included — goes through one exit, fail-closed: candidates are vetted first (sign-in renders + Turnstile script 200) and the run stays pinned to that exit for the whole account.
- **Without a pool:** the tool connects directly and prints `running WITHOUT a proxy (direct)`. Nothing else changes.
- **Exit quality decides success here.** On 2026-10-21 a raw pool produced mostly `no login form` / `no turnstile token`; of 26 candidates only **8** could run the rail. Screen first, then mint.
- SOCKS5 lines with a username/password are skipped (Chrome cannot authenticate to them); HTTP proxies with credentials are handled through the Fetch domain.

## 📄 Files

| Path | Contents |
| --- | --- |
| `keys.txt` | one live-verified key per line — git-ignored |
| `accounts.json` | username / password / e-mail / key / check-in state — git-ignored |
| `proxies.txt` | your exits — git-ignored |
| `out/` | run log, failure screenshots, `attempts.jsonl` — git-ignored |

## 🔌 Connect to 9Router

```bash
node src/cli.js --connect-9router                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-9router --9router-base http://localhost:20128 --9router-password 123456
```

Defaults: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Models are served as `seekai/<model id>`.

## 🐞 Issues

If SeekAI changes its sign-up form, its Turnstile site key (`0x4AAAAAAEcpuQE_WXc4ZfG8`), the check-in award or the model catalogue, the tool stops there and says so. **[Open an issue](../../issues)** with the command and the exact output.

## 📄 License

[MIT](LICENSE) © seekai-bulk-apikey contributors

---

## ⚠️ Account risk & how to minimise it
