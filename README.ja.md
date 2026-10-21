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

**自動生成された API キーで [SeekAI](https://seekai.cc) アカウントを一括作成 — 1 アカウントあたり 1 日 $20 のチェックインクレジット — OpenAI 互換の推論 + [9Router](https://9router.com) コネクタ。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20verified-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)

[🛠 クイックスタート](#-quick-start) · [✅ 検証済み](#-verified-working--every-key-is-tested) · [🧭 仕組み](#-how-it-works) · [🤖 モデルと無料枠](#-models--free-tier) · [⚙️ オプション](#️-cli-options) · [🛰️ プロキシ](#️-behind-a-proxy) · [🔌 9Router](#-connect-to-9router) · [🐞 問題](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ これが存在する理由

SeekAI は `seekai.cc` 上で New API パネルを運営しています。そのウェルカムクレジットは誤差のようなもの（クォータ `1`）ですが、本当の無料枠は**毎日の签到（チェックイン）: 10,000,000 クォータ = 1 アカウントあたり $20、パネルの 1 日につき 1 回**です。登録はごく普通のメールアドレス + パスワードのフォームで、OAuth も電話番号もカードも不要ですが、ゲートされたすべてのステップ（コード要求 + 登録、サインイン、そしてチェックイン自体）には **Cloudflare Turnstile** が付いており、このウィジェットはこのパネルでは**ヘッド付き Chrome** でしか生成されません。このツールは CDP 経由で実際の Chrome を操作し（依存関係ゼロ）、アカウントを消費する前に出口をスクリーニングし、キーを生成し、その日のクレジットを獲得し、実際の補完に応答したキーだけを保持します。

## 🤖 モデルと無料枠

| モデル ID | 備考 |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | すべてのキーで検証された唯一の ID（2026-10-21 時点で 18/18）。推論ルートとして応答する |

`GET /v1/models` はこれらのアカウントに対して **29 個の ID** を返しました。`:free` サフィックスを持つ ID は `401 API key is disabled` で拒否されるため、ゲートは上記の ID を使用し、アカウントが呼び出せるものにフォールバックします。

**推論の罠:** このリレーは回答を `message.reasoning` に入れ、`message.content` を**空**のままにします。`content` だけを読むゲートは生きたキーを死んだものと判定します — このツールは `content || reasoning_content || reasoning` を受け入れ、どれがテキストを運んだかを報告します。

| 無料枠で得られるもの | 値 |
| --- | --- |
| 毎日のチェックイン | **10,000,000 クォータ = 1 アカウントあたり $20、パネルの 1 日につき 1 回**（`quota_per_unit 500000`） |
| 同日の 2 回目の呼び出し | `今日已签到`（冪等 — 正常とみなされる） |
| パネルの日 | **UTC+8** — 16:00 UTC に切り替わる |
| 実測実行（2026-10-21） | **38 アカウント中 12 がチェックイン → +120,000,000 クォータ = 1 回の実行で $240** |
| レート制限 | おおよそ **IP あたり毎分 5 リクエスト**（`您已达到总请求数限制`）→ 呼び出しは 14 秒以上空ける |
| カード / 電話 | フローのどこにも不要 |

レート制限の挙動、実測: 間隔を無視すると `200 200 200 200 200` の後に `429`。`already-checked-in` は `200 {"success":false,"message":"今日已签到"}` を返す。

## 🛠 クイックスタート

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

`keys.txt` は `GET /v1/models` **および**実際の補完の後にのみ書き込まれます。`accounts.json` はアカウントの状態（ユーザー名、パスワード、メール、キー、チェックインクレジット）を保持します。

### 🖱️ ランチャー

`node src/launcher.js` は上記のワードマークを表示し、番号付きメニューを提供します: **mint**（N アカウント、直列）、**verify**（`keys.txt`）、**screen**（出口リスト）、**settings**（プロキシファイル、モデル、カウント — `launcher.config.json` に保存）、**connect to 9Router**、ヘルプ、終了。各項目は同じ `src/cli.js` フラグの薄いラッパーです。

## ✅ 検証済みで動作 — すべてのキーがテストされる

すべてのチェックは **2026-10-21** にこのツールから実行されました。

| チェック | 結果 |
| --- | --- |
| `--screen`（HTTP 出口審査） | サインインページがレンダリング + `challenges.cloudflare.com/turnstile/v0/api.js` が **200** を返す + API ホストが応答 |
| フロー内の出口スクリーニング | ウィジェットが生成されない回線は、メールボックスを消費する**前に**拒否される |
| 登録 | `POST /api/user/register?turnstile=` → メールで送られたコードの後に **200** |
| キー生成 | `POST /api/token/` → リスト → `POST /api/token/<id>/key` → **200**、48 文字のキー |
| 毎日のチェックイン | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`**；1 回の実行で 12 アカウント = **$240** |
| キーごとのチャット | `deepseek-ai/DeepSeek-V4-Flash-0731` で **18 / 18 キーが 200**（テキストは `reasoning` 内） |
| チェックに失敗したキー | `keys.txt` に書き込まれない |

いつでも再チェック:

```bash
node src/cli.js --verify-only            # every key in keys.txt through the live gate
curl https://seekai.cc/v1/chat/completions \
  -H "Authorization: Bearer <48-char-key>" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-ai/DeepSeek-V4-Flash-0731","messages":[{"role":"user","content":"Reply with one short sentence: what is 2+2?"}],"max_tokens":64}'
```

## 🧭 仕組み

| ステップ | 呼び出し | 備考 |
| --- | --- | --- |
| スクリーニング | Chrome での `/sign-in` | パネルのウィジェットがマウント**し、生成される**必要がある。ページは読み込むが決して応答しない回線は登録できない |
| メールボックス | Emailnator の gmail ボックス | アドレスはリサイクルされるため、`seekai` からのメールのみ受け入れる |
| 登録 | `GET /api/verification?email=&turnstile=` | **1 つのトークンがコード要求と登録呼び出しの両方をカバーする** |
| 登録 | `POST /api/user/register?turnstile=` | ユーザー名、パスワード、メール、verification_code |
| ログイン | `POST /api/user/login?turnstile=` | 独自のトークン → `data.access_token` |
| キー | `POST /api/token/` → リスト → `/api/token/<id>/key` | これらのルートにキャプチャはない。リストはマスクのみ表示 |
| チェックイン | `POST /api/user/checkin?turnstile=` | 独自のトークン → `quota_awarded: 10000000` |
| ゲート | `GET /v1/models` + 1 回の補完 | **`content` または `reasoning` を伴う 200** → キーが書き込まれる |

ここでの Turnstile トークンは**単回使用かつドキュメントに紐づく**ため、別のコンテキストで生成されたトークンは `Turnstile 校验失败` を返します。**ヘッドレス Chrome はこのパネルでは動作しません** — 実測: `--headless=new` と `--headless=old` はウィジェットを 60 秒間空のままにしますが、ヘッド付きウィンドウ（可視または画面外）は 2〜4 秒で応答します。`--headless` は診断用としてのみ存在します。

## ⚙️ CLI オプション

| フラグ | デフォルト | 意味 |
| --- | --- | --- |
| `--count N` | `1` | 生成するアカウント数、直列 |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | ライブゲートに使用するモデル |
| `--pool <file>` | `proxies.txt` | 出口リスト、1 行につき 1 プロキシ — オプション |
| `--tries N` | `3` | アカウントごとにスクリーニングする出口候補 |
| `--mint-tries N` | `2` | 出口ごとの完全な登録試行（新しいメールボックス + Chrome） |
| `--gap MS` | `20000` | アカウント間の一時停止 |
| `--panel-gap MS` | `14000` | このパネルの API 呼び出し間の一時停止 |
| `--code-timeout S` | `240` | メールコードを待つ秒数 |
| `--keys <file>` | `keys.txt` | `--verify-only` / `--connect-9router` 用のキーファイル |
| `--headless` | off | 診断専用 — Turnstile は生成されない |
| `--browser <exe>` | auto | Chrome バイナリ（環境変数 `CHROME_PATH`） |
| `--debug-port N` | auto | Chrome DevTools ポート |
| `--verify-only` · `--screen` · `--connect-9router` · `--help` | | モード |

## 🛰️ プロキシの背後で

- **プールあり:** `--pool <file>`（または `SEEKAI_PROXIES` 環境変数）。すべてのリクエスト — Chrome ブラウザを含む — が 1 つの出口を経由し、フェイルクローズド: 候補はまず審査され（サインインのレンダリング + Turnstile スクリプト 200）、実行はアカウント全体を通してその出口に固定されます。
- **プールなし:** ツールは直接接続し、`running WITHOUT a proxy (direct)` と表示します。それ以外は何も変わりません。
- **ここでは出口の品質が成功を決めます。** 2026-10-21 に、生のプールはほとんどが `no login form` / `no turnstile token` を返しました。26 の候補のうち、レールを実行できたのは **8** のみでした。まずスクリーニングし、それから生成してください。
- ユーザー名/パスワード付きの SOCKS5 行はスキップされます（Chrome はそれらに認証できません）。認証情報付きの HTTP プロキシは Fetch ドメインを通じて処理されます。

## 📄 ファイル

| パス | 内容 |
| --- | --- |
| `keys.txt` | 1 行につき 1 つのライブ検証済みキー — git で無視される |
| `accounts.json` | ユーザー名 / パスワード / メール / キー / チェックイン状態 — git で無視される |
| `proxies.txt` | あなたの出口 — git で無視される |
| `out/` | 実行ログ、失敗のスクリーンショット、`attempts.jsonl` — git で無視される |

## 🔌 9Router に接続

```bash
node src/cli.js --connect-9router                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-9router --9router-base http://localhost:20128 --9router-password 123456
```

デフォルト: `--prefix seekai`、`--base-url https://seekai.cc/v1`、`--model deepseek-ai/DeepSeek-V4-Flash-0731`。モデルは `seekai/<model id>` として提供されます。

## 🐞 問題

SeekAI が登録フォーム、Turnstile サイトキー（`0x4AAAAAAEcpuQE_WXc4ZfG8`）、チェックイン報酬、またはモデルカタログを変更した場合、ツールはそこで停止し、その旨を報告します。コマンドと正確な出力を添えて **[issue を開いてください](../../issues)**。

## 📄 ライセンス

[MIT](LICENSE) © seekai-bulk-apikey contributors

---

## ⚠️ アカウントリスクと最小化
