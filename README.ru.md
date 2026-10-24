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

**Массовое создание аккаунтов SeekAI (seekai.cc) с автоматически сгенерированными API-ключами и получение ежедневного бонуса за чекин в размере $20 — инференс, совместимый с OpenAI, + коннектор 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20served-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Быстрый старт](#-quick-start) · [🎁 Бесплатный тариф](#-free-tier--how-much-you-get) · [🤖 Модели](#-models--all-1-of-them) · [🧪 Использование API](#-how-to-use-the-api) · [✅ Проверено](#-verified-working--every-key-is-tested) · [🧭 Как это работает](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Опции](#️-cli-options) · [🛰️ Прокси](#️-behind-a-proxy) · [🐞 Проблемы](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Зачем это нужно

SeekAI запускает панель New API (`v1.0.0-rc.25`) на `seekai.cc`, **бесплатный тариф которой — это ежедневный 签到 (чекин): 10 000 000 квоты = $20 на аккаунт, начисляется один раз за день панели**. Регистрация — обычная форма с e-mail и паролем (OAuth не требуется), а приветственный бонус — это лишь токен (квота 1) — именно чекин *и есть* деньги. Каждый шаг с ограничениями — запрос кода + регистрация, вход и сам чекин — несёт токен **Cloudflare Turnstile**, а этот виджет генерируется только в **headed Chrome** на этой панели, поэтому инструмент управляет настоящим браузером через CDP и проверяет выход, прежде чем потратить на него аккаунт.

## 🎁 Бесплатный тариф — сколько вы получаете

| Что | Значение |
| --- | --- |
| Ежедневный бонус | **один чекин на аккаунт за день панели = 10 000 000 квоты = $20** (`quota_per_unit 500000`) |
| Приветственный бонус | квота `1` (≈ $0.000002) — бесплатный тариф — это чекин, а не регистрация |
| Измеренный запуск | **12 из 38 аккаунтов отметились чекином 2026-10-21 → +120 000 000 квоты = $240 за один проход** (`providers/seekai.cc/out/checkin-2026-10-21.json`) |
| Второй вызов в тот же день | `今日已签到` (идемпотентно, считается здоровым) |
| День панели | **UTC+8** — сбрасывается в 16:00 UTC |
| Ограничение скорости | панель ограничивает весь IP примерно до **5 запросов/мин** (`您已达到总请求数限制`) → интервал между вызовами ≥14 с |
| Карта / телефон | **нет** — нигде нет шага оплаты, и номер телефона не запрашивается |
| Пункт о мультиаккаунтинге | не опубликован: `/api/user/agreement` доступен только администратору (403 `AUTH_INSUFFICIENT_PRIVILEGE`) |

> 💡 Бесплатный тариф устанавливается SeekAI и может измениться. Проверяйте актуальные цифры на [seekai.cc](https://seekai.cc) — и пусть решение принимает собственный гейт инструмента:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Модели — все 1 из них

Панель рекламирует один проверенный chat id на аккаунтах, которые создаёт этот инструмент:

| ID модели | примечание |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | проверен чатом для каждого ключа 2026-10-21; отвечает как reasoning-маршрут |

`GET /v1/models` возвращает id, которые этот аккаунт может вызывать; id с суффиксом `:free` отклоняются с **401 `API key is disabled`**, поэтому инструмент проверяет по id выше (и откатывается к тому, что предлагает `/v1/models`, если оно не отклоняется).

Форма ответа важна: этот релей помещает текст в **`message.reasoning`** и оставляет `message.content` **пустым** (его `finish_reason` — `length` для коротких `max_tokens`). Гейт, который смотрит только на `content`, считает живые ключи непригодными, поэтому инструмент принимает `content || reasoning_content || reasoning` и сообщает, какой из них нёс ответ.

## 🧪 Как использовать API

Базовый URL **`https://seekai.cc/v1`** — chat completions, совместимые с OpenAI. Ключи — **48 символов без префикса `sk-`** (список панели маскирует их; инструмент раскрывает значение через `POST /api/token/<id>/key`).

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

Токен, у которого собственный `remain_quota` равен 0 и который не является безлимитным, вообще не аутентифицируется — создавайте ключ с `unlimited_quota: true` (инструмент так и делает).

## 🛠 Быстрый старт

```bash
cd seekai-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + daily $20 check-in in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

Регистрация (и чекин) требует настоящего, **headed** Chrome: по измерениям на этой панели `--headless=new` и `--headless=old` оставляют виджет Turnstile пустым на 60 с, тогда как headed-окно — видимое или за экраном — отвечает за 2-4 с. `keys.txt` записывается только после `GET /v1/models` **и** реального завершения; `accounts.json` хранит состояние аккаунта (имя пользователя, пароль, e-mail, ключ, бонус за чекин).

### 🖱️ Лаунчер

`node src/launcher.js` — это меню над модулями задач: **mint** (свежий аккаунт, его подтверждённый e-mail, ключ и ежедневный чекин на $20), **verify** (повторный запуск чат-гейта по `keys.txt`) и **screen** (HTTP-проверка списка выходов). Настройки — список прокси, количество аккаунтов, модель — сохраняются в `launcher.config.json`. Каждый флаг ниже доступен напрямую из CLI.

## 🚀 Одна команда

Капча решается за вас — одна команда создаёт N аккаунтов (с ежедневным бонусом за чекин в $20) и оставляет только те ключи, которые подтвердил живой вызов чата:

```bash
node src/cli.js --count N        # N accounts, serial — the Turnstile widget is answered in a real Chrome
```

`--auto` — это значение по умолчанию, и ничего передавать не нужно: встроенный `src/solver.js` открывает headed Chrome, монтирует виджет Turnstile панели и автоматически возвращает токен. `--dry` выводит разрешённый план (количество, пул выходов, решатель, модель) и завершается, **не записывая файл и не делая сетевых вызовов**. `node src/launcher.js` (или `npm start`) — тот же путь в виде меню.

> ⚠️ **Условия и риск для аккаунта.** Это инструмент автоматизации, а не продавец аккаунтов. Массовые регистрации и создание ключей — полностью ваша ответственность: они могут нарушать Условия обслуживания провайдера и привести к блокировке адресов, выходов или аккаунтов. Используйте его только на инфраструктуре, которую вам разрешено автоматизировать, и поддерживайте низкую частоту запросов.

## ✅ Проверено в работе — каждый ключ протестирован

Все проверки ниже были повторно выполнены **2026-10-21** из поставляемого CLI (пул выходов, без WARP).

| Проверка | Результат |
| --- | --- |
| `--screen` (HTTP-проверка выходов) | страница входа должна отрендериться + `challenges.cloudflare.com/turnstile/v0/api.js` должен ответить 200 + хост API должен ответить |
| проверка выхода в Chrome (в потоке) | строка, виджет которой так и не генерируется, отклоняется **до** того, как потрачен почтовый ящик (это был блокер 2026-10-14, теперь — жёсткий гейт) |
| регистрация | `POST /api/user/register?turnstile=` → **200** (`success: true`) после почтового кода |
| создание ключа | `POST /api/token/` → список → `POST /api/token/<id>/key` → **200**, 48-символьный ключ |
| ежедневный чекин | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`** ($20); 12 аккаунтов за один запуск = **$240** |
| чат по каждому ключу | **каждый ключ 200** на `deepseek-ai/DeepSeek-V4-Flash-0731` (ответ несёт `reasoning`) — повторный запуск из этого CLI, с ротацией выходов |
| `401 API key is disabled` | **зависит от выхода, а не является вердиктом о ключе**: три ключа ответили так с одного выхода и 200 с другого в ту же минуту, поэтому гейт повторяет этот ответ на следующем выходе |
| ключ, не прошедший проверку | никогда не записывается в `keys.txt` (гейт один раз повторяет сбои класса выхода) |

> **Гейты качества.** Каждый ключ здесь прошёл живой `chat-200`, прежде чем был записан в `keys.txt`
> (мёртвые ключи никогда не поставляются). Комбинации роутера следуют тому же правилу на уровне модели: запись
> добавляется **только если модель отвечает `chat-200` и умеет вызывать инструменты** — модель без поддержки инструментов,
> мёртвый ключ или мёртвый провайдер отбрасывается, а не добавляется. Повторяйте шаг проверки в любое время;
> сбои сообщаются, а не скрываются.

## 🧭 Как это работает

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: SeekAI page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://seekai.cc/v1/chat/completions → real content = the key is live
```

| Шаг | Вызов | Примечания |
| --- | --- | --- |
| проверка | `/sign-in` в Chrome | собственный виджет панели должен смонтироваться **и сгенерироваться**; строка, которая загружает страницу, но никогда не отвечает, не может зарегистрироваться |
| почтовый ящик | gmail-ящик Emailnator | рельс перерабатывает адреса, поэтому принимается только почта от `seekai` |
| регистрация | `/sign-up` → `GET /api/verification?email=&turnstile=` | один токен покрывает запрос кода **и** вызов регистрации |
| регистрация | `POST /api/user/register?turnstile=` | тело: имя пользователя, пароль, e-mail, verification_code |
| вход | `POST /api/user/login?turnstile=` | собственный токен → `data.access_token` |
| ключ | `POST /api/token/` → список → `/api/token/<id>/key` | на этих маршрутах нет капчи; список показывает только маску |
| чекин | `POST /api/user/checkin?turnstile=` | собственный токен → `quota_awarded: 10000000` |
| гейт | `GET /v1/models` + одно завершение | 200 с `content` **или** `reasoning` → ключ записывается |

Панель также отвечает **`401 API key is disabled`** по причинам, не связанным с ключом (измерено 2026-10-21: тот же ключ, с одного выхода 401, с другого 200 в течение минуты) — при проверке следует ротировать выходы, прежде чем этому верить.

Токены Turnstile здесь **одноразовые и привязаны к документу**: токен, созданный в другом контексте, отвечает `Turnstile 校验失败`. Автоматизация в стиле Playwright не требуется — достаточно простого CDP `Runtime.evaluate` + клика `Input.dispatchMouseEvent`, что и делает этот клиент без зависимостей.

## ⚙️ Опции CLI

```bash
node src/cli.js --count 5                  # five sign-ups, serial (one headed Chrome at a time)
node src/cli.js --model deepseek-ai/DeepSeek-V4-Flash-0731
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Флаг | По умолчанию | Значение |
| --- | --- | --- |
| `--count N` | `1` | сколько аккаунтов создать, последовательно |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | модель, используемая для живого гейта |
| `--pool <file>` | `proxies.txt` | список выходов, по одному прокси на строку — необязательно |
| `--exits N` | `6` | кандидаты выходов, проверяемые на аккаунт |
| `--mint-tries N` | `2` | полные попытки регистрации (свежий ящик + Chrome) на выход |
| `--gap MS` | `20000` | пауза между аккаунтами |
| `--panel-gap MS` | `14000` | пауза между вызовами API этой панели (5 запросов/мин) |
| `--code-timeout S` | `240` | секунды ожидания почтового кода |
| `--keys <file>` | `keys.txt` | файл ключей для `--verify-only` / `--connect-9router` |
| `--headless` | выкл. | **только для диагностики** — Turnstile не сгенерируется, каждое создание завершится неудачей |

## 🛰️ За прокси

**Необязательно — рекомендуется при масштабе (лимиты на IP, баны).** Инструмент работает и без прокси.

- **С пулом:** передайте `--pool <file>` (или задайте `SEEKAI_PROXIES`), и каждый запрос — включая браузер Chrome — идёт через выход из этого списка, по принципу fail-closed: каждый кандидат сначала проверяется (страница входа рендерится + скрипт Turnstile отвечает 200), а затем запуск остаётся привязанным к этому выходу на весь аккаунт.
- **Без пула:** CLI выводит `running WITHOUT a proxy (direct)` и подключается напрямую. В регистрации, создании ключей или чекине ничего не меняется — только то, откуда уходят пакеты.
- **Качество выходов здесь решает успех.** 2026-10-21 сырой пул давал в основном `no login form` / `no turnstile token`; из 26 кандидатов только **8** действительно смогли пройти рельс. Сначала проверяйте, потом создавайте.
- Строки SOCKS5 с именем пользователя/паролем пропускаются: Chrome не может к ним аутентифицироваться (HTTP-прокси с учётными данными обрабатываются через домен Fetch).

## 📄 Файлы

| Путь | Содержимое |
| --- | --- |
| `keys.txt` | один проверенный вживую ключ на строку — игнорируется git |
| `accounts.json` | имя пользователя / пароль / e-mail / ключ / состояние чекина, включая неудачные попытки |
| `proxies.txt` | ваши выходы — игнорируется git |
| `out/` | журнал запуска, скриншоты сбоев, реестр `attempts.jsonl` — игнорируется git |

## 🔌 Подключение к 9Router

[9Router](https://9router.com) — это самостоятельно размещаемый роутер, совместимый с OpenAI:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

По умолчанию: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Модели подаются как `seekai/<model id>`. CLI может сделать то же самое одной командой: `node src/cli.js --connect-9router`.

## 🔌 Подключение к OmniRoute

[OmniRoute](https://omniroute.online) — это самостоятельно размещаемый роутер, совместимый с OpenAI:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

По умолчанию: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Модели подаются как `seekai/<model id>`. CLI может сделать то же самое одной командой: `node src/cli.js --connect-omniroute`.

## 🔑 Что даёт один ключ

| | |
| --- | --- |
| 🏢 Провайдер | **SeekAI** — [seekai.cc](https://seekai.cc) |
| 🎁 Что даёт провайдер | **$20 на аккаунт в день**, получается одним чекином (`quota_awarded: 10000000`) |
| 🔑 Что даёт один ключ | список моделей аккаунта на `https://seekai.cc/v1`, оплачивается из бонуса за чекин |
| 🌐 Форма API | совместим с OpenAI: `POST https://seekai.cc/v1/chat/completions` (ответы могут приходить в `reasoning`) |
| 🔒 Ваши данные | связывается только `seekai.cc` и бэкенд вашего почтового ящика |

## 🐞 Проблемы

Если SeekAI изменит свою форму регистрации, site key Turnstile (`0x4AAAAAAEcpuQE_WXc4ZfG8`), награду за чекин или каталог моделей, инструмент остановится там и сообщит об этом. **[Откройте issue](../../issues)** с командой и точным выводом.

## 📄 Лицензия

MIT © 2026 — см. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 seekai-bulk-apikey contributors

</div>