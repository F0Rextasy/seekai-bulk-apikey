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

**Créez en masse des comptes SeekAI (seekai.cc) avec des clés API générées automatiquement et réclamez le crédit quotidien de 20 $ du check-in — inférence compatible OpenAI + connecteur 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20served-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Démarrage rapide](#-quick-start) · [🎁 Offre gratuite](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-1-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi cela existe

SeekAI exploite un panneau New API (`v1.0.0-rc.25`) sur `seekai.cc` dont **l'offre gratuite est un 签到 (check-in) quotidien : 10 000 000 de quota = 20 $ par compte, réclamé une fois par jour du panneau**. L'inscription est un simple formulaire e-mail + mot de passe (aucun OAuth n'est requis), et le crédit de bienvenue n'est que symbolique (quota 1) — le check-in *est* l'argent. Chaque étape protégée — demande de code + inscription, connexion, et le check-in lui-même — porte un jeton **Cloudflare Turnstile**, et ce widget ne se génère que dans un **Chrome avec interface** sur ce panneau, c'est pourquoi l'outil pilote un vrai navigateur via CDP et filtre la sortie avant d'y dépenser un compte.

## 🎁 Offre gratuite — ce que vous obtenez

| Quoi | Valeur |
| --- | --- |
| Crédit quotidien | **un check-in par compte par jour du panneau = 10 000 000 de quota = 20 $** (`quota_per_unit 500000`) |
| Crédit de bienvenue | quota `1` (≈ 0,000002 $) — l'offre gratuite est le check-in, pas l'inscription |
| Exécution mesurée | **12 comptes sur 38 enregistrés le 2026-10-21 → +120 000 000 de quota = 240 $ en une passe** (`providers/seekai.cc/out/checkin-2026-10-21.json`) |
| Deuxième appel, même jour | `今日已签到` (idempotent, considéré comme sain) |
| Jour du panneau | **UTC+8** — il bascule à 16:00 UTC |
| Limite de débit | le panneau plafonne l'ensemble de l'IP à ~**5 requêtes/min** (`您已达到总请求数限制`) → espacez les appels de ≥14 s |
| Carte / téléphone | **aucun** — aucune étape de paiement nulle part, et aucun numéro de téléphone n'est demandé |
| Clause multi-comptes | non publiée : `/api/user/agreement` est réservé aux admins (403 `AUTH_INSUFFICIENT_PRIVILEGE`) |

> 💡 L'offre gratuite est définie par SeekAI et peut changer. Vérifiez les chiffres en direct sur [seekai.cc](https://seekai.cc) — et laissez le propre filtre de l'outil décider :

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modèles — tous les 1

Le panneau annonce un identifiant de chat vérifié sur les comptes que cet outil crée :

| ID du modèle | note |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | chat vérifié pour chaque clé le 2026-10-21 ; répond comme une route de raisonnement |

`GET /v1/models` renvoie les identifiants que ce compte peut appeler ; les identifiants portant un suffixe `:free` sont rejetés avec **401 `API key is disabled`**, donc l'outil filtre sur l'identifiant ci-dessus (et se rabat sur ce que `/v1/models` propose qui n'est pas rejeté).

La forme de la réponse compte : ce relais place le texte dans **`message.reasoning`** et laisse `message.content` **vide** (son `finish_reason` est `length` pour de petits `max_tokens`). Un filtre qui ne regarde que `content` déclare des clés actives inutilisables, donc l'outil accepte `content || reasoning_content || reasoning` et indique lequel a porté la réponse.

## 🧪 Comment utiliser l'API

URL de base **`https://seekai.cc/v1`** — chat completions compatible OpenAI. Les clés font **48 caractères sans préfixe `sk-`** (la liste du panneau les masque ; l'outil révèle la valeur avec `POST /api/token/<id>/key`).

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

Un jeton dont le propre `remain_quota` est 0 et qui n'est pas illimité ne s'authentifie pas du tout — créez la clé avec `unlimited_quota: true` (ce que fait l'outil).

## 🛠 Démarrage rapide

```bash
cd seekai-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + daily $20 check-in in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

L'inscription (et le check-in) nécessite un vrai Chrome **avec interface** : mesuré sur ce panneau, `--headless=new` et `--headless=old` laissent le widget Turnstile vide pendant 60 s, tandis qu'une fenêtre avec interface — visible ou hors écran — répond en 2-4 s. `keys.txt` n'est écrit qu'après `GET /v1/models` **et** une vraie complétion ; `accounts.json` conserve l'état du compte (nom d'utilisateur, mot de passe, e-mail, clé, crédit de check-in).

### 🖱️ Le lanceur

`node src/launcher.js` est un menu au-dessus des modules de tâches : **mint** (un nouveau compte, son e-mail vérifié, la clé et le check-in quotidien de 20 $), **verify** (relancer le filtre de chat sur `keys.txt`) et **screen** (passe HTTP sur la liste des sorties). Les réglages — liste de proxys, nombre de comptes, modèle — persistent dans `launcher.config.json`. Chaque option ci-dessous est accessible directement depuis la CLI.

## ✅ Vérifié fonctionnel — chaque clé est testée

Toutes les vérifications ci-dessous ont été relancées le **2026-10-21** depuis la CLI fournie (pool de sorties, sans WARP).

| Vérification | Résultat |
| --- | --- |
| `--screen` (vérification HTTP des sorties) | la page de connexion doit s'afficher + `challenges.cloudflare.com/turnstile/v0/api.js` doit répondre 200 + l'hôte de l'API doit répondre |
| filtrage des sorties dans Chrome (en flux) | une ligne dont le widget ne se génère jamais est refusée **avant** qu'une boîte mail ne soit dépensée (c'était le blocage du 2026-10-14, désormais un filtre strict) |
| inscription | `POST /api/user/register?turnstile=` → **200** (`success: true`) après le code par e-mail |
| création de clé | `POST /api/token/` → liste → `POST /api/token/<id>/key` → **200**, clé de 48 caractères |
| check-in quotidien | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`** (20 $) ; 12 comptes en une exécution = **240 $** |
| chat par clé | **chaque clé 200** sur `deepseek-ai/DeepSeek-V4-Flash-0731` (réponse portée dans `reasoning`) — relancé depuis cette CLI, avec rotation des sorties |
| `401 API key is disabled` | **dépend de la sortie, pas un verdict sur la clé** : trois clés ont répondu cela depuis une sortie et 200 depuis une autre dans la même minute, donc le filtre réessaie cette réponse sur la sortie suivante |
| une clé qui échoue à sa vérification | jamais écrite dans `keys.txt` (le filtre réessaie une fois les échecs de classe sortie) |

> **Filtres de qualité.** Chaque clé ici a passé un `chat-200` en direct avant d'être écrite dans `keys.txt`
> (les clés mortes ne sont jamais livrées). Les combos de routeur suivent la même règle au niveau du modèle : une entrée n'est
> ajoutée **que si le modèle répond `chat-200` et peut appeler des outils** — un modèle sans support des outils,
> une clé morte ou un fournisseur mort est écarté au lieu d'être ajouté. Relancez l'étape de vérification à tout moment ;
> les échecs sont signalés, jamais cachés.

## 🧭 Comment ça marche

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: SeekAI page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://seekai.cc/v1/chat/completions → real content = the key is live
```

| Étape | Appel | Notes |
| --- | --- | --- |
| filtrage | `/sign-in` dans Chrome | le widget du panneau doit se monter **et se générer** ; une ligne qui charge la page mais ne répond jamais ne peut pas s'inscrire |
| boîte mail | boîte gmail Emailnator | le rail recycle les adresses, donc seul le courrier de `seekai` est accepté |
| inscription | `/sign-up` → `GET /api/verification?email=&turnstile=` | un jeton couvre la demande de code **et** l'appel d'inscription |
| enregistrement | `POST /api/user/register?turnstile=` | corps : nom d'utilisateur, mot de passe, e-mail, verification_code |
| connexion | `POST /api/user/login?turnstile=` | son propre jeton → `data.access_token` |
| clé | `POST /api/token/` → liste → `/api/token/<id>/key` | pas de captcha sur ces routes ; la liste n'affiche qu'un masque |
| check-in | `POST /api/user/checkin?turnstile=` | son propre jeton → `quota_awarded: 10000000` |
| filtre | `GET /v1/models` + une complétion | 200 avec `content` **ou** `reasoning` → la clé est écrite |

Le panneau répond aussi **`401 API key is disabled`** pour des raisons sans aucun rapport avec la clé (mesuré le 2026-10-21 : même clé, une sortie 401, une autre 200 en moins d'une minute) — une exécution de vérification devrait faire tourner les sorties avant de le croire.

Les jetons Turnstile ici sont **à usage unique et liés au document** : un jeton produit dans un autre contexte répond `Turnstile 校验失败`. L'automatisation de style Playwright n'est pas nécessaire — un simple `Runtime.evaluate` CDP + un clic `Input.dispatchMouseEvent` suffit, ce que fait ce client sans dépendances.

## ⚙️ Options de la CLI

```bash
node src/cli.js --count 5                  # five sign-ups, serial (one headed Chrome at a time)
node src/cli.js --model deepseek-ai/DeepSeek-V4-Flash-0731
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Option | Défaut | Signification |
| --- | --- | --- |
| `--count N` | `1` | comptes à créer, en série |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | modèle utilisé pour le filtre en direct |
| `--pool <file>` | `proxies.txt` | liste de sorties, une ligne par proxy — facultatif |
| `--tries N` | `3` | candidats de sortie filtrés par compte |
| `--mint-tries N` | `2` | tentatives d'inscription complètes (nouvelle boîte mail + Chrome) par sortie |
| `--gap MS` | `20000` | pause entre les comptes |
| `--panel-gap MS` | `14000` | pause entre les appels API de ce panneau (5 req/min) |
| `--code-timeout S` | `240` | secondes d'attente du code par e-mail |
| `--keys <file>` | `keys.txt` | fichier de clés pour `--verify-only` / `--connect-9router` |
| `--headless` | désactivé | **diagnostic uniquement** — Turnstile ne se générera pas, chaque création échoue |

## 🛰️ Derrière un proxy

**Facultatif — recommandé à grande échelle (limites par IP, bannissements).** L'outil fonctionne aussi sans proxy.

- **Avec un pool :** passez `--pool <file>` (ou définissez `SEEKAI_PROXIES`) et chaque requête — le navigateur Chrome inclus — passe par une sortie de cette liste, en mode fail-closed : chaque candidat est d'abord vérifié (la page de connexion s'affiche + le script Turnstile répond 200) et l'exécution reste ensuite épinglée à cette sortie pour tout le compte.
- **Sans pool :** la CLI affiche `running WITHOUT a proxy (direct)` et se connecte directement. Rien ne change pour l'inscription, la création de clé ou le check-in — seul le point de sortie des paquets change.
- **La qualité des sorties décide du succès ici.** Le 2026-10-21, un pool brut a donné surtout `no login form` / `no turnstile token` ; sur 26 candidats, seuls **8** pouvaient réellement exécuter le rail. Filtrez d'abord, puis créez.
- Les lignes SOCKS5 avec un nom d'utilisateur/mot de passe sont ignorées : Chrome ne peut pas s'y authentifier (les proxys HTTP avec identifiants sont gérés via le domaine Fetch).

## 📄 Fichiers

| Chemin | Contenu |
| --- | --- |
| `keys.txt` | une clé vérifiée en direct par ligne — ignoré par git |
| `accounts.json` | nom d'utilisateur / mot de passe / e-mail / clé / état du check-in, y compris les tentatives échouées |
| `proxies.txt` | vos sorties — ignoré par git |
| `out/` | journal d'exécution, captures d'écran d'échec, registre `attempts.jsonl` — ignoré par git |

## 🔌 Connexion à 9Router

[9Router](https://9router.com) est un routeur auto-hébergé, compatible OpenAI :

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Défauts : `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Les modèles sont servis sous `seekai/<model id>`. La CLI peut faire la même chose en une seule commande : `node src/cli.js --connect-9router`.

## 🔌 Connexion à OmniRoute

[OmniRoute](https://omniroute.online) est un routeur auto-hébergé, compatible OpenAI :

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Défauts : `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Les modèles sont servis sous `seekai/<model id>`. La CLI peut faire la même chose en une seule commande : `node src/cli.js --connect-omniroute`.

## 🔑 Ce qu'une clé vous apporte

| | |
| --- | --- |
| 🏢 Fournisseur | **SeekAI** — [seekai.cc](https://seekai.cc) |
| 🎁 Ce que le fournisseur donne | **20 $ par compte par jour**, réclamés avec un seul check-in (`quota_awarded: 10000000`) |
| 🔑 Ce qu'une clé vous apporte | la liste de modèles du compte sur `https://seekai.cc/v1`, facturée sur le crédit de check-in |
| 🌐 Forme de l'API | compatible OpenAI : `POST https://seekai.cc/v1/chat/completions` (les réponses peuvent arriver dans `reasoning`) |
| 🔒 Vos données | seuls `seekai.cc` et votre backend de boîte mail sont contactés |

## 🐞 Problèmes

Si SeekAI modifie son formulaire d'inscription, sa clé de site Turnstile (`0x4AAAAAAEcpuQE_WXc4ZfG8`), la récompense du check-in ou le catalogue de modèles, l'outil s'arrête là et le signale. **[Ouvrez un ticket](../../issues)** avec la commande et la sortie exacte.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 contributeurs de seekai-bulk-apikey

</div>