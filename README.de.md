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

**Erstelle SeekAI-Konten (seekai.cc) in großen Mengen mit automatisch generierten API-Schlüsseln und sichere dir das tägliche $20-Check-in-Guthaben — OpenAI-kompatible Inferenz + 9Router-Connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20served-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Schnellstart](#-quick-start) · [🎁 Kostenlose Stufe](#-free-tier--how-much-you-get) · [🤖 Modelle](#-models--all-1-of-them) · [🧪 Die API verwenden](#-how-to-use-the-api) · [✅ Verifiziert](#-verified-working--every-key-is-tested) · [🧭 So funktioniert es](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Optionen](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Probleme](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Warum es das gibt

SeekAI betreibt ein New-API-Panel (`v1.0.0-rc.25`) auf `seekai.cc`, dessen **kostenlose Stufe ein täglicher 签到 (Check-in) ist: 10.000.000 Quota = $20 pro Konto, einmal pro Panel-Tag abrufbar**. Die Registrierung ist ein gewöhnliches E-Mail-+-Passwort-Formular (kein OAuth erforderlich), und das Willkommensguthaben ist nur ein Token (Quota 1) — der Check-in *ist* das Geld. Jeder abgesicherte Schritt — Code-Anforderung + Registrierung, Anmeldung und der Check-in selbst — trägt ein **Cloudflare-Turnstile**-Token, und dieses Widget wird auf diesem Panel nur in einem **headed Chrome** erzeugt, weshalb das Tool einen echten Browser über CDP steuert und den Exit prüft, bevor es ein Konto dafür ausgibt.

## 🎁 Kostenlose Stufe — wie viel du bekommst

| Was | Wert |
| --- | --- |
| Tägliches Guthaben | **ein Check-in pro Konto pro Panel-Tag = 10.000.000 Quota = $20** (`quota_per_unit 500000`) |
| Willkommensguthaben | Quota `1` (≈ $0,000002) — die kostenlose Stufe ist der Check-in, nicht die Anmeldung |
| Gemessener Lauf | **12 von 38 Konten am 2026-10-21 eingecheckt → +120.000.000 Quota = $240 in einem Durchlauf** (`providers/seekai.cc/out/checkin-2026-10-21.json`) |
| Zweiter Aufruf, gleicher Tag | `今日已签到` (idempotent, gilt als gesund) |
| Panel-Tag | **UTC+8** — er wechselt um 16:00 UTC |
| Ratenlimit | das Panel begrenzt die gesamte IP auf ~**5 Anfragen/Min** (`您已达到总请求数限制`) → Aufrufe ≥14 s auseinanderziehen |
| Karte / Telefon | **keine** — kein Zahlungsschritt irgendwo, und es wird keine Telefonnummer verlangt |
| Multi-Konto-Klausel | nicht veröffentlicht: `/api/user/agreement` ist nur für Admins (403 `AUTH_INSUFFICIENT_PRIVILEGE`) |

> 💡 Die kostenlose Stufe wird von SeekAI festgelegt und kann sich ändern. Prüfe die aktuellen Zahlen auf [seekai.cc](https://seekai.cc) — und lass das Gate des Tools selbst entscheiden:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelle — alle 1 davon

Das Panel bewirbt eine verifizierte Chat-ID für die Konten, die dieses Tool erstellt:

| Modell-ID | Hinweis |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | Chat-verifiziert für jeden Schlüssel am 2026-10-21; antwortet als Reasoning-Route |

`GET /v1/models` gibt die IDs zurück, die dieses Konto aufrufen darf; IDs mit dem Suffix `:free` werden mit **401 `API key is disabled`** abgelehnt, daher prüft das Tool auf die obige ID (und weicht auf das aus, was `/v1/models` anbietet und nicht abgelehnt wird).

Die Antwortform ist wichtig: Dieser Relay legt den Text in **`message.reasoning`** und lässt `message.content` **leer** (sein `finish_reason` ist `length` bei kurzen `max_tokens`). Ein Gate, das nur auf `content` schaut, hält aktive Schlüssel für unbrauchbar, daher akzeptiert das Tool `content || reasoning_content || reasoning` und meldet, welches Feld die Antwort enthielt.

## 🧪 Die API verwenden

Basis-URL **`https://seekai.cc/v1`** — OpenAI-kompatible Chat-Completions. Schlüssel sind **48 Zeichen ohne `sk-`-Präfix** (die Liste des Panels maskiert sie; das Tool gibt den Wert mit `POST /api/token/<id>/key` preis).

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

Ein Token, dessen eigenes `remain_quota` 0 ist und das nicht unbegrenzt ist, authentifiziert überhaupt nicht — erstelle den Schlüssel mit `unlimited_quota: true` (das macht das Tool).

## 🛠 Schnellstart

```bash
cd seekai-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + daily $20 check-in in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

Die Registrierung (und der Check-in) benötigt ein echtes, **headed** Chrome: Auf diesem Panel gemessen, lassen `--headless=new` und `--headless=old` das Turnstile-Widget 60 s lang leer, während ein headed Fenster — sichtbar oder außerhalb des Bildschirms — in 2-4 s antwortet. `keys.txt` wird erst geschrieben, nachdem `GET /v1/models` **und** eine echte Completion erfolgreich waren; `accounts.json` speichert den Kontozustand (Benutzername, Passwort, E-Mail, Schlüssel, Check-in-Guthaben).

### 🖱️ Der Launcher

`node src/launcher.js` ist ein Menü über die Aufgabenmodule: **mint** (ein frisches Konto, seine verifizierte E-Mail, der Schlüssel und der tägliche $20-Check-in), **verify** (das Chat-Gate erneut über `keys.txt` laufen lassen) und **screen** (HTTP-Prüfung der Exit-Liste). Einstellungen — Proxy-Liste, Kontenanzahl, Modell — bleiben in `launcher.config.json` erhalten. Jedes unten aufgeführte Flag ist direkt über die CLI erreichbar.

## 🚀 Ein Befehl

Das Captcha wird für dich gelöst — ein Befehl erstellt N Konten (mit dem täglichen $20-Check-in-Guthaben) und behält nur die Schlüssel, die ein echter Chat-Aufruf verifiziert hat:

```bash
node src/cli.js --count N        # N accounts, serial — the Turnstile widget is answered in a real Chrome
```

`--auto` ist die Standardeinstellung und es muss nichts übergeben werden: Das eingebettete `src/solver.js` öffnet ein headed Chrome, bindet das Turnstile-Widget des Panels ein und gibt das Token automatisch zurück. `--dry` gibt den aufgelösten Plan aus (Anzahl, Exit-Pool, Solver, Modell) und beendet sich mit **keiner geschriebenen Datei und keinem Netzwerkaufruf**. `node src/launcher.js` (oder `npm start`) ist derselbe Pfad als Menü.

> ⚠️ **Nutzungsbedingungen & Kontorisiko.** Dies ist ein Automatisierungstool, kein Konto-Verkäufer. Massenregistrierungen und Schlüsselerstellung liegen vollständig in deiner Verantwortung: Sie können gegen die Nutzungsbedingungen des Anbieters verstoßen und dazu führen, dass Adressen, Exits oder Konten blockiert werden. Verwende es nur auf Infrastruktur, die du automatisieren darfst, und halte die Anfragrate niedrig.

## ✅ Verifiziert funktionierend — jeder Schlüssel wird getestet

Alle unten aufgeführten Prüfungen wurden am **2026-10-21** mit der ausgelieferten CLI erneut ausgeführt (Exit-Pool, kein WARP).

| Prüfung | Ergebnis |
| --- | --- |
| `--screen` (HTTP-Exit-Prüfung) | Anmeldeseite muss rendern + `challenges.cloudflare.com/turnstile/v0/api.js` muss 200 antworten + der API-Host muss antworten |
| Exit-Prüfung in Chrome (im Ablauf) | eine Zeile, deren Widget nie erzeugt wird, wird abgelehnt, **bevor** ein Postfach verbraucht wird (das war der Blocker vom 2026-10-14, jetzt ein hartes Gate) |
| Registrierung | `POST /api/user/register?turnstile=` → **200** (`success: true`) nach dem Mail-Code |
| Schlüsselerstellung | `POST /api/token/` → Liste → `POST /api/token/<id>/key` → **200**, 48-Zeichen-Schlüssel |
| Täglicher Check-in | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`** ($20); 12 Konten in einem Lauf = **$240** |
| Chat pro Schlüssel | **jeder Schlüssel 200** auf `deepseek-ai/DeepSeek-V4-Flash-0731` (Antwort im `reasoning`-Feld) — erneut ausgeführt von dieser CLI, mit Exit-Rotation |
| `401 API key is disabled` | **exit-abhängig, kein Schlüssel-Urteil**: drei Schlüssel antworteten damit von einem Exit und 200 von einem anderen in derselben Minute, daher wiederholt das Gate diese Antwort beim nächsten Exit |
| Ein Schlüssel, der seine Prüfung nicht besteht | wird nie in `keys.txt` geschrieben (das Gate wiederholt Exit-Klassen-Fehler einmal) |

> **Qualitätsgates.** Jeder Schlüssel hier hat einen echten `chat-200` bestanden, bevor er in `keys.txt` geschrieben wurde
> (tote Schlüssel werden nie ausgeliefert). Router-Kombinationen folgen derselben Regel auf Modellebene: Ein Eintrag wird
> **nur hinzugefügt, wenn das Modell `chat-200` antwortet und Tools aufrufen kann** — ein Modell ohne Tool-Unterstützung,
> ein toter Schlüssel oder ein toter Anbieter wird verworfen statt hinzugefügt. Führe den Verifizierungsschritt jederzeit erneut aus;
> Fehler werden gemeldet, nie versteckt.

## 🧭 So funktioniert es

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: SeekAI page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://seekai.cc/v1/chat/completions → real content = the key is live
```

| Schritt | Aufruf | Hinweise |
| --- | --- | --- |
| screen | `/sign-in` in Chrome | das eigene Widget des Panels muss sich einbinden **und erzeugen**; eine Zeile, die die Seite lädt, aber nie antwortet, kann sich nicht registrieren |
| Mailbox | Emailnator-Gmail-Box | die Rail recycelt Adressen, daher wird nur Mail von `seekai` akzeptiert |
| Registrierung | `/sign-up` → `GET /api/verification?email=&turnstile=` | ein Token deckt die Code-Anforderung **und** den Register-Aufruf ab |
| register | `POST /api/user/register?turnstile=` | Body: Benutzername, Passwort, E-Mail, verification_code |
| login | `POST /api/user/login?turnstile=` | eigenes Token → `data.access_token` |
| key | `POST /api/token/` → Liste → `/api/token/<id>/key` | kein Captcha auf diesen Routen; die Liste zeigt nur eine Maske |
| check-in | `POST /api/user/checkin?turnstile=` | eigenes Token → `quota_awarded: 10000000` |
| gate | `GET /v1/models` + eine Completion | 200 mit `content` **oder** `reasoning` → der Schlüssel wird geschrieben |

Das Panel antwortet außerdem mit **`401 API key is disabled`** aus Gründen, die nichts mit dem Schlüssel zu tun haben (gemessen am 2026-10-21: derselbe Schlüssel, ein Exit 401, ein anderer 200 innerhalb einer Minute) — ein Verify-Lauf sollte die Exits rotieren, bevor er das glaubt.

Turnstile-Token sind hier **einmalig verwendbar und dokumentgebunden**: Ein Token, das in einem anderen Kontext erzeugt wurde, antwortet mit `Turnstile 校验失败`. Playwright-artige Automatisierung ist nicht erforderlich — ein einfacher CDP-`Runtime.evaluate` + `Input.dispatchMouseEvent`-Klick genügt, und genau das macht dieser Client ohne Abhängigkeiten.

## ⚙️ CLI-Optionen

```bash
node src/cli.js --count 5                  # five sign-ups, serial (one headed Chrome at a time)
node src/cli.js --model deepseek-ai/DeepSeek-V4-Flash-0731
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Flag | Standard | Bedeutung |
| --- | --- | --- |
| `--count N` | `1` | Anzahl der zu erstellenden Konten, seriell |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | Modell, das für das Live-Gate verwendet wird |
| `--pool <file>` | `proxies.txt` | Exit-Liste, eine Zeile pro Proxy — optional |
| `--exits N` | `6` | Exit-Kandidaten, die pro Konto geprüft werden |
| `--mint-tries N` | `2` | vollständige Registrierungsversuche (frisches Postfach + Chrome) pro Exit |
| `--gap MS` | `20000` | Pause zwischen den Konten |
| `--panel-gap MS` | `14000` | Pause zwischen den API-Aufrufen dieses Panels (5 Anfragen/Min) |
| `--code-timeout S` | `240` | Sekunden, die auf den E-Mail-Code gewartet wird |
| `--keys <file>` | `keys.txt` | Schlüsseldatei für `--verify-only` / `--connect-9router` |
| `--headless` | aus | **nur zur Diagnose** — Turnstile wird nicht erzeugt, jede Erstellung schlägt fehl |

## 🛰️ Hinter einem Proxy

**Optional — bei Skalierung empfohlen (Limits pro IP, Sperren).** Das Tool funktioniert auch ohne Proxy.

- **Mit einem Pool:** Übergib `--pool <file>` (oder setze `SEEKAI_PROXIES`), und jede Anfrage — einschließlich des Chrome-Browsers — geht durch einen Exit aus dieser Liste, fail-closed: Jeder Kandidat wird zuerst geprüft (Anmeldeseite rendert + Turnstile-Skript 200), und der Lauf bleibt dann für das gesamte Konto an diesen Exit gebunden.
- **Ohne einen Pool:** Die CLI gibt `running WITHOUT a proxy (direct)` aus und verbindet direkt. An Registrierung, Schlüsselerstellung oder Check-in ändert sich nichts — nur daran, wo die Pakete das Netz verlassen.
- **Die Exit-Qualität entscheidet hier über den Erfolg.** Am 2026-10-21 lieferte ein roher Pool überwiegend `no login form` / `no turnstile token`; von 26 Kandidaten konnten nur **8** die Rail tatsächlich ausführen. Erst prüfen, dann erstellen.
- SOCKS5-Zeilen mit Benutzername/Passwort werden übersprungen: Chrome kann sich bei ihnen nicht authentifizieren (HTTP-Proxys mit Zugangsdaten werden über die Fetch-Domain behandelt).

## 📄 Dateien

| Pfad | Inhalt |
| --- | --- |
| `keys.txt` | ein live-verifizierter Schlüssel pro Zeile — von Git ignoriert |
| `accounts.json` | Benutzername / Passwort / E-Mail / Schlüssel / Check-in-Status, inkl. fehlgeschlagener Versuche |
| `proxies.txt` | deine Exits — von Git ignoriert |
| `out/` | Lauf-Log, Fehler-Screenshots, `attempts.jsonl`-Ledger — von Git ignoriert |

## 🔌 Mit 9Router verbinden

[9Router](https://9router.com) ist ein selbst gehosteter, OpenAI-kompatibler Router:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Standardwerte: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Modelle werden als `seekai/<model id>` bereitgestellt. Die CLI kann dasselbe in einem Durchgang erledigen: `node src/cli.js --connect-9router`.

## 🔌 Mit OmniRoute verbinden

[OmniRoute](https://omniroute.online) ist ein selbst gehosteter, OpenAI-kompatibler Router:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Standardwerte: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Modelle werden als `seekai/<model id>` bereitgestellt. Die CLI kann dasselbe in einem Durchgang erledigen: `node src/cli.js --connect-omniroute`.

## 🔑 Was ein Schlüssel dir bringt

| | |
| --- | --- |
| 🏢 Anbieter | **SeekAI** — [seekai.cc](https://seekai.cc) |
| 🎁 Was der Anbieter gibt | **$20 pro Konto pro Tag**, abgerufen mit einem Check-in (`quota_awarded: 10000000`) |
| 🔑 Was ein Schlüssel dir bringt | die Modellliste des Kontos auf `https://seekai.cc/v1`, abgerechnet gegen das Check-in-Guthaben |
| 🌐 API-Form | OpenAI-kompatibel: `POST https://seekai.cc/v1/chat/completions` (Antworten können im `reasoning`-Feld eintreffen) |
| 🔒 Deine Daten | nur `seekai.cc` und dein Mailbox-Backend werden kontaktiert |

## 🐞 Probleme

Wenn SeekAI sein Registrierungsformular, seinen Turnstile-Site-Key (`0x4AAAAAAEcpuQE_WXc4ZfG8`), die Check-in-Prämie oder den Modellkatalog ändert, stoppt das Tool dort und sagt es dir. **[Öffne ein Issue](../../issues)** mit dem Befehl und der genauen Ausgabe.

## 📄 Lizenz

MIT © 2026 — siehe [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 seekai-bulk-apikey contributors

</div>