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

**Crea cuentas de [SeekAI](https://seekai.cc) en masa con claves API autogeneradas — un crédito de check-in de $20 por cuenta al día — inferencia compatible con OpenAI + conector [9Router](https://9router.com).**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20verified-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)

[🛠 Inicio rápido](#-quick-start) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Cómo funciona](#-how-it-works) · [🤖 Modelos y nivel gratuito](#-models--free-tier) · [⚙️ Opciones](#️-cli-options) · [🛰️ Detrás de un proxy](#️-behind-a-proxy) · [🔌 9Router](#-connect-to-9router) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por qué existe esto

SeekAI ejecuta un panel de New API en `seekai.cc`. Su crédito de bienvenida es un error de redondeo (cuota `1`); el nivel gratuito real es el **签到 diario (check-in): 10.000.000 de cuota = $20 por cuenta, una vez por día del panel**. El registro es un formulario normal de correo electrónico + contraseña — sin OAuth, sin teléfono, sin tarjeta — pero cada paso protegido (solicitud de código + registro, inicio de sesión y el propio check-in) lleva un **Cloudflare Turnstile**, y ese widget solo se genera en un **Chrome con interfaz gráfica** en este panel. Esta herramienta controla un Chrome real a través de CDP (cero dependencias), examina la salida antes de gastar una cuenta en ella, genera la clave, reclama el crédito del día y conserva solo las claves que respondieron a una completion real.

## 🤖 Modelos y nivel gratuito

| ID del modelo | nota |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | el único id verificado en todas las claves (18/18 el 2026-10-21); responde como una ruta de razonamiento |

`GET /v1/models` devolvió **29 ids** para estas cuentas; los ids con sufijo `:free` se rechazan con `401 API key is disabled`, así que la puerta usa el id anterior y recurre a lo que la cuenta pueda llamar.

**La trampa del razonamiento:** este relay coloca la respuesta en `message.reasoning` y deja `message.content` **vacío**. Una puerta que solo lee `content` marca las claves activas como muertas — esta herramienta acepta `content || reasoning_content || reasoning` e informa cuál de ellos llevó el texto.

| Qué ofrece el nivel gratuito | Valor |
| --- | --- |
| Check-in diario | **10.000.000 de cuota = $20 por cuenta, una vez por día del panel** (`quota_per_unit 500000`) |
| Segunda llamada el mismo día | `今日已签到` (idempotente — cuenta como saludable) |
| Día del panel | **UTC+8** — cambia a las 16:00 UTC |
| Ejecución medida (2026-10-21) | **12 de 38 cuentas hicieron check-in → +120.000.000 de cuota = $240 en una sola pasada** |
| Límite de velocidad | ~**5 solicitudes/min por IP** (`您已达到总请求数限制`) → las llamadas se espacian ≥14 s |
| Tarjeta / teléfono | ninguno, en ningún punto del flujo |

Comportamiento del límite de velocidad, medido: `200 200 200 200 200` y luego `429` si se ignora el espaciado; `already-checked-in` responde `200 {"success":false,"message":"今日已签到"}`.

## 🛠 Inicio rápido

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

`keys.txt` se escribe solo después de `GET /v1/models` **y** una completion real; `accounts.json` conserva el estado de la cuenta (usuario, contraseña, correo electrónico, clave, crédito de check-in).

### 🖱️ El launcher

`node src/launcher.js` imprime el logotipo de arriba y ofrece un menú numerado: **mint** (N cuentas, en serie), **verify** (`keys.txt`), **screen** (lista de salidas), **settings** (archivo de proxy, modelo, cantidad — guardados en `launcher.config.json`), **connect to 9Router**, ayuda y salir. Cada elemento es un envoltorio fino sobre los mismos flags de `src/cli.js`.

## ✅ Verificado y funcionando — cada clave se prueba

Todas las comprobaciones se ejecutaron el **2026-10-21** desde esta herramienta.

| Comprobación | Resultado |
| --- | --- |
| `--screen` (verificación HTTP de salida) | la página de inicio de sesión se renderiza + `challenges.cloudflare.com/turnstile/v0/api.js` responde **200** + el host de la API responde |
| pantalla de salida dentro del flujo | una línea cuyo widget nunca se genera se rechaza **antes** de gastar un buzón |
| registro | `POST /api/user/register?turnstile=` → **200** después del código enviado por correo |
| generación de clave | `POST /api/token/` → list → `POST /api/token/<id>/key` → **200**, clave de 48 caracteres |
| check-in diario | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`**; 12 cuentas en una ejecución = **$240** |
| chat por clave | **18 / 18 claves 200** en `deepseek-ai/DeepSeek-V4-Flash-0731` (texto en `reasoning`) |
| una clave que falla su comprobación | nunca se escribe en `keys.txt` |

Vuelve a comprobar en cualquier momento:

```bash
node src/cli.js --verify-only            # every key in keys.txt through the live gate
curl https://seekai.cc/v1/chat/completions \
  -H "Authorization: Bearer <48-char-key>" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-ai/DeepSeek-V4-Flash-0731","messages":[{"role":"user","content":"Reply with one short sentence: what is 2+2?"}],"max_tokens":64}'
```

## 🧭 Cómo funciona

| Paso | Llamada | Notas |
| --- | --- | --- |
| pantalla | `/sign-in` en Chrome | el widget del panel debe montarse **y generarse**; una línea que carga la página pero nunca responde no puede registrarse |
| buzón | buzón de gmail de Emailnator | las direcciones se reciclan, así que solo se acepta correo de `seekai` |
| registro | `GET /api/verification?email=&turnstile=` | **un token cubre la solicitud del código y la llamada de registro** |
| registrar | `POST /api/user/register?turnstile=` | usuario, contraseña, correo electrónico, verification_code |
| inicio de sesión | `POST /api/user/login?turnstile=` | su propio token → `data.access_token` |
| clave | `POST /api/token/` → list → `/api/token/<id>/key` | sin captcha en estas rutas; la lista solo muestra una máscara |
| check-in | `POST /api/user/checkin?turnstile=` | su propio token → `quota_awarded: 10000000` |
| puerta | `GET /v1/models` + una completion | **200 con `content` o `reasoning`** → la clave se escribe |

Los tokens de Turnstile aquí son **de un solo uso y vinculados al documento**; un token producido en otro contexto responde `Turnstile 校验失败`. **Chrome sin interfaz gráfica no funciona en este panel** — medido: `--headless=new` y `--headless=old` dejan el widget vacío durante 60 s, mientras que una ventana con interfaz gráfica (visible o fuera de pantalla) responde en 2-4 s. `--headless` existe solo como diagnóstico.

## ⚙️ Opciones de CLI

| Flag | Predeterminado | Significado |
| --- | --- | --- |
| `--count N` | `1` | cuentas a crear, en serie |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | modelo usado para la puerta en vivo |
| `--pool <file>` | `proxies.txt` | lista de salidas, una línea por proxy — opcional |
| `--tries N` | `3` | candidatos de salida examinados por cuenta |
| `--mint-tries N` | `2` | intentos completos de registro (buzón nuevo + Chrome) por salida |
| `--gap MS` | `20000` | pausa entre cuentas |
| `--panel-gap MS` | `14000` | pausa entre las llamadas a la API de este panel |
| `--code-timeout S` | `240` | segundos de espera para el código por correo electrónico |
| `--keys <file>` | `keys.txt` | archivo de claves para `--verify-only` / `--connect-9router` |
| `--headless` | desactivado | solo diagnóstico — Turnstile no se generará |
| `--browser <exe>` | auto | binario de Chrome (env `CHROME_PATH`) |
| `--debug-port N` | auto | puerto de Chrome DevTools |
| `--verify-only` · `--screen` · `--connect-9router` · `--help` | | modos |

## 🛰️ Detrás de un proxy

- **Con un pool:** `--pool <file>` (o la variable de entorno `SEEKAI_PROXIES`). Cada solicitud — incluido el navegador Chrome — pasa por una salida, con fallo cerrado: los candidatos se verifican primero (el inicio de sesión se renderiza + el script de Turnstile responde 200) y la ejecución permanece fijada a esa salida durante toda la cuenta.
- **Sin un pool:** la herramienta se conecta directamente e imprime `running WITHOUT a proxy (direct)`. Nada más cambia.
- **La calidad de la salida decide el éxito aquí.** El 2026-10-21 un pool sin filtrar produjo mayormente `no login form` / `no turnstile token`; de 26 candidatos solo **8** pudieron ejecutar el proceso. Examina primero, luego crea.
- Las líneas SOCKS5 con usuario/contraseña se omiten (Chrome no puede autenticarse con ellas); los proxies HTTP con credenciales se manejan a través del dominio Fetch.

## 📄 Archivos

| Ruta | Contenido |
| --- | --- |
| `keys.txt` | una clave verificada en vivo por línea — ignorada por git |
| `accounts.json` | usuario / contraseña / correo electrónico / clave / estado de check-in — ignorado por git |
| `proxies.txt` | tus salidas — ignorado por git |
| `out/` | registro de ejecución, capturas de pantalla de fallos, `attempts.jsonl` — ignorado por git |

## 🔌 Conectar con 9Router

```bash
node src/cli.js --connect-9router                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-9router --9router-base http://localhost:20128 --9router-password 123456
```

Predeterminados: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Los modelos se sirven como `seekai/<model id>`.

## 🐞 Problemas

Si SeekAI cambia su formulario de registro, su site key de Turnstile (`0x4AAAAAAEcpuQE_WXc4ZfG8`), la recompensa del check-in o el catálogo de modelos, la herramienta se detiene ahí y lo indica. **[Abre un issue](../../issues)** con el comando y la salida exacta.

## 📄 Licencia

[MIT](LICENSE) © seekai-bulk-apikey contributors

---

## ⚠️ Riesgo de cuenta y cómo minimizarlo
