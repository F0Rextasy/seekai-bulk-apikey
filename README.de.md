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

**Massenhaft [SeekAI](https://seekai.cc)-Konten mit automatisch generierten API-Schlüsseln erstellen — ein Check-in-Guthaben von 20 $ pro Konto und Tag — OpenAI-kompatible Inferenz + [9Router](https://9router.com)-Konnektor.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20verified-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)

[🛠 Schnellstart](#-quick-start) · [✅ Verifiziert](#-verified-working--every-key-is-tested) · [🧭 Funktionsweise](#-how-it-works) · [🤖 Modelle & kostenlose Stufe](#-models--free-tier) · [⚙️ Optionen](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🔌 9Router](#-connect-to-9router) · [🐞 Probleme](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Warum es das gibt

SeekAI betreibt ein New-API-Panel auf `seekai.cc`. Das Willkommensguthaben ist ein Rundungsfehler (Kontingent `1`); die eigentliche kostenlose Stufe ist der **tägliche 签到 (Check-in): 10.000.000 Kontingent = 20 $ pro Konto, einmal pro Panel-Tag**. Die Anmeldung ist ein gewöhnliches E-Mail-+-Passwort-Formular — kein OAuth, kein Telefon, keine Karte —, aber jeder abgesicherte Schritt (Code-Anforderung + Registrierung, Anmeldung und der Check-in selbst) trägt ein **Cloudflare Turnstile**, und dieses Widget wird auf diesem Panel nur in einem **headed Chrome** erzeugt. Dieses Tool steuert ein echtes Chrome über CDP (keine Abhängigkeiten), prüft den Exit, bevor ein Konto dafür ausgegeben wird, erzeugt den Schlüssel, holt das Tagesguthaben ab und behält nur die Schlüssel, die eine echte Completion beantwortet haben.

## 🤖 Modelle & kostenlose Stufe

| Modell-ID | Hinweis |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | die einzige ID, die bei jedem Schlüssel verifiziert wurde (18/18 am 2026-10-21); antwortet als Reasoning-Route |

`GET /v1/models` lieferte **29 IDs** für diese Konten; IDs mit dem Suffix `:free` werden mit `401 API key is disabled` abgelehnt, daher verwendet das Gate die obige ID und weicht auf das aus, was das Konto aufrufen kann.

**Die Reasoning-Falle:** Dieser Relay legt die Antwort in `message.reasoning` ab und lässt `message.content` **leer**. Ein Gate, das nur `content` liest, markiert lebende Schlüssel als tot — dieses Tool akzeptiert `content || reasoning_content || reasoning` und meldet, welches Feld den Text enthielt.

| Was die kostenlose Stufe bietet | Wert |
| --- | --- |
| Täglicher Check-in | **10.000.000 Kontingent = 20 $ pro Konto, einmal pro Panel-Tag** (`quota_per_unit 500000`) |
| Zweiter Aufruf am selben Tag | `今日已签到` (idempotent — gilt als gesund) |
| Panel-Tag | **UTC+8** — er wechselt um 16:00 UTC |
| Gemessener Lauf (2026-10-21) | **12 von 38 Konten eingecheckt → +120.000.000 Kontingent = 240 $ in einem Durchgang** |
| Ratenlimit | ~**5 Anfragen/Minute pro IP** (`您已达到总请求数限制`) → Aufrufe werden mit ≥14 s Abstand getätigt |
| Karte / Telefon | keine, nirgends im Ablauf |

Ratenlimit-Verhalten, gemessen: `200 200 200 200 200`, dann `429`, wenn der Abstand ignoriert wird; `already-checked-in` antwortet mit `200 {"success":false,"message":"今日已签到"}`.

## 🛠 Schnellstart

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

`keys.txt` wird erst geschrieben, nachdem `GET /v1/models` **und** eine echte Completion erfolgreich waren; `accounts.json` speichert den Kontozustand (Benutzername, Passwort, E-Mail, Schlüssel, Check-in-Guthaben).

### 🖱️ Der Launcher

`node src/launcher.js` gibt das Wortzeichen oben aus und bietet ein nummeriertes Menü: **mint** (N Konten, seriell), **verify** (`keys.txt`), **screen** (Exit-Liste), **settings** (Proxy-Datei, Modell, Anzahl — gespeichert in `launcher.config.json`), **connect to 9Router**, Hilfe und Beenden. Jeder Eintrag ist ein dünner Wrapper über dieselben `src/cli.js`-Flags.

## ✅ Verifiziert funktionierend — jeder Schlüssel wird getestet

Alle Prüfungen wurden am **2026-10-21** mit diesem Tool durchgeführt.

| Prüfung | Ergebnis |
| --- | --- |
| `--screen` (HTTP-Exit-Prüfung) | Anmeldeseite wird gerendert + `challenges.cloudflare.com/turnstile/v0/api.js` antwortet mit **200** + der API-Host antwortet |
| Exit-Prüfung innerhalb des Ablaufs | eine Zeile, deren Widget nie erzeugt wird, wird abgelehnt, **bevor** ein Postfach verbraucht wird |
| Registrierung | `POST /api/user/register?turnstile=` → **200** nach dem per E-Mail gesendeten Code |
| Schlüsselerzeugung | `POST /api/token/` → Liste → `POST /api/token/<id>/key` → **200**, 48-Zeichen-Schlüssel |
| Täglicher Check-in | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`**; 12 Konten in einem Lauf = **240 $** |
| Chat pro Schlüssel | **18 / 18 Schlüssel 200** bei `deepseek-ai/DeepSeek-V4-Flash-0731` (Text in `reasoning`) |
| Ein Schlüssel, der seine Prüfung nicht besteht | wird nie in `keys.txt` geschrieben |

Jederzeit erneut prüfen:

```bash
node src/cli.js --verify-only            # every key in keys.txt through the live gate
curl https://seekai.cc/v1/chat/completions \
  -H "Authorization: Bearer <48-char-key>" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-ai/DeepSeek-V4-Flash-0731","messages":[{"role":"user","content":"Reply with one short sentence: what is 2+2?"}],"max_tokens":64}'
```

## 🧭 Funktionsweise

| Schritt | Aufruf | Hinweise |
| --- | --- | --- |
| screen | `/sign-in` in Chrome | das Widget des Panels muss sich einbinden **und erzeugen**; eine Zeile, die die Seite lädt, aber nie antwortet, kann sich nicht registrieren |
| Mailbox | Emailnator-Gmail-Postfach | Adressen werden wiederverwendet, daher wird nur Mail von `seekai` akzeptiert |
| Registrierung | `GET /api/verification?email=&turnstile=` | **ein Token deckt die Code-Anforderung und den Registrierungsaufruf ab** |
| Registrieren | `POST /api/user/register?turnstile=` | Benutzername, Passwort, E-Mail, verification_code |
| Anmeldung | `POST /api/user/login?turnstile=` | eigenes Token → `data.access_token` |
| Schlüssel | `POST /api/token/` → Liste → `/api/token/<id>/key` | kein Captcha auf diesen Routen; die Liste zeigt nur eine Maske |
| Check-in | `POST /api/user/checkin?turnstile=` | eigenes Token → `quota_awarded: 10000000` |
| Gate | `GET /v1/models` + eine Completion | **200 mit `content` oder `reasoning`** → der Schlüssel wird geschrieben |

Turnstile-Token sind hier **einmalig verwendbar und dokumentgebunden**; ein in einem anderen Kontext erzeugtes Token antwortet mit `Turnstile 校验失败`. **Headless Chrome funktioniert auf diesem Panel nicht** — gemessen: `--headless=new` und `--headless=old` lassen das Widget 60 s lang leer, während ein headed Fenster (sichtbar oder außerhalb des Bildschirms) in 2-4 s antwortet. `--headless` existiert nur als Diagnose.

## ⚙️ CLI-Optionen

| Flag | Standard | Bedeutung |
| --- | --- | --- |
| `--count N` | `1` | Anzahl der zu erstellenden Konten, seriell |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | Modell, das für das Live-Gate verwendet wird |
| `--pool <file>` | `proxies.txt` | Exit-Liste, eine Zeile pro Proxy — optional |
| `--tries N` | `3` | Exit-Kandidaten, die pro Konto geprüft werden |
| `--mint-tries N` | `2` | vollständige Registrierungsversuche (frisches Postfach + Chrome) pro Exit |
| `--gap MS` | `20000` | Pause zwischen Konten |
| `--panel-gap MS` | `14000` | Pause zwischen den API-Aufrufen dieses Panels |
| `--code-timeout S` | `240` | Sekunden, die auf den E-Mail-Code gewartet wird |
| `--keys <file>` | `keys.txt` | Schlüsseldatei für `--verify-only` / `--connect-9router` |
| `--headless` | aus | nur Diagnose — Turnstile wird nicht erzeugt |
| `--browser <exe>` | auto | Chrome-Binary (Env `CHROME_PATH`) |
| `--debug-port N` | auto | Chrome-DevTools-Port |
| `--verify-only` · `--screen` · `--connect-9router` · `--help` | | Modi |

## 🛰️ Hinter einem Proxy

- **Mit einem Pool:** `--pool <file>` (oder die Env `SEEKAI_PROXIES`). Jede Anfrage — einschließlich des Chrome-Browsers — geht durch einen Exit, fail-closed: Kandidaten werden zuerst geprüft (Anmeldeseite wird gerendert + Turnstile-Skript 200) und der Lauf bleibt für das gesamte Konto an diesen Exit gebunden.
- **Ohne einen Pool:** Das Tool verbindet sich direkt und gibt `running WITHOUT a proxy (direct)` aus. Sonst ändert sich nichts.
- **Die Exit-Qualität entscheidet hier über den Erfolg.** Am 2026-10-21 lieferte ein roher Pool überwiegend `no login form` / `no turnstile token`; von 26 Kandidaten konnten nur **8** die Strecke durchlaufen. Erst prüfen, dann erstellen.
- SOCKS5-Zeilen mit Benutzername/Passwort werden übersprungen (Chrome kann sich bei ihnen nicht authentifizieren); HTTP-Proxys mit Anmeldedaten werden über die Fetch-Domain behandelt.

## 📄 Dateien

| Pfad | Inhalt |
| --- | --- |
| `keys.txt` | ein live verifizierter Schlüssel pro Zeile — von Git ignoriert |
| `accounts.json` | Benutzername / Passwort / E-Mail / Schlüssel / Check-in-Status — von Git ignoriert |
| `proxies.txt` | deine Exits — von Git ignoriert |
| `out/` | Lauf-Log, Fehler-Screenshots, `attempts.jsonl` — von Git ignoriert |

## 🔌 Mit 9Router verbinden

```bash
node src/cli.js --connect-9router                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-9router --9router-base http://localhost:20128 --9router-password 123456
```

Standardwerte: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Modelle werden als `seekai/<model id>` bereitgestellt.

## 🐞 Probleme

Wenn SeekAI sein Registrierungsformular, seinen Turnstile-Site-Key (`0x4AAAAAAEcpuQE_WXc4ZfG8`), die Check-in-Prämie oder den Modellkatalog ändert, stoppt das Tool dort und sagt es. **[Öffne ein Issue](../../issues)** mit dem Befehl und der genauen Ausgabe.

## 📄 Lizenz

[MIT](LICENSE) © seekai-bulk-apikey contributors

---

## ⚠️ Konto-Risiko und Minimierung
