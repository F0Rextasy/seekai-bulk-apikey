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

**Crie contas em massa no [SeekAI](https://seekai.cc) com chaves de API geradas automaticamente — um crédito de check-in de $20 por conta por dia — inferência compatível com OpenAI + conector [9Router](https://9router.com).**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-1%20verified-412991?style=for-the-badge)](https://seekai.cc)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)

[🛠 Início rápido](#-quick-start) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Como funciona](#-how-it-works) · [🤖 Modelos e plano gratuito](#-models--free-tier) · [⚙️ Opções](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🔌 9Router](#-connect-to-9router) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por que isso existe

O SeekAI roda um painel New API em `seekai.cc`. Seu crédito de boas-vindas é um erro de arredondamento (cota `1`); o plano gratuito real é o **签到 (check-in) diário: 10.000.000 de cota = $20 por conta, uma vez por dia do painel**. O cadastro é um formulário comum de e-mail + senha — sem OAuth, sem telefone, sem cartão — mas cada etapa protegida (solicitação de código + registro, login e o próprio check-in) carrega um **Cloudflare Turnstile**, e esse widget só é gerado em um **Chrome com interface gráfica** neste painel. Esta ferramenta controla um Chrome real via CDP (zero dependências), testa a saída antes de gastar uma conta nela, gera a chave, resgata o crédito do dia e mantém apenas as chaves que responderam a uma conclusão real.

## 🤖 Modelos e plano gratuito

| ID do modelo | observação |
| --- | --- |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | o único id verificado em todas as chaves (18/18 em 2026-10-21); responde como uma rota de raciocínio |

`GET /v1/models` retornou **29 ids** para essas contas; ids com sufixo `:free` são rejeitados com `401 API key is disabled`, então o gate usa o id acima e recorre ao que a conta conseguir chamar.

**A armadilha do raciocínio:** este relay coloca a resposta em `message.reasoning` e deixa `message.content` **vazio**. Um gate que lê apenas `content` marca chaves ativas como mortas — esta ferramenta aceita `content || reasoning_content || reasoning` e informa qual deles carregou o texto.

| O que o plano gratuito oferece | Valor |
| --- | --- |
| Check-in diário | **10.000.000 de cota = $20 por conta, uma vez por dia do painel** (`quota_per_unit 500000`) |
| Segunda chamada no mesmo dia | `今日已签到` (idempotente — conta como saudável) |
| Dia do painel | **UTC+8** — vira às 16:00 UTC |
| Execução medida (2026-10-21) | **12 de 38 contas fizeram check-in → +120.000.000 de cota = $240 em uma passada** |
| Limite de taxa | ~**5 requisições/min por IP** (`您已达到总请求数限制`) → as chamadas são espaçadas em ≥14 s |
| Cartão / telefone | nenhum, em nenhum ponto do fluxo |

Comportamento do limite de taxa, medido: `200 200 200 200 200` e depois `429` se o espaçamento for ignorado; `already-checked-in` responde `200 {"success":false,"message":"今日已签到"}`.

## 🛠 Início rápido

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

`keys.txt` só é escrito após `GET /v1/models` **e** uma conclusão real; `accounts.json` mantém o estado da conta (nome de usuário, senha, e-mail, chave, crédito de check-in).

### 🖱️ O launcher

`node src/launcher.js` imprime o logotipo acima e oferece um menu numerado: **mint** (N contas, serial), **verify** (`keys.txt`), **screen** (lista de saídas), **settings** (arquivo de proxy, modelo, contagem — mantidos em `launcher.config.json`), **connect to 9Router**, ajuda e sair. Cada item é um wrapper fino sobre os mesmos flags de `src/cli.js`.

## ✅ Verificado e funcionando — toda chave é testada

Todas as verificações foram executadas em **2026-10-21** a partir desta ferramenta.

| Verificação | Resultado |
| --- | --- |
| `--screen` (triagem HTTP da saída) | a página de login renderiza + `challenges.cloudflare.com/turnstile/v0/api.js` responde **200** + o host da API responde |
| triagem da saída dentro do fluxo | uma linha cujo widget nunca é gerado é recusada **antes** de gastar uma caixa de correio |
| cadastro | `POST /api/user/register?turnstile=` → **200** após o código enviado por e-mail |
| geração de chave | `POST /api/token/` → list → `POST /api/token/<id>/key` → **200**, chave de 48 caracteres |
| check-in diário | `POST /api/user/checkin?turnstile=` → **`quota_awarded: 10000000`**; 12 contas em uma execução = **$240** |
| chat por chave | **18 / 18 chaves 200** em `deepseek-ai/DeepSeek-V4-Flash-0731` (texto em `reasoning`) |
| uma chave que falha na verificação | nunca é escrita em `keys.txt` |

Reveja a qualquer momento:

```bash
node src/cli.js --verify-only            # every key in keys.txt through the live gate
curl https://seekai.cc/v1/chat/completions \
  -H "Authorization: Bearer <48-char-key>" -H "Content-Type: application/json" \
  -d '{"model":"deepseek-ai/DeepSeek-V4-Flash-0731","messages":[{"role":"user","content":"Reply with one short sentence: what is 2+2?"}],"max_tokens":64}'
```

## 🧭 Como funciona

| Etapa | Chamada | Observações |
| --- | --- | --- |
| triagem | `/sign-in` no Chrome | o widget do painel precisa montar **e gerar**; uma linha que carrega a página mas nunca responde não consegue registrar |
| caixa de correio | caixa gmail do Emailnator | os endereços são reciclados, então apenas e-mails de `seekai` são aceitos |
| cadastro | `GET /api/verification?email=&turnstile=` | **um token cobre a solicitação de código e a chamada de registro** |
| registro | `POST /api/user/register?turnstile=` | nome de usuário, senha, e-mail, verification_code |
| login | `POST /api/user/login?turnstile=` | seu próprio token → `data.access_token` |
| chave | `POST /api/token/` → list → `/api/token/<id>/key` | sem captcha nessas rotas; a lista mostra apenas uma máscara |
| check-in | `POST /api/user/checkin?turnstile=` | seu próprio token → `quota_awarded: 10000000` |
| gate | `GET /v1/models` + uma conclusão | **200 com `content` ou `reasoning`** → a chave é escrita |

Os tokens do Turnstile aqui são **de uso único e vinculados ao documento**; um token produzido em outro contexto responde `Turnstile 校验失败`. **O Chrome headless não funciona neste painel** — medido: `--headless=new` e `--headless=old` deixam o widget vazio por 60 s, enquanto uma janela com interface gráfica (visível ou fora da tela) responde em 2-4 s. `--headless` existe apenas como diagnóstico.

## ⚙️ Opções da CLI

| Flag | Padrão | Significado |
| --- | --- | --- |
| `--count N` | `1` | contas a criar, serial |
| `--model <id>` | `deepseek-ai/DeepSeek-V4-Flash-0731` | modelo usado para o gate ao vivo |
| `--pool <file>` | `proxies.txt` | lista de saídas, uma linha por proxy — opcional |
| `--tries N` | `3` | saídas candidatas testadas por conta |
| `--mint-tries N` | `2` | tentativas completas de cadastro (nova caixa de correio + Chrome) por saída |
| `--gap MS` | `20000` | pausa entre contas |
| `--panel-gap MS` | `14000` | pausa entre as chamadas de API deste painel |
| `--code-timeout S` | `240` | segundos para esperar o código por e-mail |
| `--keys <file>` | `keys.txt` | arquivo de chaves para `--verify-only` / `--connect-9router` |
| `--headless` | desligado | apenas diagnóstico — o Turnstile não será gerado |
| `--browser <exe>` | auto | binário do Chrome (env `CHROME_PATH`) |
| `--debug-port N` | auto | porta do Chrome DevTools |
| `--verify-only` · `--screen` · `--connect-9router` · `--help` | | modos |

## 🛰️ Atrás de um proxy

- **Com um pool:** `--pool <file>` (ou a env `SEEKAI_PROXIES`). Toda requisição — incluindo o navegador Chrome — passa por uma saída, fail-closed: os candidatos são avaliados primeiro (a página de login renderiza + script do Turnstile 200) e a execução permanece fixada nessa saída durante toda a conta.
- **Sem um pool:** a ferramenta se conecta diretamente e imprime `running WITHOUT a proxy (direct)`. Nada mais muda.
- **A qualidade da saída decide o sucesso aqui.** Em 2026-10-21, um pool bruto produziu majoritariamente `no login form` / `no turnstile token`; de 26 candidatos, apenas **8** conseguiram executar o trilho. Faça a triagem primeiro, depois crie.
- Linhas SOCKS5 com nome de usuário/senha são ignoradas (o Chrome não consegue autenticar nelas); proxies HTTP com credenciais são tratados através do domínio Fetch.

## 📄 Arquivos

| Caminho | Conteúdo |
| --- | --- |
| `keys.txt` | uma chave verificada ao vivo por linha — ignorada pelo git |
| `accounts.json` | nome de usuário / senha / e-mail / chave / estado do check-in — ignorado pelo git |
| `proxies.txt` | suas saídas — ignorado pelo git |
| `out/` | log de execução, capturas de tela de falhas, `attempts.jsonl` — ignorado pelo git |

## 🔌 Conectar ao 9Router

```bash
node src/cli.js --connect-9router                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-9router --9router-base http://localhost:20128 --9router-password 123456
```

Padrões: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Os modelos são servidos como `seekai/<model id>`.

## 🔌 Conectar ao OmniRoute

```bash
node src/cli.js --connect-omniroute                 # defaults: http://localhost:20128, password 123456
node src/cli.js --connect-omniroute --omniroute-base http://localhost:20128 --omniroute-password 123456
```

Padrões: `--prefix seekai`, `--base-url https://seekai.cc/v1`, `--model deepseek-ai/DeepSeek-V4-Flash-0731`. Os modelos são servidos como `seekai/<model id>`.
## 🐞 Problemas

Se o SeekAI alterar seu formulário de cadastro, sua site key do Turnstile (`0x4AAAAAAEcpuQE_WXc4ZfG8`), a recompensa do check-in ou o catálogo de modelos, a ferramenta para ali e avisa. **[Abra uma issue](../../issues)** com o comando e a saída exata.

## 📄 Licença

[MIT](LICENSE) © seekai-bulk-apikey contributors

---

## ⚠️ Risco de conta e como minimizar
