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

**Otomatik oluşturulan API anahtarlarıyla toplu [SeekAI](https://seekai.cc) hesabı açın — hesap başına günlük 20 $ check-in kredisi — OpenAI uyumlu çıkarım + [9Router](https://9router.com) bağlayıcısı.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20verified-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)

[🛠 Hızlı başlangıç](#-quick-start) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🤖 Modeller ve ücretsiz katman](#-models--free-tier) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy arkasında](#️-behind-a-proxy) · [🔌 9Router](#-connect-to-9router) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Bu neden var

SeekAI, `seekai.cc` üzerinde bir New API paneli çalıştırıyor. Hoş geldin kredisi yuvarlama hatası kadar (kota `1`); asıl ücretsiz katman **günlük 签到 (check-in): 10.000.000 kota = hesap başına 20 $, panel günü başına bir kez**. Kayıt sıradan bir e-posta + parola formu — OAuth yok, telefon yok, kart yok — ama her kapılı adım (kod isteği + kayıt, oturum açma ve check-in'in kendisi) bir **Cloudflare Turnstile** taşıyor ve bu widget bu panelde yalnızca **başsız olmayan (headed) Chrome**'da üretiliyor. Bu araç gerçek bir Chrome'u CDP üzerinden sürer (sıfır bağımlılık), bir hesabı harcamadan önce çıkışı tarar, anahtarı üretir, günün kredisini alır ve yalnızca gerçek bir tamamlama yanıtı veren anahtarları saklar.

## 🤖 Modeller ve ücretsiz katman

| Model Kimliği | not |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | her anahtarda doğrulanan tek kimlik (2026-10-21'de 18/18); bir akıl yürütme rotası olarak yanıt verir |

`GET /v1/models` bu hesaplar için **29 kimlik** döndürdü; `:free` sonekli kimlikler `401 API key is disabled` ile reddediliyor, bu yüzden kapı yukarıdaki kimliği kullanır ve hesabın çağırabileceği her neyse ona geri döner.

**Akıl yürütme tuzağı:** bu aktarma, yanıtı `message.reasoning` içine koyar ve `message.content` alanını **boş** bırakır. Yalnızca `content` okuyan bir kapı, canlı anahtarları ölü sayar — bu araç `content || reasoning_content || reasoning` kabul eder ve metni hangisinin taşıdığını bildirir.

| Ücretsiz katmanın verdikleri | Değer |
| --- | --- |
| Günlük check-in | **10.000.000 kota = hesap başına 20 $, panel günü başına bir kez** (`quota_per_unit 500000`) |
| Aynı gün ikinci çağrı | `今日已签到` (idempotent — sağlıklı sayılır) |
| Panel günü | **UTC+8** — 16:00 UTC'de devrilir |
| Ölçülen çalıştırma (2026-10-21) | **38 hesabın 12'si check-in yaptı → +120.000.000 kota = tek geçişte 240 $** |
| Hız sınırı | IP başına ~**5 istek/dk** (`您已达到总请求数限制`) → çağrılar ≥14 sn aralıklı |
| Kart / telefon | hiçbir yerde, akışın hiçbir adımında yok |

Ölçülen hız sınırı davranışı: aralık yok sayılırsa `200 200 200 200 200` ardından `429`; `already-checked-in` ise `200 {"success":false,"message":"今日已签到"}` döner.

## 🛠 Hızlı başlangıç

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

`keys.txt` yalnızca `GET /v1/models` **ve** gerçek bir tamamlama sonrasında yazılır; `accounts.json` hesap durumunu (kullanıcı adı, parola, e-posta, anahtar, check-in kredisi) saklar.

### 🖱️ Başlatıcı

`node src/launcher.js` yukarıdaki kelime işaretini yazdırır ve numaralı bir menü sunar: **üret** (N hesap, sıralı), **doğrula** (`keys.txt`), **tara** (çıkış listesi), **ayarlar** (proxy dosyası, model, sayı — `launcher.config.json` içinde tutulur), **9Router'a bağlan**, yardım ve çıkış. Her öğe, aynı `src/cli.js` bayraklarının ince bir sarmalayıcısıdır.

## ✅ Doğrulandı — her anahtar test edilir

Tüm kontroller **2026-10-21** tarihinde bu araçla çalıştırıldı.

| Kontrol | Sonuç |
| --- | --- |
| `--screen` (HTTP çıkış denetimi) | oturum açma sayfası görüntülenir + `challenges.cloudflare.com/turnstile/v0/api.js` **200** yanıtlar + API ana makinesi yanıtlar |
| akış içindeki çıkış taraması | widget'ı hiç üretmeyen bir hat, bir posta kutusu harcanmadan **önce** reddedilir |
| kayıt | `POST /api/user/register?turnstile=` → postalanan koddan sonra **200** |
| anahtar üretimi | `POST /api/token/` → listele → `POST /api/token/<id>/key` → **200**, 48 karakterlik anahtar |
| günlük check-in | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`**; tek çalıştırmada 12 hesap = **240 $** |
| anahtar başına sohbet | `deepseek-ai/DeepSeek-V4-Flash-0731` üzerinde **18 / 18 anahtar 200** (metin `reasoning` içinde) |
| kontrolünde başarısız olan anahtar | `keys.txt` dosyasına asla yazılmaz |

İstediğiniz zaman yeniden kontrol edin:

```bash
node src/cli.js --verify-only            # every key in keys.txt through the live gate
curl https://seekai.cc/v1/chat/completions \
  -H "Authorization: Bearer <48-char-key>" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-ai/DeepSeek-V4-Flash-0731","messages":[{"role":"user","content":"Reply with one short sentence: what is 2+2?"}],"max_tokens":64}'
```

## 🧭 Nasıl çalışır

| Adım | Çağrı | Notlar |
| --- | --- | --- |
| tarama | Chrome'da `/sign-in` | panelin widget'ı bağlanmalı **ve üretmeli**; sayfayı yükleyip hiç yanıt vermeyen bir hat kayıt olamaz |
| posta kutusu | Emailnator gmail kutusu | adresler geri dönüştürülür, bu yüzden yalnızca `seekai`'den gelen posta kabul edilir |
| kayıt | `GET /api/verification?email=&turnstile=` | **tek bir token kod isteğini ve kayıt çağrısını kapsar** |
| kayıt | `POST /api/user/register?turnstile=` | kullanıcı adı, parola, e-posta, verification_code |
| oturum açma | `POST /api/user/login?turnstile=` | kendi token'ı → `data.access_token` |
| anahtar | `POST /api/token/` → listele → `/api/token/<id>/key` | bu rotalarda captcha yok; liste yalnızca bir maske gösterir |
| check-in | `POST /api/user/checkin?turnstile=` | kendi token'ı → `quota_awarded: 10000000` |
| kapı | `GET /v1/models` + bir tamamlama | **`content` veya `reasoning` ile 200** → anahtar yazılır |

Buradaki Turnstile token'ları **tek kullanımlık ve belgeye bağlıdır**; başka bir bağlamda üretilen bir token `Turnstile 校验失败` yanıtı verir. **Başsız Chrome bu panelde çalışmaz** — ölçüldü: `--headless=new` ve `--headless=old` widget'ı 60 sn boyunca boş bırakır, oysa başsız olmayan bir pencere (görünür veya ekran dışı) 2-4 sn içinde yanıt verir. `--headless` yalnızca bir tanılama olarak vardır.

## ⚙️ CLI seçenekleri

| Bayrak | Varsayılan | Anlamı |
| --- | --- | --- |
| `--count N` | `1` | üretilecek hesap sayısı, sıralı |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | canlı kapı için kullanılan model |
| `--pool <file>` | `proxies.txt` | çıkış listesi, satır başına bir proxy — isteğe bağlı |
| `--tries N` | `3` | hesap başına taranan çıkış adayı |
| `--mint-tries N` | `2` | çıkış başına tam kayıt denemesi (yeni posta kutusu + Chrome) |
| `--gap MS` | `20000` | hesaplar arası bekleme |
| `--panel-gap MS` | `14000` | bu panelin API çağrıları arası bekleme |
| `--code-timeout S` | `240` | e-posta kodunu bekleme süresi (saniye) |
| `--keys <file>` | `keys.txt` | `--verify-only` / `--connect-9router` için anahtar dosyası |
| `--headless` | kapalı | yalnızca tanılama — Turnstile üretmez |
| `--browser <exe>` | otomatik | Chrome ikili dosyası (ortam değişkeni `CHROME_PATH`) |
| `--debug-port N` | otomatik | Chrome DevTools portu |
| `--verify-only` · `--screen` · `--connect-9router` · `--help` | | modlar |

## 🛰️ Proxy arkasında

- **Havuzla:** `--pool <file>` (veya `SEEKAI_PROXIES` ortam değişkeni). Her istek — Chrome tarayıcısı dahil — tek bir çıkıştan geçer, fail-closed: adaylar önce denetlenir (oturum açma sayfası görüntülenir + Turnstile betiği 200) ve çalıştırma hesabın tamamı boyunca o çıkışa sabitlenir.
- **Havuz olmadan:** araç doğrudan bağlanır ve `running WITHOUT a proxy (direct)` yazdırır. Başka hiçbir şey değişmez.
- **Burada başarıyı çıkış kalitesi belirler.** 2026-10-21'de ham bir havuz çoğunlukla `no login form` / `no turnstile token` üretti; 26 adaydan yalnızca **8**'i hattı çalıştırabildi. Önce tarayın, sonra üretin.
- Kullanıcı adı/parolalı SOCKS5 satırları atlanır (Chrome bunlara kimlik doğrulayamaz); kimlik bilgili HTTP proxy'leri Fetch alanı üzerinden işlenir.

## 📄 Dosyalar

| Yol | İçerik |
| --- | --- |
| `keys.txt` | satır başına bir canlı doğrulanmış anahtar — git tarafından yok sayılır |
| `accounts.json` | kullanıcı adı / parola / e-posta / anahtar / check-in durumu — git tarafından yok sayılır |
| `proxies.txt` | çıkışlarınız — git tarafından yok sayılır |
| `out/` | çalıştırma günlüğü, hata ekran görüntüleri, `attempts.jsonl` — git tarafından yok sayılır |

## 🔌 9Router'a bağlan

```bash
node src/cli.js --connect-9router                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-9router --9router-base http://localhost:20128 --9router-password 123456
```

Varsayılanlar: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Modeller `seekai/<model id>` olarak sunulur.

## 🔌 OmniRoute'a bağlan

```bash
node src/cli.js --connect-omniroute                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-omniroute --omniroute-base http://localhost:20128 --omniroute-password 123456
```

Varsayılanlar: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Modeller `seekai/<model id>` olarak sunulur.
## 🐞 Sorunlar

SeekAI kayıt formunu, Turnstile site anahtarını (`0x4AAAAAAEcpuQE_WXc4ZfG8`), check-in ödülünü veya model kataloğunu değiştirirse araç orada durur ve bunu bildirir. Komutla ve tam çıktıyla birlikte **[bir sorun açın](../../issues)**.

## 📄 Lisans

[MIT](LICENSE) © seekai-bulk-apikey katkıda bulunanlar

---

## ⚠️ Hesap riski ve riski en aza indirme
