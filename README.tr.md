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

**Otomatik oluşturulan API anahtarlarıyla toplu SeekAI (seekai.cc) hesabı açın ve günlük $20 check-in kredisini talep edin — OpenAI uyumlu çıkarım + 9Router bağlayıcısı.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20served-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Hızlı başlangıç](#-quick-start) · [🎁 Ücretsiz katman](#-free-tier--how-much-you-get) · [🤖 Modeller](#-models--all-1-of-them) · [🧪 API'yi kullanın](#-how-to-use-the-api) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy'ler](#️-behind-a-proxy) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Bu neden var

SeekAI, `seekai.cc` üzerinde bir New API paneli (`v1.0.0-rc.25`) çalıştırıyor ve bunun **ücretsiz katmanı günlük bir 签到 (check-in): 10.000.000 kota = hesap başına $20, panel günü başına bir kez talep edilir**. Kayıt sıradan bir e-posta + parola formudur (OAuth gerekmez) ve hoş geldin kredisi yalnızca token'dır (kota 1) — asıl para check-in'dir. Korumalı her adım — kod isteği + kayıt, oturum açma ve check-in'in kendisi — bir **Cloudflare Turnstile** token'ı taşır ve bu widget yalnızca bu panelde **başsız olmayan (headed) Chrome** içinde üretilir; bu yüzden araç gerçek bir tarayıcıyı CDP üzerinden sürer ve bir hesabı harcamadan önce çıkışı tarar.

## 🎁 Ücretsiz katman — ne kadar alırsınız

| Ne | Değer |
| --- | --- |
| Günlük kredi | **hesap başına panel günü başına bir check-in = 10.000.000 kota = $20** (`quota_per_unit 500000`) |
| Hoş geldin kredisi | kota `1` (≈ $0.000002) — ücretsiz katman kayıt değil, check-in'dir |
| Ölçülen çalıştırma | **2026-10-21'de 38 hesaptan 12'si check-in yaptı → tek geçişte +120.000.000 kota = $240** (`providers/seekai.cc/out/checkin-2026-10-21.json`) |
| Aynı gün ikinci çağrı | `今日已签到` (idempotent, sağlıklı sayılır) |
| Panel günü | **UTC+8** — 16:00 UTC'de döner |
| Hız sınırı | panel tüm IP'yi ~**5 istek/dk** ile sınırlar (`您已达到总请求数限制`) → çağrıları ≥14 sn aralıkla yapın |
| Kart / telefon | **yok** — hiçbir yerde ödeme adımı yok ve telefon numarası istenmez |
| Çoklu hesap maddesi | yayımlanmamış: `/api/user/agreement` yalnızca yöneticiye açık (403 `AUTH_INSUFFICIENT_PRIVILEGE`) |

> 💡 Ücretsiz katman SeekAI tarafından belirlenir ve değişebilir. Güncel sayıları [seekai.cc](https://seekai.cc) adresinden kontrol edin — ve kararı aracın kendi kapısına bırakın:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modeller — hepsi 1 tane

Panel, bu aracın oluşturduğu hesaplarda doğrulanmış bir sohbet kimliği duyurur:

| Model Kimliği | not |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | 2026-10-21'de her anahtar sohbetle doğrulandı; bir akıl yürütme rotası olarak yanıtlar |

`GET /v1/models`, bu hesabın çağırabileceği kimlikleri döndürür; `:free` soneki taşıyan kimlikler **401 `API key is disabled`** ile reddedilir, bu yüzden araç yukarıdaki kimliği kapı olarak kullanır (ve reddedilmeyen, `/v1/models`'in sunduğu herhangi bir şeye geri döner).

Yanıt şekli önemlidir: bu aktarıcı metni **`message.reasoning`** içine koyar ve `message.content` alanını **boş** bırakır (kısa `max_tokens` için `finish_reason` değeri `length`'tir). Yalnızca `content` alanına bakan bir kapı, canlı anahtarları kullanılamaz sayar; bu yüzden araç `content || reasoning_content || reasoning` kabul eder ve yanıtı hangisinin taşıdığını bildirir.

## 🧪 API'yi nasıl kullanırım

Temel URL **`https://seekai.cc/v1`** — OpenAI uyumlu sohbet tamamlamaları. Anahtarlar **`sk-` öneki olmadan 48 karakterdir** (panel listesi bunları maskeler; araç değeri `POST /api/token/<id>/key` ile açığa çıkarır).

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

Kendi `remain_quota` değeri 0 olan ve sınırsız olmayan bir token hiç kimlik doğrulamaz — anahtarı `unlimited_quota: true` ile oluşturun (araç bunu yapar).

## 🛠 Hızlı başlangıç

```bash
cd seekai-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + daily $20 check-in in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

Kayıt (ve check-in) gerçek, **başsız olmayan (headed)** bir Chrome gerektirir: bu panelde ölçüldüğü üzere, `--headless=new` ve `--headless=old` Turnstile widget'ını 60 sn boyunca boş bırakırken, başsız olmayan bir pencere — görünür veya ekran dışı — 2-4 sn içinde yanıt verir. `keys.txt` yalnızca `GET /v1/models` **ve** gerçek bir tamamlama sonrasında yazılır; `accounts.json` hesap durumunu (kullanıcı adı, parola, e-posta, anahtar, check-in kredisi) saklar.

### 🖱️ Başlatıcı

`node src/launcher.js`, görev modülleri üzerinde bir menüdür: **mint** (yeni bir hesap, doğrulanmış e-postası, anahtar ve günlük $20 check-in), **verify** (`keys.txt` üzerinde sohbet kapısını yeniden çalıştır) ve **screen** (çıkış listesi üzerinde HTTP geçişi). Ayarlar — proxy listesi, hesap sayısı, model — `launcher.config.json` içinde kalıcıdır. Aşağıdaki her bayrak doğrudan CLI'dan erişilebilir.

## ✅ Çalıştığı doğrulandı — her anahtar test edilir

Aşağıdaki tüm kontroller **2026-10-21**'de gönderilen CLI'dan yeniden çalıştırıldı (çıkış havuzu, WARP yok).

| Kontrol | Sonuç |
| --- | --- |
| `--screen` (HTTP çıkış denetimi) | oturum açma sayfası görüntülenmeli + `challenges.cloudflare.com/turnstile/v0/api.js` 200 yanıtlamalı + API ana makinesi yanıtlamalı |
| Chrome'da çıkış taraması (akış içinde) | widget'ı hiç üretmeyen bir satır, bir posta kutusu harcanmadan **önce** reddedilir (bu, 2026-10-14 engelleyicisidir ve artık katı bir kapıdır) |
| kayıt | posta kodu sonrası `POST /api/user/register?turnstile=` → **200** (`success: true`) |
| anahtar üretimi | `POST /api/token/` → listele → `POST /api/token/<id>/key` → **200**, 48 karakterli anahtar |
| günlük check-in | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`** ($20); tek çalıştırmada 12 hesap = **$240** |
| anahtar başına sohbet | `deepseek-ai/DeepSeek-V4-Flash-0731` üzerinde **her anahtar 200** (yanıt `reasoning` içinde taşınır) — bu CLI'dan yeniden çalıştırıldı, çıkış rotasyonuyla |
| `401 API key is disabled` | **çıkışa bağlı, anahtar kararı değil**: üç anahtar bir çıkıştan bu yanıtı verdi ve aynı dakika içinde başka bir çıkıştan 200 aldı, bu yüzden kapı bu yanıtı bir sonraki çıkışta yeniden dener |
| kontrolünde başarısız olan bir anahtar | `keys.txt` dosyasına asla yazılmaz (kapı, çıkış sınıfı hatalarını bir kez yeniden dener) |

> **Kalite kapıları.** Buradaki her anahtar, `keys.txt` dosyasına yazılmadan önce canlı bir `chat-200` geçti
> (ölü anahtarlar asla gönderilmez). Yönlendirici kombinasyonları model düzeyinde aynı kuralı izler: bir giriş
> **yalnızca model `chat-200` yanıtlıyorsa ve araçları çağırabiliyorsa** eklenir — araç desteği olmayan bir model,
> ölü bir anahtar veya ölü bir sağlayıcı eklenmek yerine çıkarılır. Doğrulama adımını istediğiniz zaman yeniden çalıştırın;
> hatalar bildirilir, asla gizlenmez.

## 🧭 Nasıl çalışır

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: SeekAI page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://seekai.cc/v1/chat/completions → real content = the key is live
```

| Adım | Çağrı | Notlar |
| --- | --- | --- |
| tarama | Chrome'da `/sign-in` | panelin kendi widget'ı **bağlanmalı ve üretmeli**; sayfayı yükleyen ama hiç yanıt vermeyen bir satır kayıt olamaz |
| posta kutusu | Emailnator gmail kutusu | ray adresleri geri dönüştürür, bu yüzden yalnızca `seekai`'den gelen posta kabul edilir |
| kayıt | `/sign-up` → `GET /api/verification?email=&turnstile=` | tek bir token hem kod isteğini **hem de** kayıt çağrısını kapsar |
| kayıt | `POST /api/user/register?turnstile=` | gövde: kullanıcı adı, parola, e-posta, verification_code |
| oturum açma | `POST /api/user/login?turnstile=` | kendi token'ı → `data.access_token` |
| anahtar | `POST /api/token/` → listele → `/api/token/<id>/key` | bu rotalarda captcha yok; liste yalnızca bir maske gösterir |
| check-in | `POST /api/user/checkin?turnstile=` | kendi token'ı → `quota_awarded: 10000000` |
| kapı | `GET /v1/models` + bir tamamlama | `content` **veya** `reasoning` ile 200 → anahtar yazılır |

Panel ayrıca anahtarla hiçbir ilgisi olmayan nedenlerle **`401 API key is disabled`** yanıtı verir (2026-10-21'de ölçüldü: aynı anahtar, bir çıkış 401, bir dakika içinde başka bir çıkış 200) — bir doğrulama çalıştırması buna inanmadan önce çıkışları döndürmelidir.

Buradaki Turnstile token'ları **tek kullanımlık ve belgeye bağlıdır**: başka bir bağlamda üretilen bir token `Turnstile 校验失败` yanıtı verir. Playwright tarzı otomasyon gerekmez — düz bir CDP `Runtime.evaluate` + `Input.dispatchMouseEvent` tıklaması yeterlidir, bu sıfır bağımlılıklı istemcinin yaptığı da budur.

## ⚙️ CLI seçenekleri

```bash
node src/cli.js --count 5                  # five sign-ups, serial (one headed Chrome at a time)
node src/cli.js --model deepseek-ai/DeepSeek-V4-Flash-0731
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Bayrak | Varsayılan | Anlam |
| --- | --- | --- |
| `--count N` | `1` | oluşturulacak hesap sayısı, seri |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | canlı kapı için kullanılan model |
| `--pool <file>` | `proxies.txt` | çıkış listesi, satır başına bir proxy — isteğe bağlı |
| `--tries N` | `3` | hesap başına taranan çıkış adayı |
| `--mint-tries N` | `2` | çıkış başına tam kayıt denemesi (yeni posta kutusu + Chrome) |
| `--gap MS` | `20000` | hesaplar arası duraklama |
| `--panel-gap MS` | `14000` | bu panelin API çağrıları arası duraklama (5 istek/dk) |
| `--code-timeout S` | `240` | e-posta kodunu bekleme saniyesi |
| `--keys <file>` | `keys.txt` | `--verify-only` / `--connect-9router` için anahtar dosyası |
| `--headless` | kapalı | **yalnızca tanılama** — Turnstile üretmez, her üretim başarısız olur |

## 🛰️ Proxy arkasında

**İsteğe bağlı — ölçekte önerilir (IP başına sınırlar, yasaklar).** Araç proxy olmadan da çalışır.

- **Havuzla:** `--pool <file>` geçin (veya `SEEKAI_PROXIES` ayarlayın) ve her istek — Chrome tarayıcısı dahil — o listeden bir çıkıştan geçer, fail-closed: her aday önce denetlenir (oturum açma sayfası görüntülenir + Turnstile betiği 200) ve çalıştırma daha sonra hesabın tamamı boyunca o çıkışa sabitlenir.
- **Havuz olmadan:** CLI `running WITHOUT a proxy (direct)` yazdırır ve doğrudan bağlanır. Kayıt, anahtar üretimi veya check-in hakkında hiçbir şey değişmez — yalnızca paketlerin nereden çıktığı değişir.
- **Burada başarıyı çıkış kalitesi belirler.** 2026-10-21'de ham bir havuz çoğunlukla `no login form` / `no turnstile token` verdi; 26 adaydan yalnızca **8**'i rayı gerçekten çalıştırabildi. Önce tarayın, sonra üretin.
- Kullanıcı adı/parolalı SOCKS5 satırları atlanır: Chrome bunlara kimlik doğrulayamaz (kimlik bilgili HTTP proxy'leri Fetch alanı üzerinden işlenir).

## 📄 Dosyalar

| Yol | İçerik |
| --- | --- |
| `keys.txt` | satır başına bir canlı doğrulanmış anahtar — git tarafından yok sayılır |
| `accounts.json` | kullanıcı adı / parola / e-posta / anahtar / check-in durumu, başarısız denemeler dahil |
| `proxies.txt` | çıkışlarınız — git tarafından yok sayılır |
| `out/` | çalıştırma günlüğü, hata ekran görüntüleri, `attempts.jsonl` defteri — git tarafından yok sayılır |

## 🔌 9Router'a bağlan

[9Router](https://9router.com) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Varsayılanlar: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Modeller `seekai/<model id>` olarak sunulur. CLI aynısını tek seferde yapabilir: `node src/cli.js --connect-9router`.

## 🔌 OmniRoute'a bağlan

[OmniRoute](https://omniroute.online) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Varsayılanlar: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Modeller `seekai/<model id>` olarak sunulur. CLI aynısını tek seferde yapabilir: `node src/cli.js --connect-omniroute`.

## 🔑 Bir anahtar size ne kazandırır

| | |
| --- | --- |
| 🏢 Sağlayıcı | **SeekAI** — [seekai.cc](https://seekai.cc) |
| 🎁 Sağlayıcının verdikleri | **hesap başına günlük $20**, tek bir check-in ile talep edilir (`quota_awarded: 10000000`) |
| 🔑 Bir anahtar size ne kazandırır | `https://seekai.cc/v1` üzerinde hesabın model listesi, check-in kredisinden faturalandırılır |
| 🌐 API şekli | OpenAI uyumlu: `POST https://seekai.cc/v1/chat/completions` (yanıtlar `reasoning` içinde gelebilir) |
| 🔒 Verileriniz | yalnızca `seekai.cc` ve posta kutusu arka ucunuzla iletişim kurulur |

## 🐞 Sorunlar

SeekAI kayıt formunu, Turnstile site anahtarını (`0x4AAAAAAEcpuQE_WXc4ZfG8`), check-in ödülünü veya model kataloğunu değiştirirse, araç orada durur ve bunu söyler. Komut ve tam çıktıyla birlikte **[bir sorun açın](../../issues)**.

## 📄 Lisans

MIT © 2026 — bkz. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 seekai-bulk-apikey katkıda bulunanlar

</div>