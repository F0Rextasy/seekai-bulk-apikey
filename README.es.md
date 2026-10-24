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

**Crea cuentas de SeekAI (seekai.cc) en masa con claves API autogeneradas y reclama el crédito diario de check-in de $20 — inferencia compatible con OpenAI + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20served-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Inicio rápido](#-quick-start) · [🎁 Nivel gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-1-of-them) · [🧪 Usa la API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Cómo funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opciones](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por qué existe esto

SeekAI ejecuta un panel de New API (`v1.0.0-rc.25`) en `seekai.cc` cuyo **nivel gratuito es un 签到 (check-in) diario: 10.000.000 de cuota = $20 por cuenta, reclamado una vez por día del panel**. El registro es un formulario normal de correo electrónico + contraseña (no se requiere OAuth), y el crédito de bienvenida es solo token (cuota 1) — el check-in *es* el dinero. Cada paso protegido — solicitud de código + registro, inicio de sesión y el propio check-in — lleva un token de **Cloudflare Turnstile**, y ese widget solo se genera en un **Chrome con interfaz gráfica** en este panel, por lo que la herramienta controla un navegador real mediante CDP y examina la salida antes de gastar una cuenta en ella.

## 🎁 Nivel gratuito — cuánto obtienes

| Qué | Valor |
| --- | --- |
| Crédito diario | **un check-in por cuenta por día del panel = 10.000.000 de cuota = $20** (`quota_per_unit 500000`) |
| Crédito de bienvenida | cuota `1` (≈ $0,000002) — el nivel gratuito es el check-in, no el registro |
| Ejecución medida | **12 de 38 cuentas con check-in el 2026-10-21 → +120.000.000 de cuota = $240 en una sola pasada** (`providers/seekai.cc/out/checkin-2026-10-21.json`) |
| Segunda llamada, mismo día | `今日已签到` (idempotente, cuenta como saludable) |
| Día del panel | **UTC+8** — cambia a las 16:00 UTC |
| Límite de velocidad | el panel limita toda la IP a ~**5 solicitudes/min** (`您已达到总请求数限制`) → espacia las llamadas ≥14 s |
| Tarjeta / teléfono | **ninguno** — no hay ningún paso de pago y no se pide número de teléfono |
| Cláusula de multicuenta | no publicada: `/api/user/agreement` es solo para administradores (403 `AUTH_INSUFFICIENT_PRIVILEGE`) |

> 💡 El nivel gratuito lo define SeekAI y puede cambiar. Consulta las cifras en vivo en [seekai.cc](https://seekai.cc) — y deja que la propia verificación de la herramienta decida:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — los 1 que hay

El panel anuncia un id de chat verificado en las cuentas que esta herramienta crea:

| ID del modelo | nota |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | chat verificado con cada clave el 2026-10-21; responde como una ruta de razonamiento |

`GET /v1/models` devuelve los ids que esta cuenta puede llamar; los ids con sufijo `:free` se rechazan con **401 `API key is disabled`**, por lo que la herramienta filtra por el id anterior (y recurre a lo que `/v1/models` ofrezca que no sea rechazado).

La forma de la respuesta importa: este relay coloca el texto en **`message.reasoning`** y deja `message.content` **vacío** (su `finish_reason` es `length` para `max_tokens` cortos). Una verificación que solo mira `content` considera inutilizables las claves activas, por lo que la herramienta acepta `content || reasoning_content || reasoning` e informa cuál llevó la respuesta.

## 🧪 Cómo usar la API

URL base **`https://seekai.cc/v1`** — chat completions compatible con OpenAI. Las claves tienen **48 caracteres sin prefijo `sk-`** (la lista del panel las enmascara; la herramienta revela el valor con `POST /api/token/<id>/key`).

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

Un token cuyo propio `remain_quota` sea 0 y que no sea ilimitado no autentica en absoluto — crea la clave con `unlimited_quota: true` (la herramienta lo hace).

## 🛠 Inicio rápido

```bash
cd seekai-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + daily $20 check-in in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

El registro (y el check-in) necesita un Chrome real **con interfaz gráfica**: medido en este panel, `--headless=new` y `--headless=old` dejan el widget de Turnstile vacío durante 60 s, mientras que una ventana con interfaz — visible o fuera de pantalla — responde en 2-4 s. `keys.txt` se escribe solo después de `GET /v1/models` **y** una completion real; `accounts.json` guarda el estado de la cuenta (usuario, contraseña, correo electrónico, clave, crédito de check-in).

### 🖱️ El lanzador

`node src/launcher.js` es un menú sobre los módulos de tareas: **mint** (una cuenta nueva, su correo electrónico verificado, la clave y el check-in diario de $20), **verify** (vuelve a ejecutar la verificación de chat sobre `keys.txt`) y **screen** (pasada HTTP sobre la lista de salidas). Los ajustes — lista de proxies, número de cuentas, modelo — persisten en `launcher.config.json`. Cada opción de abajo es accesible directamente desde la CLI.

## 🚀 Un solo comando

El captcha se resuelve por ti — un solo comando crea N cuentas (con el crédito diario de check-in de $20) y conserva solo las claves que una llamada de chat en vivo verificó:

```bash
node src/cli.js --count N        # N accounts, serial — the Turnstile widget is answered in a real Chrome
```

`--auto` es el valor predeterminado y no hay que pasar nada: el `src/solver.js` integrado abre un Chrome con interfaz, monta el widget de Turnstile del panel y devuelve el token automáticamente. `--dry` imprime el plan resuelto (cantidad, grupo de salidas, solucionador, modelo) y sale **sin escribir ningún archivo y sin ninguna llamada de red**. `node src/launcher.js` (o `npm start`) es la misma ruta en forma de menú.

> ⚠️ **Términos y riesgo de cuenta.** Esta es una herramienta de automatización, no un vendedor de cuentas. Los registros masivos y la creación de claves son enteramente tu responsabilidad: pueden infringir los Términos de Servicio del proveedor y provocar el bloqueo de direcciones, salidas o cuentas. Úsala solo en infraestructura que tengas permitido automatizar y mantén baja la tasa de solicitudes.

## ✅ Verificado y funcionando — cada clave se prueba

Todas las comprobaciones de abajo se volvieron a ejecutar el **2026-10-21** desde la CLI incluida (grupo de salidas, sin WARP).

| Comprobación | Resultado |
| --- | --- |
| `--screen` (verificación HTTP de salida) | la página de inicio de sesión debe renderizarse + `challenges.cloudflare.com/turnstile/v0/api.js` debe responder 200 + el host de la API debe responder |
| verificación de salida en Chrome (en flujo) | una línea cuyo widget nunca se genera se rechaza **antes** de gastar un buzón (este es el bloqueo del 2026-10-14, ahora una verificación estricta) |
| registro | `POST /api/user/register?turnstile=` → **200** (`success: true`) tras el código de correo |
| creación de clave | `POST /api/token/` → lista → `POST /api/token/<id>/key` → **200**, clave de 48 caracteres |
| check-in diario | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`** ($20); 12 cuentas en una ejecución = **$240** |
| chat por clave | **cada clave 200** en `deepseek-ai/DeepSeek-V4-Flash-0731` (respuesta llevada en `reasoning`) — reejecutado desde esta CLI, con rotación de salidas |
| `401 API key is disabled` | **depende de la salida, no es un veredicto sobre la clave**: tres claves lo respondieron desde una salida y 200 desde otra en el mismo minuto, por lo que la verificación reintenta esa respuesta en la siguiente salida |
| una clave que falla su comprobación | nunca se escribe en `keys.txt` (la verificación reintenta una vez los fallos de clase de salida) |

> **Verificaciones de calidad.** Cada clave aquí pasó un `chat-200` en vivo antes de escribirse en `keys.txt`
> (las claves muertas nunca se entregan). Las combinaciones del router siguen la misma regla a nivel de modelo: una entrada se
> añade **solo si el modelo responde `chat-200` y puede llamar a herramientas** — un modelo sin soporte de herramientas,
> una clave muerta o un proveedor muerto se descarta en lugar de añadirse. Vuelve a ejecutar el paso de verificación cuando quieras;
> los fallos se reportan, nunca se ocultan.

## 🧭 Cómo funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: SeekAI page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://seekai.cc/v1/chat/completions → real content = the key is live
```

| Paso | Llamada | Notas |
| --- | --- | --- |
| verificación | `/sign-in` en Chrome | el propio widget del panel debe montarse **y generarse**; una línea que carga la página pero nunca responde no puede registrarse |
| buzón | buzón de gmail de Emailnator | el riel recicla direcciones, así que solo se acepta correo de `seekai` |
| registro | `/sign-up` → `GET /api/verification?email=&turnstile=` | un token cubre la solicitud de código **y** la llamada de registro |
| registrar | `POST /api/user/register?turnstile=` | cuerpo: usuario, contraseña, correo electrónico, verification_code |
| inicio de sesión | `POST /api/user/login?turnstile=` | su propio token → `data.access_token` |
| clave | `POST /api/token/` → lista → `/api/token/<id>/key` | sin captcha en estas rutas; la lista solo muestra una máscara |
| check-in | `POST /api/user/checkin?turnstile=` | su propio token → `quota_awarded: 10000000` |
| verificación | `GET /v1/models` + una completion | 200 con `content` **o** `reasoning` → la clave se escribe |

El panel también responde **`401 API key is disabled`** por razones que no tienen nada que ver con la clave (medido el 2026-10-21: la misma clave, una salida 401, otra 200 en menos de un minuto) — una ejecución de verificación debería rotar las salidas antes de creerlo.

Los tokens de Turnstile aquí son **de un solo uso y vinculados al documento**: un token producido en otro contexto responde `Turnstile 校验失败`. No se requiere automatización estilo Playwright — basta con un simple `Runtime.evaluate` de CDP + un clic con `Input.dispatchMouseEvent`, que es lo que hace este cliente sin dependencias.

## ⚙️ Opciones de la CLI

```bash
node src/cli.js --count 5                  # five sign-ups, serial (one headed Chrome at a time)
node src/cli.js --model deepseek-ai/DeepSeek-V4-Flash-0731
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Opción | Predeterminado | Significado |
| --- | --- | --- |
| `--count N` | `1` | cuentas a crear, en serie |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | modelo usado para la verificación en vivo |
| `--pool <file>` | `proxies.txt` | lista de salidas, una línea por proxy — opcional |
| `--exits N` | `6` | candidatos de salida examinados por cuenta |
| `--mint-tries N` | `2` | intentos completos de registro (buzón nuevo + Chrome) por salida |
| `--gap MS` | `20000` | pausa entre cuentas |
| `--panel-gap MS` | `14000` | pausa entre las llamadas a la API de este panel (5 solicitudes/min) |
| `--code-timeout S` | `240` | segundos de espera para el código de correo |
| `--keys <file>` | `keys.txt` | archivo de claves para `--verify-only` / `--connect-9router` |
| `--headless` | desactivado | **solo diagnóstico** — Turnstile no se generará, toda creación falla |

## 🛰️ Detrás de un proxy

**Opcional — recomendado a escala (límites por IP, bloqueos).** La herramienta también funciona sin proxy.

- **Con un grupo:** pasa `--pool <file>` (o define `SEEKAI_PROXIES`) y cada solicitud — incluido el navegador Chrome — pasa por una salida de esa lista, con fallo cerrado: cada candidato se verifica primero (la página de inicio de sesión se renderiza + el script de Turnstile responde 200) y luego la ejecución queda fijada a esa salida durante toda la cuenta.
- **Sin un grupo:** la CLI imprime `running WITHOUT a proxy (direct)` y se conecta directamente. Nada del registro, la creación de claves o el check-in cambia — solo desde dónde salen los paquetes.
- **La calidad de la salida decide el éxito aquí.** El 2026-10-21 un grupo sin filtrar dio mayormente `no login form` / `no turnstile token`; de 26 candidatos solo **8** pudieron ejecutar realmente el riel. Examina primero, luego crea.
- Las líneas SOCKS5 con usuario/contraseña se omiten: Chrome no puede autenticarse con ellas (los proxies HTTP con credenciales se gestionan a través del dominio Fetch).

## 📄 Archivos

| Ruta | Contenido |
| --- | --- |
| `keys.txt` | una clave verificada en vivo por línea — ignorada por git |
| `accounts.json` | usuario / contraseña / correo electrónico / clave / estado de check-in, incl. intentos fallidos |
| `proxies.txt` | tus salidas — ignorado por git |
| `out/` | registro de ejecución, capturas de pantalla de fallos, libro mayor `attempts.jsonl` — ignorado por git |

## 🔌 Conectar con 9Router

[9Router](https://9router.com) es un router autoalojado y compatible con OpenAI:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Predeterminados: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Los modelos se sirven como `seekai/<model id>`. La CLI puede hacer lo mismo de una sola vez: `node src/cli.js --connect-9router`.

## 🔌 Conectar con OmniRoute

[OmniRoute](https://omniroute.online) es un router autoalojado y compatible con OpenAI:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Predeterminados: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Los modelos se sirven como `seekai/<model id>`. La CLI puede hacer lo mismo de una sola vez: `node src/cli.js --connect-omniroute`.

## 🔑 Qué te da una clave

| | |
| --- | --- |
| 🏢 Proveedor | **SeekAI** — [seekai.cc](https://seekai.cc) |
| 🎁 Qué da el proveedor | **$20 por cuenta por día**, reclamados con un check-in (`quota_awarded: 10000000`) |
| 🔑 Qué te da una clave | la lista de modelos de la cuenta en `https://seekai.cc/v1`, facturada contra el crédito de check-in |
| 🌐 Forma de la API | compatible con OpenAI: `POST https://seekai.cc/v1/chat/completions` (las respuestas pueden llegar en `reasoning`) |
| 🔒 Tus datos | solo se contacta con `seekai.cc` y tu backend de buzón |

## 🐞 Problemas

Si SeekAI cambia su formulario de registro, su clave de sitio de Turnstile (`0x4AAAAAAEcpuQE_WXc4ZfG8`), la recompensa del check-in o el catálogo de modelos, la herramienta se detiene ahí y lo indica. **[Abre un problema](../../issues)** con el comando y la salida exacta.

## 📄 Licencia

MIT © 2026 — consulta [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 seekai-bulk-apikey contributors

</div>