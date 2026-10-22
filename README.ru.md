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

**Массовое создание аккаунтов [SeekAI](https://seekai.cc) с автоматически сгенерированными API-ключами — $20 бонуса за ежедневную отметку на аккаунт — инференс, совместимый с OpenAI, + коннектор [9Router](https://9router.com).**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20verified-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)

[🛠 Быстрый старт](#-quick-start) · [✅ Проверено](#-verified-working--every-key-is-tested) · [🧭 Как это работает](#-how-it-works) · [🤖 Модели и бесплатный тариф](#-models--free-tier) · [⚙️ Опции](#️-cli-options) · [🛰️ Прокси](#️-behind-a-proxy) · [🔌 9Router](#-connect-to-9router) · [🐞 Проблемы](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Зачем это нужно

SeekAI использует панель New API на `seekai.cc`. Приветственный бонус — это погрешность округления (квота `1`); настоящий бесплатный тариф — это **ежедневный 签到 (чек-ин): 10 000 000 квоты = $20 на аккаунт, один раз за день панели**. Регистрация — обычная форма с e-mail и паролем — без OAuth, без телефона, без карты — но каждый защищённый шаг (запрос кода + регистрация, вход и сам чек-ин) защищён **Cloudflare Turnstile**, а этот виджет срабатывает только в **headed Chrome** на этой панели. Этот инструмент управляет настоящим Chrome через CDP (без зависимостей), проверяет выход перед тем, как потратить на него аккаунт, создаёт ключ, забирает бонус за день и оставляет только те ключи, которые ответили на реальный запрос завершения.

## 🤖 Модели и бесплатный тариф

| ID модели | примечание |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | единственный id, проверенный на каждом ключе (18/18 на 2026-10-21); отвечает как reasoning-маршрут |

`GET /v1/models` вернул **29 id** для этих аккаунтов; id с суффиксом `:free` отклоняются с `401 API key is disabled`, поэтому шлюз использует id выше и откатывается к тому, что аккаунт может вызвать.

**Ловушка reasoning:** этот релей помещает ответ в `message.reasoning` и оставляет `message.content` **пустым**. Шлюз, который читает только `content`, помечает живые ключи как мёртвые — этот инструмент принимает `content || reasoning_content || reasoning` и сообщает, какой из них нёс текст.

| Что даёт бесплатный тариф | Значение |
| --- | --- |
| Ежедневный чек-ин | **10 000 000 квоты = $20 на аккаунт, один раз за день панели** (`quota_per_unit 500000`) |
| Второй вызов в тот же день | `今日已签到` (идемпотентно — считается здоровым) |
| День панели | **UTC+8** — сбрасывается в 16:00 UTC |
| Измеренный запуск (2026-10-21) | **12 из 38 аккаунтов отметились → +120 000 000 квоты = $240 за один проход** |
| Ограничение скорости | ~**5 запросов/мин на IP** (`您已达到总请求数限制`) → вызовы разнесены на ≥14 с |
| Карта / телефон | нет, нигде в процессе |

Поведение при ограничении скорости, измеренное: `200 200 200 200 200`, затем `429`, если интервал игнорируется; `already-checked-in` отвечает `200 {"success":false,"message":"今日已签到"}`.

## 🛠 Быстрый старт

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

`keys.txt` записывается только после `GET /v1/models` **и** реального запроса завершения; `accounts.json` хранит состояние аккаунта (имя пользователя, пароль, e-mail, ключ, бонус за чек-ин).

### 🖱️ Лаунчер

`node src/launcher.js` выводит логотип выше и предлагает нумерованное меню: **создать** (N аккаунтов, последовательно), **проверить** (`keys.txt`), **проверить выходы** (список выходов), **настройки** (файл прокси, модель, количество — хранятся в `launcher.config.json`), **подключить к 9Router**, справка и выход. Каждый пункт — это тонкая обёртка над теми же флагами `src/cli.js`.

## ✅ Проверено в работе — каждый ключ протестирован

Все проверки были выполнены **2026-10-21** с помощью этого инструмента.

| Проверка | Результат |
| --- | --- |
| `--screen` (HTTP-проверка выхода) | страница входа отображается + `challenges.cloudflare.com/turnstile/v0/api.js` отвечает **200** + API-хост отвечает |
| проверка выхода внутри процесса | строка, виджет которой так и не срабатывает, отклоняется **до** того, как потрачен почтовый ящик |
| регистрация | `POST /api/user/register?turnstile=` → **200** после кода из письма |
| создание ключа | `POST /api/token/` → список → `POST /api/token/<id>/key` → **200**, 48-символьный ключ |
| ежедневный чек-ин | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`**; 12 аккаунтов за один запуск = **$240** |
| чат по каждому ключу | **18 / 18 ключей 200** на `deepseek-ai/DeepSeek-V4-Flash-0731` (текст в `reasoning`) |
| ключ, не прошедший проверку | никогда не записывается в `keys.txt` |

Повторная проверка в любое время:

```bash
node src/cli.js --verify-only            # every key in keys.txt through the live gate
curl https://seekai.cc/v1/chat/completions \
  -H "Authorization: Bearer <48-char-key>" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-ai/DeepSeek-V4-Flash-0731","messages":[{"role":"user","content":"Reply with one short sentence: what is 2+2?"}],"max_tokens":64}'
```

## 🧭 Как это работает

| Шаг | Вызов | Примечания |
| --- | --- | --- |
| проверка | `/sign-in` в Chrome | виджет панели должен смонтироваться **и сработать**; строка, которая загружает страницу, но никогда не отвечает, не может зарегистрироваться |
| почтовый ящик | gmail-ящик Emailnator | адреса переиспользуются, поэтому принимается только почта от `seekai` |
| регистрация | `GET /api/verification?email=&turnstile=` | **один токен покрывает запрос кода и вызов регистрации** |
| регистрация | `POST /api/user/register?turnstile=` | имя пользователя, пароль, e-mail, verification_code |
| вход | `POST /api/user/login?turnstile=` | свой собственный токен → `data.access_token` |
| ключ | `POST /api/token/` → список → `/api/token/<id>/key` | на этих маршрутах нет капчи; список показывает только маску |
| чек-ин | `POST /api/user/checkin?turnstile=` | свой собственный токен → `quota_awarded: 10000000` |
| шлюз | `GET /v1/models` + один запрос завершения | **200 с `content` или `reasoning`** → ключ записывается |

Токены Turnstile здесь **одноразовые и привязаны к документу**; токен, созданный в другом контексте, отвечает `Turnstile 校验失败`. **Headless Chrome не работает на этой панели** — измерено: `--headless=new` и `--headless=old` оставляют виджет пустым на 60 с, тогда как headed-окно (видимое или за экраном) отвечает за 2-4 с. `--headless` существует только как диагностика.

## ⚙️ Опции CLI

| Флаг | По умолчанию | Значение |
| --- | --- | --- |
| `--count N` | `1` | количество аккаунтов для создания, последовательно |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | модель, используемая для живого шлюза |
| `--pool <file>` | `proxies.txt` | список выходов, по одному прокси на строку — необязательно |
| `--tries N` | `3` | кандидаты выходов, проверяемые на аккаунт |
| `--mint-tries N` | `2` | полные попытки регистрации (новый почтовый ящик + Chrome) на выход |
| `--gap MS` | `20000` | пауза между аккаунтами |
| `--panel-gap MS` | `14000` | пауза между API-вызовами этой панели |
| `--code-timeout S` | `240` | секунды ожидания кода из письма |
| `--keys <file>` | `keys.txt` | файл ключей для `--verify-only` / `--connect-9router` |
| `--headless` | выкл. | только для диагностики — Turnstile не сработает |
| `--browser <exe>` | авто | бинарник Chrome (переменная окружения `CHROME_PATH`) |
| `--debug-port N` | авто | порт Chrome DevTools |
| `--verify-only` · `--screen` · `--connect-9router` · `--help` | | режимы |

## 🛰️ За прокси

- **С пулом:** `--pool <file>` (или переменная окружения `SEEKAI_PROXIES`). Каждый запрос — включая браузер Chrome — идёт через один выход, с отказом при ошибке: кандидаты сначала проверяются (страница входа отображается + скрипт Turnstile 200), и запуск остаётся привязанным к этому выходу на весь аккаунт.
- **Без пула:** инструмент подключается напрямую и выводит `running WITHOUT a proxy (direct)`. Больше ничего не меняется.
- **Качество выхода определяет успех здесь.** 2026-10-21 сырой пул выдавал в основном `no login form` / `no turnstile token`; из 26 кандидатов только **8** смогли пройти путь. Сначала проверяйте, потом создавайте.
- Строки SOCKS5 с именем пользователя/паролем пропускаются (Chrome не может аутентифицироваться в них); HTTP-прокси с учётными данными обрабатываются через домен Fetch.

## 📄 Файлы

| Путь | Содержимое |
| --- | --- |
| `keys.txt` | по одному проверенному в работе ключу на строку — игнорируется git |
| `accounts.json` | имя пользователя / пароль / e-mail / ключ / состояние чек-ина — игнорируется git |
| `proxies.txt` | ваши выходы — игнорируется git |
| `out/` | журнал запуска, скриншоты ошибок, `attempts.jsonl` — игнорируется git |

## 🔌 Подключение к 9Router

```bash
node src/cli.js --connect-9router                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-9router --9router-base http://localhost:20128 --9router-password 123456
```

По умолчанию: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Модели подаются как `seekai/<model id>`.

## 🔌 Подключение к OmniRoute

```bash
node src/cli.js --connect-omniroute                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-omniroute --omniroute-base http://localhost:20128 --omniroute-password 123456
```

По умолчанию: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Модели подаются как `seekai/<model id>`.
## 🐞 Проблемы

Если SeekAI изменит форму регистрации, site key Turnstile (`0x4AAAAAAEcpuQE_WXc4ZfG8`), награду за чек-ин или каталог моделей, инструмент остановится там и сообщит об этом. **[Откройте issue](../../issues)** с командой и точным выводом.

## 📄 Лицензия

[MIT](LICENSE) © seekai-bulk-apikey contributors

---

## ⚠️ Риск блокировки и как его снизить
