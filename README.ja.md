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

**SeekAI (seekai.cc) のアカウントを自動生成された API キーとともに一括作成し、毎日の $20 チェックインクレジットを獲得 — OpenAI 互換の推論 + 9Router コネクタ。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20served-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 クイックスタート](#-quick-start) · [🎁 無料枠](#-free-tier--how-much-you-get) · [🤖 モデル](#-models--all-1-of-them) · [🧪 API の使い方](#-how-to-use-the-api) · [✅ 検証済み](#-verified-working--every-key-is-tested) · [🧭 仕組み](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ オプション](#️-cli-options) · [🛰️ プロキシ](#️-behind-a-proxy) · [🐞 問題報告](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ これが存在する理由

SeekAI は `seekai.cc` 上で New API パネル（`v1.0.0-rc.25`）を運用しており、その**無料枠は毎日の签到（チェックイン）です：10,000,000 クォータ = アカウントあたり $20、パネルの 1 日につき 1 回獲得できます**。登録は通常のメールアドレス + パスワードのフォームで（OAuth は不要）、ウェルカムクレジットはトークンのみ（クォータ 1）です — つまりチェックインこそがお金です。ゲートされたすべてのステップ — コード要求 + 登録、サインイン、そしてチェックイン自体 — には **Cloudflare Turnstile** トークンが必要で、そのウィジェットはこのパネルでは**ヘッド付き Chrome** でしか発行されません。だからこそこのツールは CDP 経由で実際のブラウザを操作し、アカウントを消費する前に出口をスクリーニングします。

## 🎁 無料枠 — どれだけ得られるか

| 項目 | 値 |
| --- | --- |
| 毎日のクレジット | **アカウントあたり、パネルの 1 日につき 1 回のチェックイン = 10,000,000 クォータ = $20**（`quota_per_unit 500000`） |
| ウェルカムクレジット | クォータ `1`（≈ $0.000002）— 無料枠はチェックインであり、サインアップではない |
| 実測実行 | **2026-10-21 に 38 アカウント中 12 アカウントがチェックイン → 1 回の実行で +120,000,000 クォータ = $240**（`providers/seekai.cc/out/checkin-2026-10-21.json`） |
| 同日 2 回目の呼び出し | `今日已签到`（冪等、正常としてカウント） |
| パネルの日付 | **UTC+8** — 16:00 UTC に切り替わります |
| レート制限 | パネルは IP 全体を約 **5 リクエスト/分**に制限します（`您已达到总请求数限制`）→ 呼び出し間隔は 14 秒以上 |
| カード / 電話 | **不要** — 支払いステップはどこにもなく、電話番号も要求されません |
| 複数アカウント条項 | 公開されていません：`/api/user/agreement` は管理者専用です（403 `AUTH_INSUFFICIENT_PRIVILEGE`） |

> 💡 無料枠は SeekAI が設定するもので、変更される可能性があります。最新の数値は [seekai.cc](https://seekai.cc) で確認してください — そしてツール自身のゲートに判断させてください：

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 モデル — そのすべて（1 個）

パネルは、このツールが作成するアカウントで検証済みのチャット ID を 1 つ宣伝しています：

| モデル ID | 備考 |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | 2026-10-21 にすべてのキーをチャット検証済み；推論ルートとして応答します |

`GET /v1/models` はこのアカウントが呼び出せる ID を返します；`:free` サフィックスを持つ ID は **401 `API key is disabled`** で拒否されるため、ツールは上記の ID でゲートします（そして拒否されない `/v1/models` が提供するものにフォールバックします）。

応答の形は重要です：このリレーはテキストを **`message.reasoning`** に入れ、`message.content` を**空**のままにします（短い `max_tokens` では `finish_reason` は `length` です）。`content` だけを見るゲートは生きたキーを使えないと判断してしまうため、ツールは `content || reasoning_content || reasoning` を受け入れ、どれが答えを運んだかを報告します。

## 🧪 API の使い方

ベース URL **`https://seekai.cc/v1`** — OpenAI 互換のチャット補完。キーは **`sk-` プレフィックスのない 48 文字**です（パネルの一覧ではマスクされます；ツールは `POST /api/token/<id>/key` で値を明らかにします）。

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

自身の `remain_quota` が 0 で無制限でもないトークンは、まったく認証されません — キーは `unlimited_quota: true` で作成してください（ツールはそうしています）。

## 🛠 クイックスタート

```bash
cd seekai-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + daily $20 check-in in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

サインアップ（およびチェックイン）には実際の**ヘッド付き** Chrome が必要です：このパネルでの実測では、`--headless=new` と `--headless=old` は Turnstile ウィジェットを 60 秒間空のままにしますが、ヘッド付きウィンドウ — 表示中でも画面外でも — は 2〜4 秒で応答します。`keys.txt` は `GET /v1/models` **および**実際の補完の後にのみ書き込まれます；`accounts.json` はアカウントの状態（ユーザー名、パスワード、メールアドレス、キー、チェックインクレジット）を保持します。

### 🖱️ ランチャー

`node src/launcher.js` はタスクモジュールの上に載るメニューです：**mint**（新しいアカウント、その検証済みメールアドレス、キー、毎日の $20 チェックイン）、**verify**（`keys.txt` に対してチャットゲートを再実行）、**screen**（出口リストに対する HTTP パス）。設定 — プロキシリスト、アカウント数、モデル — は `launcher.config.json` に永続化されます。以下のすべてのフラグは CLI から直接到達できます。

## 🚀 ワンコマンド

キャプチャは自動で解決されます — 1 つのコマンドで N 個のアカウント（毎日の $20 チェックインクレジット付き）を作成し、実際のチャット呼び出しで検証されたキーだけを保持します：

```bash
node src/cli.js --count N        # N accounts, serial — the Turnstile widget is answered in a real Chrome
```

`--auto` がデフォルトで、何も渡す必要はありません：組み込みの `src/solver.js` がヘッド付き Chrome を開き、パネルの Turnstile ウィジェットをマウントし、トークンを自動的に返します。`--dry` は解決されたプラン（カウント、出口プール、ソルバー、モデル）を出力し、**ファイルを書き込まず、ネットワーク呼び出しも行わずに**終了します。`node src/launcher.js`（または `npm start`）は同じ経路をメニューとして提供します。

> ⚠️ **利用規約とアカウントのリスク。** これは自動化ツールであり、アカウント販売業者ではありません。一括サインアップとキー作成は完全にあなたの責任です：プロバイダーの利用規約に違反する可能性があり、アドレス、出口、アカウントがブロックされることがあります。自動化が許可されているインフラでのみ使用し、リクエストレートを低く保ってください。

## ✅ 検証済み — すべてのキーがテストされています

以下のすべてのチェックは **2026-10-21** に出荷された CLI から再実行されました（出口プール、WARP なし）。

| チェック | 結果 |
| --- | --- |
| `--screen`（HTTP 出口審査） | サインインページがレンダリングされること + `challenges.cloudflare.com/turnstile/v0/api.js` が 200 を返すこと + API ホストが応答すること |
| Chrome での出口スクリーン（フロー内） | ウィジェットが発行されない行は、メールボックスを消費する**前に**拒否されます（これが 2026-10-14 のブロッカーで、現在はハードゲートです） |
| サインアップ | `POST /api/user/register?turnstile=` → メールコード後に **200**（`success: true`） |
| キー作成 | `POST /api/token/` → 一覧 → `POST /api/token/<id>/key` → **200**、48 文字のキー |
| 毎日のチェックイン | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`**（$20）；1 回の実行で 12 アカウント = **$240** |
| キーごとのチャット | `deepseek-ai/DeepSeek-V4-Flash-0731` で**すべてのキーが 200**（答えは `reasoning` に格納）— この CLI から再実行、出口ローテーション付き |
| `401 API key is disabled` | **出口依存であり、キーの判定ではありません**：3 つのキーが 1 つの出口からこれを返し、同じ分に別の出口から 200 を返したため、ゲートはその応答を次の出口で再試行します |
| チェックに失敗したキー | `keys.txt` に書き込まれることはありません（ゲートは出口クラスの失敗を 1 回再試行します） |

> **品質ゲート。** ここにあるすべてのキーは、`keys.txt` に書き込まれる前にライブの `chat-200` を通過しています
> （死んだキーは決して出荷されません）。ルーターのコンボもモデルレベルで同じルールに従います：エントリは
> **モデルが `chat-200` を返し、ツールを呼び出せる場合にのみ**追加されます — ツールサポートのないモデル、
> 死んだキー、死んだプロバイダーは追加されずに削除されます。検証ステップはいつでも再実行できます；
> 失敗は報告され、決して隠されません。

## 🧭 仕組み

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: SeekAI page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://seekai.cc/v1/chat/completions → real content = the key is live
```

| ステップ | 呼び出し | 備考 |
| --- | --- | --- |
| スクリーン | Chrome での `/sign-in` | パネル自身のウィジェットがマウント**し、発行する**必要があります；ページは読み込むが決して応答しない行は登録できません |
| メールボックス | Emailnator gmail ボックス | レールはアドレスをリサイクルするため、`seekai` からのメールのみ受け入れられます |
| サインアップ | `/sign-up` → `GET /api/verification?email=&turnstile=` | 1 つのトークンがコード要求**と**登録呼び出しの両方をカバーします |
| 登録 | `POST /api/user/register?turnstile=` | ボディ：ユーザー名、パスワード、メールアドレス、verification_code |
| ログイン | `POST /api/user/login?turnstile=` | 独自のトークン → `data.access_token` |
| キー | `POST /api/token/` → 一覧 → `/api/token/<id>/key` | これらのルートにはキャプチャがありません；一覧はマスクのみを表示します |
| チェックイン | `POST /api/user/checkin?turnstile=` | 独自のトークン → `quota_awarded: 10000000` |
| ゲート | `GET /v1/models` + 1 回の補完 | `content` **または** `reasoning` を伴う 200 → キーが書き込まれます |

パネルはまた、キーとは無関係な理由で **`401 API key is disabled`** を返します（2026-10-21 に実測：同じキーが、1 つの出口で 401、別の出口で 1 分以内に 200）— 検証実行はそれを信じる前に出口をローテーションすべきです。

ここでの Turnstile トークンは**単一使用かつドキュメントに紐づきます**：別のコンテキストで生成されたトークンは `Turnstile 校验失败` を返します。Playwright スタイルの自動化は不要です — プレーンな CDP の `Runtime.evaluate` + `Input.dispatchMouseEvent` クリックで十分で、これがこのゼロ依存クライアントのやっていることです。

## ⚙️ CLI オプション

```bash
node src/cli.js --count 5                  # five sign-ups, serial (one headed Chrome at a time)
node src/cli.js --model deepseek-ai/DeepSeek-V4-Flash-0731
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| フラグ | デフォルト | 意味 |
| --- | --- | --- |
| `--count N` | `1` | 作成するアカウント数、直列 |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | ライブゲートに使用するモデル |
| `--pool <file>` | `proxies.txt` | 出口リスト、1 行につき 1 プロキシ — オプション |
| `--exits N` | `6` | アカウントごとにスクリーニングする出口候補 |
| `--mint-tries N` | `2` | 出口ごとの完全なサインアップ試行（新しいメールボックス + Chrome） |
| `--gap MS` | `20000` | アカウント間の一時停止 |
| `--panel-gap MS` | `14000` | このパネルの API 呼び出し間の一時停止（5 リクエスト/分） |
| `--code-timeout S` | `240` | メールコードを待つ秒数 |
| `--keys <file>` | `keys.txt` | `--verify-only` / `--connect-9router` 用のキーファイル |
| `--headless` | オフ | **診断専用** — Turnstile は発行されず、すべての作成が失敗します |

## 🛰️ プロキシの背後で

**オプション — 規模を拡大する場合は推奨（IP ごとの制限、BAN）。** ツールはプロキシなしでも動作します。

- **プールあり：** `--pool <file>` を渡す（または `SEEKAI_PROXIES` を設定する）と、すべてのリクエスト — Chrome ブラウザを含む — がそのリストの出口を経由し、フェイルクローズドになります：各候補は最初に審査され（サインインページがレンダリング + Turnstile スクリプトが 200）、その後実行はアカウント全体を通じてその出口に固定されます。
- **プールなし：** CLI は `running WITHOUT a proxy (direct)` と出力し、直接接続します。サインアップ、キー作成、チェックインについて何も変わりません — パケットが出ていく場所だけが変わります。
- **ここでは出口の品質が成功を決めます。** 2026-10-21 に、生のプールはほとんどが `no login form` / `no turnstile token` を返しました；26 の候補のうち、実際にレールを実行できたのは **8** だけでした。まずスクリーニングし、それから作成してください。
- ユーザー名/パスワード付きの SOCKS5 行はスキップされます：Chrome はそれらに認証できません（認証情報付きの HTTP プロキシは Fetch ドメインを通じて処理されます）。

## 📄 ファイル

| パス | 内容 |
| --- | --- |
| `keys.txt` | 1 行につき 1 つのライブ検証済みキー — git で無視されます |
| `accounts.json` | ユーザー名 / パスワード / メールアドレス / キー / チェックイン状態、失敗した試行を含む |
| `proxies.txt` | あなたの出口 — git で無視されます |
| `out/` | 実行ログ、失敗のスクリーンショット、`attempts.jsonl` 台帳 — git で無視されます |

## 🔌 9Router に接続する

[9Router](https://9router.com) はセルフホスト型の OpenAI 互換ルーターです：

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

デフォルト：`--prefix seekai`、`--base-url https://seekai.cc/v1`、`--model deepseek-ai/DeepSeek-V4-Flash-0731`。モデルは `seekai/<model id>` として提供されます。CLI でもワンショットで同じことができます：`node src/cli.js --connect-9router`。

## 🔌 OmniRoute に接続する

[OmniRoute](https://omniroute.online) はセルフホスト型の OpenAI 互換ルーターです：

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

デフォルト：`--prefix seekai`、`--base-url https://seekai.cc/v1`、`--model deepseek-ai/DeepSeek-V4-Flash-0731`。モデルは `seekai/<model id>` として提供されます。CLI でもワンショットで同じことができます：`node src/cli.js --connect-omniroute`。

## 🔑 1 つのキーで得られるもの

| | |
| --- | --- |
| 🏢 プロバイダー | **SeekAI** — [seekai.cc](https://seekai.cc) |
| 🎁 プロバイダーが提供するもの | **1 アカウントあたり 1 日 $20**、1 回のチェックインで獲得（`quota_awarded: 10000000`） |
| 🔑 1 つのキーで得られるもの | `https://seekai.cc/v1` 上のアカウントのモデルリスト、チェックインクレジットに対して課金 |
| 🌐 API の形 | OpenAI 互換：`POST https://seekai.cc/v1/chat/completions`（答えは `reasoning` で届くことがあります） |
| 🔒 あなたのデータ | `seekai.cc` とあなたの受信トレイバックエンドのみが接触されます |

## 🐞 問題報告

SeekAI がサインアップフォーム、Turnstile サイトキー（`0x4AAAAAAEcpuQE_WXc4ZfG8`）、チェックイン報酬、またはモデルカタログを変更した場合、ツールはそこで停止し、そう報告します。コマンドと正確な出力を添えて **[issue を開いてください](../../issues)**。

## 📄 ライセンス

MIT © 2026 — [LICENSE](LICENSE) を参照してください。

<div align="center">

**[MIT](LICENSE)** © 2026 seekai-bulk-apikey contributors

</div>