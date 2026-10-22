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

**批量创建 [SeekAI](https://seekai.cc) 账户并自动生成 API 密钥 —— 每个账户每天 $20 签到额度 —— 兼容 OpenAI 的推理 + [9Router](https://9router.com) 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20verified-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)

[🛠 快速开始](#-quick-start) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🤖 模型与免费额度](#-models--free-tier) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [🔌 9Router](#-connect-to-9router) · [🐞 问题反馈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 为什么会有这个工具

SeekAI 在 `seekai.cc` 上运行着一个 New API 面板。它的欢迎额度只是个零头（配额 `1`）；真正的免费额度是**每日签到：10,000,000 配额 = 每个账户 $20，每个面板日一次**。注册就是一个普通的邮箱 + 密码表单 —— 没有 OAuth、没有手机号、没有银行卡 —— 但每一个受控步骤（验证码请求 + 注册、登录以及签到本身）都带有 **Cloudflare Turnstile**，而这个组件只在此面板的**有头 Chrome** 中生成。本工具通过 CDP 驱动真实的 Chrome（零依赖），在为一个账户花费成本之前先筛查出口，生成密钥，领取当日额度，并只保留那些能完成真实补全的密钥。

## 🤖 模型与免费额度

| 模型 ID | 备注 |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | 在每个密钥上都验证过的唯一 id（2026-10-21 为 18/18）；以推理路由方式作答 |

`GET /v1/models` 为这些账户返回了 **29 个 id**；带 `:free` 后缀的 id 会被拒绝并返回 `401 API key is disabled`，因此网关使用上面的 id，并回退到该账户可调用的任何模型。

**推理陷阱：** 这个中转把答案放在 `message.reasoning` 中，而让 `message.content` **为空**。只读取 `content` 的网关会把存活的密钥判为失效 —— 本工具接受 `content || reasoning_content || reasoning`，并报告是哪一个承载了文本。

| 免费额度提供的内容 | 值 |
| --- | --- |
| 每日签到 | **10,000,000 配额 = 每个账户 $20，每个面板日一次**（`quota_per_unit 500000`） |
| 同一天第二次调用 | `今日已签到`（幂等 —— 视为健康） |
| 面板日 | **UTC+8** —— 在 UTC 16:00 滚动 |
| 实测运行（2026-10-21） | **38 个账户中有 12 个签到成功 → +120,000,000 配额 = 一次运行 $240** |
| 速率限制 | 约**每 IP 每分钟 5 个请求**（`您已达到总请求数限制`）→ 调用间隔 ≥14 秒 |
| 银行卡 / 手机号 | 整个流程中均不需要 |

实测的速率限制行为：`200 200 200 200 200`，如果忽略间隔则返回 `429`；`already-checked-in` 返回 `200 {"success":false,"message":"今日已签到"}`。

## 🛠 快速开始

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

`keys.txt` 只有在 `GET /v1/models` **以及**一次真实补全之后才会写入；`accounts.json` 保存账户状态（用户名、密码、邮箱、密钥、签到额度）。

### 🖱️ 启动器

`node src/launcher.js` 会打印上面的字标，并提供一个编号菜单：**生成**（N 个账户，串行）、**验证**（`keys.txt`）、**筛查**（出口列表）、**设置**（代理文件、模型、数量 —— 保存在 `launcher.config.json` 中）、**连接到 9Router**、帮助和退出。每一项都是对相同 `src/cli.js` 标志的薄封装。

## ✅ 已验证可用 —— 每个密钥都经过测试

所有检查均于 **2026-10-21** 从本工具运行。

| 检查 | 结果 |
| --- | --- |
| `--screen`（HTTP 出口审查） | 登录页渲染 + `challenges.cloudflare.com/turnstile/v0/api.js` 返回 **200** + API 主机有响应 |
| 流程内的出口筛查 | 组件从不生成的线路会在花费邮箱**之前**被拒绝 |
| 注册 | `POST /api/user/register?turnstile=` → 邮件验证码后返回 **200** |
| 密钥生成 | `POST /api/token/` → 列表 → `POST /api/token/<id>/key` → **200**，48 字符密钥 |
| 每日签到 | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`**；一次运行 12 个账户 = **$240** |
| 每个密钥的对话 | 在 `deepseek-ai/DeepSeek-V4-Flash-0731` 上 **18 / 18 个密钥返回 200**（文本在 `reasoning` 中） |
| 未通过检查的密钥 | 从不写入 `keys.txt` |

随时重新检查：

```bash
node src/cli.js --verify-only            # every key in keys.txt through the live gate
curl https://seekai.cc/v1/chat/completions \
  -H "Authorization: Bearer <48-char-key>" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-ai/DeepSeek-V4-Flash-0731","messages":[{"role":"user","content":"Reply with one short sentence: what is 2+2?"}],"max_tokens":64}'
```

## 🧭 工作原理

| 步骤 | 调用 | 备注 |
| --- | --- | --- |
| 筛查 | 在 Chrome 中访问 `/sign-in` | 面板的组件必须**挂载并生成**；能加载页面但从不作答的线路无法注册 |
| 邮箱 | Emailnator gmail 邮箱 | 地址是循环使用的，因此只接受来自 `seekai` 的邮件 |
| 注册 | `GET /api/verification?email=&turnstile=` | **一个 token 同时覆盖验证码请求和注册调用** |
| 注册 | `POST /api/user/register?turnstile=` | 用户名、密码、邮箱、verification_code |
| 登录 | `POST /api/user/login?turnstile=` | 它自己的 token → `data.access_token` |
| 密钥 | `POST /api/token/` → 列表 → `/api/token/<id>/key` | 这些路由上没有验证码；列表只显示掩码 |
| 签到 | `POST /api/user/checkin?turnstile=` | 它自己的 token → `quota_awarded: 10000000` |
| 网关 | `GET /v1/models` + 一次补全 | **返回 200 且带有 `content` 或 `reasoning`** → 写入该密钥 |

这里的 Turnstile token 是**一次性且绑定文档的**；在其他上下文中生成的 token 会返回 `Turnstile 校验失败`。**无头 Chrome 在此面板上无法工作** —— 实测：`--headless=new` 和 `--headless=old` 会让组件空白 60 秒，而有头窗口（可见或屏幕外）在 2-4 秒内作答。`--headless` 仅作为诊断存在。

## ⚙️ CLI 选项

| 标志 | 默认值 | 含义 |
| --- | --- | --- |
| `--count N` | `1` | 要生成的账户数，串行 |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | 用于实时网关的模型 |
| `--pool <file>` | `proxies.txt` | 出口列表，每行一个代理 —— 可选 |
| `--tries N` | `3` | 每个账户筛查的出口候选数 |
| `--mint-tries N` | `2` | 每个出口的完整注册尝试次数（新邮箱 + Chrome） |
| `--gap MS` | `20000` | 账户之间的暂停 |
| `--panel-gap MS` | `14000` | 此面板 API 调用之间的暂停 |
| `--code-timeout S` | `240` | 等待邮件验证码的秒数 |
| `--keys <file>` | `keys.txt` | 用于 `--verify-only` / `--connect-9router` 的密钥文件 |
| `--headless` | 关闭 | 仅用于诊断 —— Turnstile 不会生成 |
| `--browser <exe>` | 自动 | Chrome 可执行文件（环境变量 `CHROME_PATH`） |
| `--debug-port N` | 自动 | Chrome DevTools 端口 |
| `--verify-only` · `--screen` · `--connect-9router` · `--help` | | 模式 |

## 🛰️ 在代理之后

- **有代理池时：** `--pool <file>`（或 `SEEKAI_PROXIES` 环境变量）。每个请求 —— 包括 Chrome 浏览器 —— 都通过一个出口，故障关闭：候选先经过审查（登录页渲染 + Turnstile 脚本返回 200），并且整个账户运行期间都固定在该出口上。
- **没有代理池时：** 工具直接连接并打印 `running WITHOUT a proxy (direct)`。其他一切不变。
- **出口质量在这里决定成败。** 2026-10-21，一个原始代理池大多产生 `no login form` / `no turnstile token`；26 个候选中只有 **8** 个能跑通流程。先筛查，再生成。
- 带用户名/密码的 SOCKS5 线路会被跳过（Chrome 无法向它们认证）；带凭据的 HTTP 代理通过 Fetch 域处理。

## 📄 文件

| 路径 | 内容 |
| --- | --- |
| `keys.txt` | 每行一个经实时验证的密钥 —— 已被 git 忽略 |
| `accounts.json` | 用户名 / 密码 / 邮箱 / 密钥 / 签到状态 —— 已被 git 忽略 |
| `proxies.txt` | 你的出口 —— 已被 git 忽略 |
| `out/` | 运行日志、失败截图、`attempts.jsonl` —— 已被 git 忽略 |

## 🔌 连接到 9Router

```bash
node src/cli.js --connect-9router                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-9router --9router-base http://localhost:20128 --9router-password 123456
```

默认值：`--prefix seekai`、`--base-url https://seekai.cc/v1`、`--model deepseek-ai/DeepSeek-V4-Flash-0731`。模型以 `seekai/<model id>` 形式提供。

## 🔌 连接到 OmniRoute

```bash
node src/cli.js --connect-omniroute                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-omniroute --omniroute-base http://localhost:20128 --omniroute-password 123456
```

默认值：`--prefix seekai`、`--base-url https://seekai.cc/v1`、`--model deepseek-ai/DeepSeek-V4-Flash-0731`。模型以 `seekai/<model id>` 形式提供。
## 🐞 问题反馈

如果 SeekAI 更改了它的注册表单、Turnstile 站点密钥（`0x4AAAAAAEcpuQE_WXc4ZfG8`）、签到奖励或模型目录，工具会停在那里并说明原因。请带上命令和确切输出**[提交 issue](../../issues)**。

## 📄 许可证

[MIT](LICENSE) © seekai-bulk-apikey contributors

---

## ⚠️ 账号风险与降低方法
