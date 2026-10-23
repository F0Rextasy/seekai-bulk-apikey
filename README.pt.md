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

**Crie contas SeekAI (seekai.cc) em massa com chaves de API geradas automaticamente e resgate o crédito diário de check-in de $20 — inferência compatível com OpenAI + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20served-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Início rápido](#-quick-start) · [🎁 Nível gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-1-of-them) · [🧪 Use a API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Como funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opções](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por que isto existe

O SeekAI roda um painel New API (`v1.0.0-rc.25`) em `seekai.cc` cujo **nível gratuito é um 签到 (check-in) diário: 10.000.000 de cota = $20 por conta, resgatado uma vez por dia do painel**. O cadastro é um formulário comum de e-mail + senha (nenhum OAuth é exigido), e o crédito de boas-vindas é apenas token (cota 1) — o check-in *é* o dinheiro. Cada etapa protegida — solicitação de código + cadastro, login e o próprio check-in — carrega um token **Cloudflare Turnstile**, e esse widget só é emitido em um **Chrome com interface gráfica** neste painel, razão pela qual a ferramenta controla um navegador real via CDP e faz a triagem da saída antes de gastar uma conta nela.

## 🎁 Nível gratuito — quanto você recebe

| O quê | Valor |
| --- | --- |
| Crédito diário | **um check-in por conta por dia do painel = 10.000.000 de cota = $20** (`quota_per_unit 500000`) |
| Crédito de boas-vindas | cota `1` (≈ $0.000002) — o nível gratuito é o check-in, não o cadastro |
| Execução medida | **12 de 38 contas fizeram check-in em 2026-10-21 → +120.000.000 de cota = $240 em uma única passagem** (`providers/seekai.cc/out/checkin-2026-10-21.json`) |
| Segunda chamada, mesmo dia | `今日已签到` (idempotente, conta como saudável) |
| Dia do painel | **UTC+8** — vira às 16:00 UTC |
| Limite de taxa | o painel limita todo o IP a ~**5 requisições/min** (`您已达到总请求数限制`) → espaçar chamadas ≥14 s |
| Cartão / telefone | **nenhum** — nenhuma etapa de pagamento em lugar algum, e nenhum número de telefone é solicitado |
| Cláusula de múltiplas contas | não publicada: `/api/user/agreement` é somente para administradores (403 `AUTH_INSUFFICIENT_PRIVILEGE`) |

> 💡 O nível gratuito é definido pelo SeekAI e pode mudar. Confira os números ao vivo em [seekai.cc](https://seekai.cc) — e deixe o próprio portão da ferramenta decidir:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — todos os 1 deles

O painel anuncia um id de chat verificado nas contas que esta ferramenta cria:

| ID do modelo | observação |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | chat verificado para cada chave em 2026-10-21; responde como uma rota de raciocínio |

`GET /v1/models` retorna os ids que esta conta pode chamar; ids com sufixo `:free` são rejeitados com **401 `API key is disabled`**, então a ferramenta filtra pelo id acima (e recorre ao que `/v1/models` oferecer que não seja rejeitado).

O formato da resposta importa: este relay coloca o texto em **`message.reasoning`** e deixa `message.content` **vazio** (seu `finish_reason` é `length` para `max_tokens` curtos). Um portão que olha apenas para `content` considera chaves ativas inutilizáveis, então a ferramenta aceita `content || reasoning_content || reasoning` e informa qual deles carregou a resposta.

## 🧪 Como usar a API

URL base **`https://seekai.cc/v1`** — chat completions compatível com OpenAI. As chaves têm **48 caracteres sem o prefixo `sk-`** (a lista do painel as mascara; a ferramenta revela o valor com `POST /api/token/<id>/key`).

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

Um token cujo próprio `remain_quota` é 0 e que não é ilimitado não autentica de forma alguma — crie a chave com `unlimited_quota: true` (a ferramenta faz isso).

## 🛠 Início rápido

```bash
cd seekai-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + daily $20 check-in in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

O cadastro (e o check-in) precisa de um Chrome real, **com interface gráfica**: medido neste painel, `--headless=new` e `--headless=old` deixam o widget Turnstile vazio por 60 s, enquanto uma janela com interface — visível ou fora da tela — responde em 2-4 s. `keys.txt` só é escrito após `GET /v1/models` **e** uma completion real; `accounts.json` mantém o estado da conta (nome de usuário, senha, e-mail, chave, crédito de check-in).

### 🖱️ O launcher

`node src/launcher.js` é um menu sobre os módulos de tarefas: **mint** (uma conta nova, seu e-mail verificado, a chave e o check-in diário de $20), **verify** (reexecuta o portão de chat sobre `keys.txt`) e **screen** (passagem HTTP sobre a lista de saídas). As configurações — lista de proxies, número de contas, modelo — persistem em `launcher.config.json`. Cada flag abaixo é acessível diretamente pela CLI.

## ✅ Verificado e funcionando — toda chave é testada

Todas as verificações abaixo foram reexecutadas em **2026-10-21** a partir da CLI fornecida (pool de saídas, sem WARP).

| Verificação | Resultado |
| --- | --- |
| `--screen` (triagem HTTP de saída) | a página de login deve renderizar + `challenges.cloudflare.com/turnstile/v0/api.js` deve responder 200 + o host da API deve responder |
| triagem de saída no Chrome (no fluxo) | uma linha cujo widget nunca é emitido é recusada **antes** de gastar uma caixa de correio (este é o bloqueio de 2026-10-14, agora um portão rígido) |
| cadastro | `POST /api/user/register?turnstile=` → **200** (`success: true`) após o código por e-mail |
| criação de chave | `POST /api/token/` → listar → `POST /api/token/<id>/key` → **200**, chave de 48 caracteres |
| check-in diário | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`** ($20); 12 contas em uma execução = **$240** |
| chat por chave | **toda chave 200** em `deepseek-ai/DeepSeek-V4-Flash-0731` (resposta carregada em `reasoning`) — reexecutado a partir desta CLI, com rotação de saída |
| `401 API key is disabled` | **depende da saída, não é um veredito sobre a chave**: três chaves responderam isso a partir de uma saída e 200 a partir de outra no mesmo minuto, então o portão tenta novamente essa resposta na próxima saída |
| uma chave que falha na verificação | nunca é escrita em `keys.txt` (o portão tenta novamente falhas da classe de saída uma vez) |

> **Portões de qualidade.** Toda chave aqui passou por um `chat-200` ao vivo antes de ser escrita em `keys.txt`
> (chaves mortas nunca são entregues). As combinações de roteador seguem a mesma regra no nível do modelo: uma entrada é
> adicionada **somente se o modelo responder `chat-200` e puder chamar ferramentas** — um modelo sem suporte a ferramentas,
> uma chave morta ou um provedor morto é descartado em vez de adicionado. Reexecute a etapa de verificação a qualquer momento;
> as falhas são relatadas, nunca ocultadas.

## 🧭 Como funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: SeekAI page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://seekai.cc/v1/chat/completions → real content = the key is live
```

| Etapa | Chamada | Observações |
| --- | --- | --- |
| triagem | `/sign-in` no Chrome | o próprio widget do painel deve montar **e emitir**; uma linha que carrega a página mas nunca responde não consegue cadastrar |
| caixa de correio | caixa gmail do Emailnator | o trilho recicla endereços, então só e-mails de `seekai` são aceitos |
| cadastro | `/sign-up` → `GET /api/verification?email=&turnstile=` | um token cobre a solicitação de código **e** a chamada de registro |
| registro | `POST /api/user/register?turnstile=` | corpo: nome de usuário, senha, e-mail, verification_code |
| login | `POST /api/user/login?turnstile=` | seu próprio token → `data.access_token` |
| chave | `POST /api/token/` → listar → `/api/token/<id>/key` | sem captcha nessas rotas; a lista mostra apenas uma máscara |
| check-in | `POST /api/user/checkin?turnstile=` | seu próprio token → `quota_awarded: 10000000` |
| portão | `GET /v1/models` + uma completion | 200 com `content` **ou** `reasoning` → a chave é escrita |

O painel também responde **`401 API key is disabled`** por motivos que nada têm a ver com a chave (medido em 2026-10-21: mesma chave, uma saída 401, outra 200 em menos de um minuto) — uma execução de verificação deve rotacionar saídas antes de acreditar nisso.

Os tokens Turnstile aqui são **de uso único e vinculados ao documento**: um token produzido em outro contexto responde `Turnstile 校验失败`. Automação no estilo Playwright não é necessária — um simples `Runtime.evaluate` do CDP + clique com `Input.dispatchMouseEvent` é suficiente, que é o que este cliente sem dependências faz.

## ⚙️ Opções da CLI

```bash
node src/cli.js --count 5                  # five sign-ups, serial (one headed Chrome at a time)
node src/cli.js --model deepseek-ai/DeepSeek-V4-Flash-0731
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Flag | Padrão | Significado |
| --- | --- | --- |
| `--count N` | `1` | contas a criar, em série |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | modelo usado para o portão ao vivo |
| `--pool <file>` | `proxies.txt` | lista de saídas, uma linha por proxy — opcional |
| `--tries N` | `3` | candidatos de saída triados por conta |
| `--mint-tries N` | `2` | tentativas completas de cadastro (nova caixa de correio + Chrome) por saída |
| `--gap MS` | `20000` | pausa entre contas |
| `--panel-gap MS` | `14000` | pausa entre as chamadas de API deste painel (5 req/min) |
| `--code-timeout S` | `240` | segundos para esperar o código por e-mail |
| `--keys <file>` | `keys.txt` | arquivo de chaves para `--verify-only` / `--connect-9router` |
| `--headless` | desligado | **apenas diagnóstico** — o Turnstile não será emitido, toda criação falha |

## 🛰️ Atrás de um proxy

**Opcional — recomendado em escala (limites por IP, banimentos).** A ferramenta funciona sem proxy também.

- **Com um pool:** passe `--pool <file>` (ou defina `SEEKAI_PROXIES`) e toda requisição — incluindo o navegador Chrome — passa por uma saída dessa lista, fail-closed: cada candidato é triado primeiro (a página de login renderiza + o script do Turnstile responde 200) e a execução então permanece fixada nessa saída durante toda a conta.
- **Sem um pool:** a CLI imprime `running WITHOUT a proxy (direct)` e conecta diretamente. Nada sobre o cadastro, a criação de chaves ou o check-in muda — apenas de onde os pacotes saem.
- **A qualidade da saída decide o sucesso aqui.** Em 2026-10-21, um pool bruto deu majoritariamente `no login form` / `no turnstile token`; de 26 candidatos, apenas **8** conseguiram de fato executar o trilho. Faça a triagem primeiro, depois crie.
- Linhas SOCKS5 com nome de usuário/senha são ignoradas: o Chrome não consegue autenticar nelas (proxies HTTP com credenciais são tratados através do domínio Fetch).

## 📄 Arquivos

| Caminho | Conteúdo |
| --- | --- |
| `keys.txt` | uma chave verificada ao vivo por linha — ignorado pelo git |
| `accounts.json` | nome de usuário / senha / e-mail / chave / estado de check-in, incl. tentativas falhas |
| `proxies.txt` | suas saídas — ignorado pelo git |
| `out/` | log de execução, capturas de tela de falhas, registro `attempts.jsonl` — ignorado pelo git |

## 🔌 Conectar ao 9Router

[9Router](https://9router.com) é um roteador auto-hospedado, compatível com OpenAI:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Padrões: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Os modelos são servidos como `seekai/<model id>`. A CLI pode fazer o mesmo em um único comando: `node src/cli.js --connect-9router`.

## 🔌 Conectar ao OmniRoute

[OmniRoute](https://omniroute.online) é um roteador auto-hospedado, compatível com OpenAI:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Padrões: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Os modelos são servidos como `seekai/<model id>`. A CLI pode fazer o mesmo em um único comando: `node src/cli.js --connect-omniroute`.

## 🔑 O que uma chave lhe dá

| | |
| --- | --- |
| 🏢 Provedor | **SeekAI** — [seekai.cc](https://seekai.cc) |
| 🎁 O que o provedor dá | **$20 por conta por dia**, resgatados com um check-in (`quota_awarded: 10000000`) |
| 🔑 O que uma chave lhe dá | a lista de modelos da conta em `https://seekai.cc/v1`, cobrada contra o crédito de check-in |
| 🌐 Formato da API | Compatível com OpenAI: `POST https://seekai.cc/v1/chat/completions` (as respostas podem chegar em `reasoning`) |
| 🔒 Seus dados | apenas `seekai.cc` e seu backend de caixa de correio são contatados |

## 🐞 Problemas

Se o SeekAI alterar seu formulário de cadastro, sua site key do Turnstile (`0x4AAAAAAEcpuQE_WXc4ZfG8`), a recompensa de check-in ou o catálogo de modelos, a ferramenta para ali e avisa. **[Abra uma issue](../../issues)** com o comando e a saída exata.

## 📄 Licença

MIT © 2026 — veja [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 seekai-bulk-apikey contributors

</div>