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

**批量创建 SeekAI (seekai.cc) 账户，自动生成 API 密钥并领取每日 $20 签到额度 — 兼容 OpenAI 的推理 + 9Router 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20served-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 快速开始](#-quick-start) · [🎁 免费额度](#-free-tier--how-much-you-get) · [🤖 模型](#-models--all-1-of-them) · [🧪 使用 API](#-how-to-use-the-api) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [🐞 问题反馈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 为什么会有这个项目

SeekAI 在 `seekai.cc` 上运行着一个 New API 面板（`v1.0.0-rc.25`），其**免费额度是每日签到：10,000,000 额度 = 每个账户 $20，每个面板日可领取一次**。注册是普通的邮箱 + 密码表单（无需 OAuth），而欢迎额度仅为 token（额度 1）——签到*才是*真正的钱。每个受限步骤——验证码请求 + 注册、登录以及签到本身——都带有 **Cloudflare Turnstile** token，而该组件只在此面板的**有头 Chrome** 中生成，这就是为什么该工具通过 CDP 驱动真实浏览器，并在为一个账户花费成本之前先筛选出口。

## 🎁 免费额度 — 你能获得多少

| 项目 | 值 |
| --- | --- |
| 每日额度 | **每个账户每个面板日一次签到 = 10,000,000 额度 = $20**（`quota_per_unit 500000`） |
| 欢迎额度 | 额度 `1`（≈ $0.000002）——免费额度是签到，而非注册 |
| 实测运行 | **2026-10-21 有 38 个账户中的 12 个签到成功 → +120,000,000 额度 = 一次运行 $240**（`providers/seekai.cc/out/checkin-2026-10-21.json`） |
| 同日第二次调用 | `今日已签到`（幂等，视为健康） |
| 面板日 | **UTC+8** —— 在 16:00 UTC 滚动 |
| 速率限制 | 面板将整个 IP 限制在约 **5 请求/分钟**（`您已达到总请求数限制`）→ 调用间隔 ≥14 秒 |
| 银行卡 / 手机 | **无** —— 任何环节都没有支付步骤，也不要求手机号 |
| 多账户条款 | 未公布：`/api/user/agreement` 仅限管理员（403 `AUTH_INSUFFICIENT_PRIVILEGE`） |

> 💡 免费额度由 SeekAI 设定，可能会变化。请在 [seekai.cc](https://seekai.cc) 查看实时数字——并让工具自身的门控来决定：

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 模型 — 全部 1 个

该面板在此工具创建的账户上仅公布一个已验证的聊天 id：

| 模型 ID | 备注 |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | 2026-10-21 对每个密钥进行了聊天验证；作为推理路由作答 |

`GET /v1/models` 返回此账户可调用的 id；带有 `:free` 后缀的 id 会被拒绝，返回 **401 `API key is disabled`**，因此该工具以上述 id 作为门控（并回退到 `/v1/models` 提供的任何未被拒绝的 id）。

回复结构很重要：此中继将文本放在 **`message.reasoning`** 中，并让 `message.content` **为空**（对于较短的 `max_tokens`，其 `finish_reason` 为 `length`）。只检查 `content` 的门控会把可用的密钥判定为不可用，因此该工具接受 `content || reasoning_content || reasoning`，并报告是哪一个承载了答案。

## 🧪 如何使用 API

基础 URL **`https://seekai.cc/v1`** —— 兼容 OpenAI 的聊天补全。密钥为 **48 个字符，不带 `sk-` 前缀**（面板的列表会将其掩码；该工具通过 `POST /api/token/<id>/key` 显示其值）。

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

一个自身 `remain_quota` 为 0 且非无限制的 token 根本无法通过认证——请以 `unlimited_quota: true` 创建密钥（该工具会这样做）。

## 🛠 快速开始

```bash
cd seekai-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + daily $20 check-in in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

注册（以及签到）需要一个真实的、**有头**的 Chrome：在此面板上实测，`--headless=new` 和 `--headless=old` 会让 Turnstile 组件空白 60 秒，而有头窗口——无论可见还是屏幕外——在 2-4 秒内作答。`keys.txt` 仅在 `GET /v1/models` **以及**一次真实补全之后才会写入；`accounts.json` 保存账户状态（用户名、密码、邮箱、密钥、签到额度）。

### 🖱️ 启动器

`node src/launcher.js` 是任务模块之上的菜单：**mint**（新账户、其已验证邮箱、密钥和每日 $20 签到）、**verify**（对 `keys.txt` 重新运行聊天门控）和 **screen**（对出口列表进行 HTTP 筛选）。设置——代理列表、账户数量、模型——持久化在 `launcher.config.json` 中。以下每个标志都可直接从 CLI 访问。

## ✅ 已验证可用 — 每个密钥都经过测试

以下所有检查均于 **2026-10-21** 从随附的 CLI 重新运行（出口池，无 WARP）。

| 检查 | 结果 |
| --- | --- |
| `--screen`（HTTP 出口审查） | 登录页必须渲染 + `challenges.cloudflare.com/turnstile/v0/api.js` 必须返回 200 + API 主机必须应答 |
| Chrome 中的出口筛选（流程内） | 组件从未生成的线路会在花费邮箱**之前**被拒绝（这是 2026-10-14 的阻塞点，现已成为硬性门控） |
| 注册 | 邮件验证码之后 `POST /api/user/register?turnstile=` → **200**（`success: true`） |
| 密钥生成 | `POST /api/token/` → 列表 → `POST /api/token/<id>/key` → **200**，48 字符密钥 |
| 每日签到 | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`**（$20）；一次运行 12 个账户 = **$240** |
| 每个密钥的聊天 | 在 `deepseek-ai/DeepSeek-V4-Flash-0731` 上**每个密钥均 200**（答案承载于 `reasoning`）——从此 CLI 重新运行，带出口轮换 |
| `401 API key is disabled` | **取决于出口，而非密钥判定**：三个密钥从一个出口返回此错误，而同一分钟内从另一个出口返回 200，因此门控会在下一个出口重试该应答 |
| 未通过检查的密钥 | 从不写入 `keys.txt`（门控对出口类失败重试一次） |

> **质量门控。** 这里的每个密钥在写入 `keys.txt` 之前都通过了实时 `chat-200`
> （死密钥从不发布）。路由器组合在模型层面遵循同样的规则：仅当模型应答 `chat-200` 且能调用工具时，
> 才会添加条目——不支持工具的模型、死密钥或死提供商会被丢弃而非添加。随时重新运行验证步骤；
> 失败会被报告，从不隐藏。

## 🧭 工作原理

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: SeekAI page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://seekai.cc/v1/chat/completions → real content = the key is live
```

| 步骤 | 调用 | 备注 |
| --- | --- | --- |
| 筛选 | Chrome 中的 `/sign-in` | 面板自身的组件必须挂载**并生成**；加载页面但从不作答的线路无法注册 |
| 邮箱 | Emailnator gmail 邮箱 | 该通道会回收地址，因此只接受来自 `seekai` 的邮件 |
| 注册 | `/sign-up` → `GET /api/verification?email=&turnstile=` | 一个 token 覆盖验证码请求**和**注册调用 |
| 注册 | `POST /api/user/register?turnstile=` | 请求体：用户名、密码、邮箱、验证码 |
| 登录 | `POST /api/user/login?turnstile=` | 其自身的 token → `data.access_token` |
| 密钥 | `POST /api/token/` → 列表 → `/api/token/<id>/key` | 这些路由上没有验证码；列表只显示掩码 |
| 签到 | `POST /api/user/checkin?turnstile=` | 其自身的 token → `quota_awarded: 10000000` |
| 门控 | `GET /v1/models` + 一次补全 | 200 且带 `content` **或** `reasoning` → 密钥被写入 |

该面板还会因与密钥无关的原因返回 **`401 API key is disabled`**（2026-10-21 实测：同一密钥，一个出口 401，另一个出口在一分钟内 200）——验证运行应在相信它之前轮换出口。

这里的 Turnstile token 是**一次性且绑定文档的**：在其他上下文中生成的 token 会返回 `Turnstile 校验失败`。不需要 Playwright 风格的自动化——一个普通的 CDP `Runtime.evaluate` + `Input.dispatchMouseEvent` 点击就足够了，这正是此零依赖客户端所做的。

## ⚙️ CLI 选项

```bash
node src/cli.js --count 5                  # five sign-ups, serial (one headed Chrome at a time)
node src/cli.js --model deepseek-ai/DeepSeek-V4-Flash-0731
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| 标志 | 默认值 | 含义 |
| --- | --- | --- |
| `--count N` | `1` | 要创建的账户数，串行 |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | 用于实时门控的模型 |
| `--pool <file>` | `proxies.txt` | 出口列表，每行一个代理——可选 |
| `--tries N` | `3` | 每个账户筛选的出口候选数 |
| `--mint-tries N` | `2` | 每个出口的完整注册尝试次数（新邮箱 + Chrome） |
| `--gap MS` | `20000` | 账户之间的暂停 |
| `--panel-gap MS` | `14000` | 此面板 API 调用之间的暂停（5 请求/分钟） |
| `--code-timeout S` | `240` | 等待邮件验证码的秒数 |
| `--keys <file>` | `keys.txt` | 用于 `--verify-only` / `--connect-9router` 的密钥文件 |
| `--headless` | 关闭 | **仅用于诊断** —— Turnstile 不会生成，每次创建都会失败 |

## 🛰️ 在代理之后

**可选——大规模使用时推荐（按 IP 限制、封禁）。** 该工具在没有代理时也能工作。

- **有代理池时：** 传入 `--pool <file>`（或设置 `SEEKAI_PROXIES`），每个请求——包括 Chrome 浏览器——都通过该列表中的一个出口，故障关闭：每个候选先经过审查（登录页渲染 + Turnstile 脚本 200），然后整个账户的运行都固定在该出口上。
- **无代理池时：** CLI 打印 `running WITHOUT a proxy (direct)` 并直接连接。注册、密钥生成或签到没有任何变化——只是数据包离开的位置不同。
- **出口质量决定此处的成败。** 2026-10-21，一个原始代理池大多给出 `no login form` / `no turnstile token`；26 个候选中只有 **8** 个能真正运行该通道。先筛选，再创建。
- 带用户名/密码的 SOCKS5 线路会被跳过：Chrome 无法向它们认证（带凭据的 HTTP 代理通过 Fetch 域处理）。

## 📄 文件

| 路径 | 内容 |
| --- | --- |
| `keys.txt` | 每行一个经实时验证的密钥——已被 git 忽略 |
| `accounts.json` | 用户名 / 密码 / 邮箱 / 密钥 / 签到状态，包括失败的尝试 |
| `proxies.txt` | 你的出口——已被 git 忽略 |
| `out/` | 运行日志、失败截图、`attempts.jsonl` 台账——已被 git 忽略 |

## 🔌 连接到 9Router

[9Router](https://9router.com) 是一个自托管的、兼容 OpenAI 的路由器：

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

默认值：`--prefix seekai`、`--base-url https://seekai.cc/v1`、`--model deepseek-ai/DeepSeek-V4-Flash-0731`。模型以 `seekai/<model id>` 形式提供。CLI 可以一次性完成同样的事：`node src/cli.js --connect-9router`。

## 🔌 连接到 OmniRoute

[OmniRoute](https://omniroute.online) 是一个自托管的、兼容 OpenAI 的路由器：

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

默认值：`--prefix seekai`、`--base-url https://seekai.cc/v1`、`--model deepseek-ai/DeepSeek-V4-Flash-0731`。模型以 `seekai/<model id>` 形式提供。CLI 可以一次性完成同样的事：`node src/cli.js --connect-omniroute`。

## 🔑 一个密钥能给你什么

| | |
| --- | --- |
| 🏢 提供商 | **SeekAI** — [seekai.cc](https://seekai.cc) |
| 🎁 提供商提供什么 | **每个账户每天 $20**，通过一次签到领取（`quota_awarded: 10000000`） |
| 🔑 一个密钥能给你什么 | `https://seekai.cc/v1` 上该账户的模型列表，从签到额度中计费 |
| 🌐 API 形态 | 兼容 OpenAI：`POST https://seekai.cc/v1/chat/completions`（答案可能出现在 `reasoning` 中） |
| 🔒 你的数据 | 仅联系 `seekai.cc` 和你的邮箱后端 |

## 🐞 问题反馈

如果 SeekAI 更改其注册表单、其 Turnstile 站点密钥（`0x4AAAAAAEcpuQE_WXc4ZfG8`）、签到奖励或模型目录，该工具会就此停止并说明原因。请**[提交 issue](../../issues)**，附上命令和确切输出。

## 📄 许可证

MIT © 2026 — 见 [LICENSE](LICENSE)。

<div align="center">

**[MIT](LICENSE)** © 2026 seekai-bulk-apikey contributors

</div>