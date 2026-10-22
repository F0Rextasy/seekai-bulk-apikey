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

**Créez en masse des comptes [SeekAI](https://seekai.cc) avec des clés API générées automatiquement — un crédit de check-in de 20 $ par compte et par jour — inférence compatible OpenAI + connecteur [9Router](https://9router.com).**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20verified-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)

[🛠 Démarrage rapide](#-quick-start) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🤖 Modèles et offre gratuite](#-models--free-tier) · [⚙️ Options](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🔌 9Router](#-connect-to-9router) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi cet outil existe

SeekAI fait tourner un panneau New API sur `seekai.cc`. Son crédit de bienvenue est une erreur d'arrondi (quota `1`) ; la véritable offre gratuite est le **签到 (check-in) quotidien : 10 000 000 de quota = 20 $ par compte, une fois par jour du panneau**. L'inscription est un formulaire ordinaire e-mail + mot de passe — pas d'OAuth, pas de téléphone, pas de carte — mais chaque étape protégée (demande de code + inscription, connexion, et le check-in lui-même) comporte un **Cloudflare Turnstile**, et ce widget ne se génère que dans un **Chrome avec interface** sur ce panneau. Cet outil pilote un vrai Chrome via CDP (zéro dépendance), filtre la sortie avant d'y dépenser un compte, génère la clé, réclame le crédit du jour et ne conserve que les clés ayant répondu à une véritable complétion.

## 🤖 Modèles et offre gratuite

| ID du modèle | remarque |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | le seul id vérifié sur chaque clé (18/18 le 2026-10-21) ; répond comme une route de raisonnement |

`GET /v1/models` a renvoyé **29 ids** pour ces comptes ; les ids portant un suffixe `:free` sont rejetés avec `401 API key is disabled`, donc le filtre utilise l'id ci-dessus et se rabat sur ce que le compte peut appeler.

**Le piège du raisonnement :** ce relais place la réponse dans `message.reasoning` et laisse `message.content` **vide**. Un filtre qui ne lit que `content` déclare mortes des clés vivantes — cet outil accepte `content || reasoning_content || reasoning` et indique lequel a porté le texte.

| Ce que l'offre gratuite donne | Valeur |
| --- | --- |
| Check-in quotidien | **10 000 000 de quota = 20 $ par compte, une fois par jour du panneau** (`quota_per_unit 500000`) |
| Deuxième appel le même jour | `今日已签到` (idempotent — considéré comme sain) |
| Jour du panneau | **UTC+8** — il bascule à 16:00 UTC |
| Exécution mesurée (2026-10-21) | **12 comptes sur 38 ont fait leur check-in → +120 000 000 de quota = 240 $ en une passe** |
| Limite de débit | ~**5 requêtes/min par IP** (`您已达到总请求数限制`) → les appels sont espacés d'au moins 14 s |
| Carte / téléphone | aucun, à aucune étape du flux |

Comportement de la limite de débit, mesuré : `200 200 200 200 200` puis `429` si l'espacement est ignoré ; `already-checked-in` répond `200 {"success":false,"message":"今日已签到"}`.

## 🛠 Démarrage rapide

```bash
git clone https://github.com/F0Rextasy/seekai-bulk-apikey
cd seekai-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # OPTIONNEL — sans cela, l'outil fonctionne en direct
node src/launcher.js        # menu interactif
# ou directement :
node src/cli.js --count 1        # une inscription + le check-in quotidien de 20 $ dans un vrai Chrome
node src/cli.js --verify-only    # revérifie chaque clé dans keys.txt
node src/cli.js --screen         # filtrage HTTP de votre liste de sorties
```

`keys.txt` n'est écrit qu'après `GET /v1/models` **et** une véritable complétion ; `accounts.json` conserve l'état du compte (nom d'utilisateur, mot de passe, e-mail, clé, crédit de check-in).

### 🖱️ Le lanceur

`node src/launcher.js` affiche le logo ci-dessus et propose un menu numéroté : **mint** (N comptes, en série), **verify** (`keys.txt`), **screen** (liste de sorties), **settings** (fichier de proxys, modèle, nombre — conservés dans `launcher.config.json`), **connect to 9Router**, aide et quitter. Chaque entrée est une fine enveloppe autour des mêmes options de `src/cli.js`.

## ✅ Vérifié fonctionnel — chaque clé est testée

Toutes les vérifications ont été exécutées le **2026-10-21** depuis cet outil.

| Vérification | Résultat |
| --- | --- |
| `--screen` (contrôle HTTP de la sortie) | la page de connexion s'affiche + `challenges.cloudflare.com/turnstile/v0/api.js` répond **200** + l'hôte de l'API répond |
| filtrage de sortie dans le flux | une ligne dont le widget ne se génère jamais est refusée **avant** qu'une boîte mail ne soit dépensée |
| inscription | `POST /api/user/register?turnstile=` → **200** après le code envoyé par e-mail |
| génération de clé | `POST /api/token/` → liste → `POST /api/token/<id>/key` → **200**, clé de 48 caractères |
| check-in quotidien | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`** ; 12 comptes en une exécution = **240 $** |
| chat par clé | **18 / 18 clés 200** sur `deepseek-ai/DeepSeek-V4-Flash-0731` (texte dans `reasoning`) |
| une clé qui échoue à sa vérification | jamais écrite dans `keys.txt` |

Revérifiez à tout moment :

```bash
node src/cli.js --verify-only            # chaque clé de keys.txt passe par le filtre en direct
curl https://seekai.cc/v1/chat/completions \
  -H "Authorization: Bearer <48-char-key>" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-ai/DeepSeek-V4-Flash-0731","messages":[{"role":"user","content":"Reply with one short sentence: what is 2+2?"}],"max_tokens":64}'
```

## 🧭 Comment ça marche

| Étape | Appel | Remarques |
| --- | --- | --- |
| filtrage | `/sign-in` dans Chrome | le widget du panneau doit se monter **et se générer** ; une ligne qui charge la page mais ne répond jamais ne peut pas s'inscrire |
| boîte mail | boîte gmail Emailnator | les adresses sont recyclées, donc seuls les mails de `seekai` sont acceptés |
| inscription | `GET /api/verification?email=&turnstile=` | **un seul token couvre la demande de code et l'appel d'inscription** |
| enregistrement | `POST /api/user/register?turnstile=` | nom d'utilisateur, mot de passe, e-mail, verification_code |
| connexion | `POST /api/user/login?turnstile=` | son propre token → `data.access_token` |
| clé | `POST /api/token/` → liste → `/api/token/<id>/key` | pas de captcha sur ces routes ; la liste n'affiche qu'un masque |
| check-in | `POST /api/user/checkin?turnstile=` | son propre token → `quota_awarded: 10000000` |
| filtre | `GET /v1/models` + une complétion | **200 avec `content` ou `reasoning`** → la clé est écrite |

Les tokens Turnstile ici sont **à usage unique et liés au document** ; un token produit dans un autre contexte répond `Turnstile 校验失败`. **Chrome sans interface ne fonctionne pas sur ce panneau** — mesuré : `--headless=new` et `--headless=old` laissent le widget vide pendant 60 s, tandis qu'une fenêtre avec interface (visible ou hors écran) répond en 2-4 s. `--headless` n'existe qu'à titre de diagnostic.

## ⚙️ Options CLI

| Option | Défaut | Signification |
| --- | --- | --- |
| `--count N` | `1` | comptes à créer, en série |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | modèle utilisé pour le filtre en direct |
| `--pool <file>` | `proxies.txt` | liste de sorties, une ligne par proxy — optionnel |
| `--tries N` | `3` | candidats de sortie filtrés par compte |
| `--mint-tries N` | `2` | tentatives d'inscription complètes (nouvelle boîte mail + Chrome) par sortie |
| `--gap MS` | `20000` | pause entre les comptes |
| `--panel-gap MS` | `14000` | pause entre les appels API de ce panneau |
| `--code-timeout S` | `240` | secondes d'attente du code par e-mail |
| `--keys <file>` | `keys.txt` | fichier de clés pour `--verify-only` / `--connect-9router` |
| `--headless` | désactivé | diagnostic uniquement — Turnstile ne se générera pas |
| `--browser <exe>` | auto | binaire Chrome (env `CHROME_PATH`) |
| `--debug-port N` | auto | port Chrome DevTools |
| `--verify-only` · `--screen` · `--connect-9router` · `--help` | | modes |

## 🛰️ Derrière un proxy

- **Avec un pool :** `--pool <file>` (ou la variable d'env `SEEKAI_PROXIES`). Chaque requête — le navigateur Chrome inclus — passe par une seule sortie, en échec fermé : les candidats sont d'abord vérifiés (la page de connexion s'affiche + le script Turnstile répond 200) et l'exécution reste épinglée à cette sortie pendant tout le compte.
- **Sans pool :** l'outil se connecte directement et affiche `running WITHOUT a proxy (direct)`. Rien d'autre ne change.
- **La qualité des sorties décide du succès ici.** Le 2026-10-21, un pool brut a produit surtout `no login form` / `no turnstile token` ; sur 26 candidats, seuls **8** pouvaient exécuter la chaîne. Filtrez d'abord, puis créez.
- Les lignes SOCKS5 avec un nom d'utilisateur/mot de passe sont ignorées (Chrome ne peut pas s'y authentifier) ; les proxys HTTP avec identifiants sont gérés via le domaine Fetch.

## 📄 Fichiers

| Chemin | Contenu |
| --- | --- |
| `keys.txt` | une clé vérifiée en direct par ligne — ignoré par git |
| `accounts.json` | nom d'utilisateur / mot de passe / e-mail / clé / état du check-in — ignoré par git |
| `proxies.txt` | vos sorties — ignoré par git |
| `out/` | journal d'exécution, captures d'écran d'échec, `attempts.jsonl` — ignoré par git |

## 🔌 Se connecter à 9Router

```bash
node src/cli.js --connect-9router                 # défauts : http://localhost:20128, mot de passe 123456
node src/cli.js --connect-9router --9router-base http://localhost:20128 --9router-password 123456
```

Défauts : `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Les modèles sont servis sous `seekai/<model id>`.

## 🔌 Se connecter à OmniRoute

```bash
node src/cli.js --connect-omniroute                 # défauts : http://localhost:20128, mot de passe 123456
node src/cli.js --connect-omniroute --omniroute-base http://localhost:20128 --omniroute-password 123456
```

Défauts : `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Les modèles sont servis sous `seekai/<model id>`.
## 🐞 Problèmes

Si SeekAI modifie son formulaire d'inscription, sa clé de site Turnstile (`0x4AAAAAAEcpuQE_WXc4ZfG8`), la récompense de check-in ou le catalogue de modèles, l'outil s'arrête là et le signale. **[Ouvrez un ticket](../../issues)** avec la commande et la sortie exacte.

## 📄 Licence

[MIT](LICENSE) © contributeurs de seekai-bulk-apikey

---

## ⚠️ Risque de compte et minimisation
