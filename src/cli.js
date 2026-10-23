#!/usr/bin/env node
'use strict';

/**
 * seekai-bulk-apikey CLI — mint seekai.cc (SeekAI) accounts, one API key each,
 * claim the daily check-in credit, and keep only the keys that answered a chat
 * call. Zero dependencies, Node >= 18, proxy OPTIONAL (direct by default).
 *
 * Why a real browser: this panel gates sign-up, sign-in AND the daily 签到
 * (check-in) behind a Cloudflare Turnstile whose widget only mints in a real,
 * headed Chrome — measured on the panel itself: `--headless=new` and
 * `--headless=old` leave the widget empty for 60 s, headed (visible or
 * off-screen) answers in 2-4 s. The tool therefore drives Chrome over CDP with
 * a tiny built-in WebSocket client, and it screens the exit first (step 1).
 *
 * Flow, per account:
 *   1. screen exit the sign-in page must render AND the widget must mint a
 *                  token; a line that loads the page but never answers cannot
 *                  register, so it is skipped before a mailbox is spent
 *   2. mailbox     Emailnator gmail box (recycled: only seekai mail counts)
 *   3. sign-up     username + password + e-mail, then `GET /api/verification`
 *                  with a fresh token; the code arrives by mail
 *   4. register    `POST /api/user/register` (same token), then login with a
 *                  second token -> access_token
 *   5. key         `POST /api/token/` (Bearer, no captcha) -> list -> reveal
 *                  (`POST /api/token/<id>/key`; the list only shows a mask)
 *   6. check-in    `POST /api/user/checkin` with a third token -> $20/day
 *   7. gate        `GET /v1/models` + a real completion through the same exit.
 *                  The reply may live in `content` OR `reasoning`: this relay
 *                  answers reasoning routes with an empty content, so both count
 *                  (`content || reasoning_content || reasoning`).
 *
 * Options:
 *   --count N        accounts (= keys) to mint, serial                     [1]
 *   --model <id>     model used for the live gate  [deepseek-ai/DeepSeek-V4-Flash-0731]
 *   --pool <file>    proxy list, one exit per line (env SEEKAI_PROXIES)  [optional]
 *   --tries N        exit candidates screened per account                  [3]
 *   --mint-tries N   full sign-up attempts (fresh mailbox + Chrome) per exit  [2]
 *   --gap MS         pause between accounts                              [20000]
 *   --panel-gap MS   pause between this panel's API calls (5 req/min)    [14000]
 *   --timeout MS     per-request timeout (node side)                     [60000]
 *   --code-timeout S seconds to wait for the e-mail code                   [240]
 *   --keys <file>    key file for --verify-only / --connect-9router  [keys.txt]
 *   --screen         only screen the exit list (page + widget + token)
 *   --verify-only    re-run every key in the key file through the chat gate
 *   --connect-9router  register this provider (and its keys) on a local 9Router
 *   --headless       run Chrome headless — DIAGNOSTIC ONLY: the widget will not
 *                    mint on this panel, so every account fails at the token
 *   --browser <exe>  Chrome binary (env CHROME_PATH)                     [auto]
 *   --debug-port N   Chrome DevTools port — a free nonzero one by default
 *   --help
 *
 * Your proxy list is OPTIONAL: pass --pool (or SEEKAI_PROXIES) and every
 * request — the browser included — goes through an exit from it, fail-closed;
 * without a pool the tool connects DIRECTLY.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');
const http = require('http');
const crypto = require('crypto');
const { launchChrome, Page, pageHelper, widgetToken, ensureHelper, WsClient, CDP, solveCaptcha, sleep, withTimeout } = require('./solver.js');

const IS_SRC = path.basename(__dirname) === 'src';
const ROOT = IS_SRC ? path.resolve(__dirname, '..') : __dirname;
const KEYS_FILE = path.join(ROOT, 'keys.txt');
const ACCOUNTS_FILE = path.join(ROOT, 'accounts.json');
const OUT_DIR = path.join(ROOT, 'out');
/** Dead keys leave keys.txt and are parked here — repo root, like keys.txt. */
const KEYS_DEAD_FILE = path.join(ROOT, 'keys-dead.txt');

const SITE = 'https://seekai.cc';
const BASE = 'https://seekai.cc';
const API = `${BASE}/v1`;
const EMAILNATOR = 'https://www.emailnator.com';
const DEFAULT_MODEL = 'deepseek-ai/DeepSeek-V4-Flash-0731';
/** Panel accounting: 500000 quota = $1, so one daily check-in (10,000,000) = $20. */
const QUOTA_PER_UNIT = 500000;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

// ------------------------------------------------------------------- options
const argv = process.argv.slice(2);
function arg(name, dflt) {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return dflt;
}
const has = (name) => argv.includes(`--${name}`) || argv.includes(`-${name}`);

if (has('help') || has('h')) {
  console.log(`seekai-bulk-apikey — mint SeekAI (seekai.cc) accounts, one key each, verified by a live chat call.

  node src/cli.js --count N          mint N accounts — sign-up + daily $20 check-in in a real Chrome
  node src/cli.js --verify-only      re-check every key in keys.txt
  node src/cli.js --screen           screen the exit list (page + widget + token)
  node src/cli.js --connect-9router  register the provider + its keys on a local 9Router
  node src/cli.js --help

  --count N      accounts to mint, serial                                [1]
  --model <id>   model used for the live gate   [deepseek-ai/DeepSeek-V4-Flash-0731]
  --pool <file>  proxy list, one exit per line (env SEEKAI_PROXIES)    [optional]
  --tries N      exit candidates screened per account                    [3]
  --code-timeout S   seconds to wait for the e-mail code                [240]
  --mint-tries N full sign-up attempts (fresh mailbox each) per exit      [2]
  --keys <file>  key file for --verify-only                [keys.txt]
  --headless     DIAGNOSTIC ONLY — Turnstile will not mint, every mint fails
  --debug-port N Chrome DevTools port — a free nonzero one picked by default
  --auto         solve the captcha in-page automatically (DEFAULT ON — nothing to pass)
  --dry          print the resolved plan and exit — no files written, no network

Sign-up, sign-in and the daily check-in each carry a Cloudflare Turnstile token,
and the widget only mints in a headed Chrome on this panel, so the tool drives a
real browser instead of calling the endpoints directly. Every exit is screened
for that ability before an account is spent on it.

Free tier: one check-in per account per panel day = 10,000,000 quota = $20.

Requests go through the exits in your proxy list when one is provided (--pool or
the SEEKAI_PROXIES env). Without a pool the tool connects DIRECTLY.
`);
  process.exit(0);
}

const COUNT = Math.max(1, parseInt(arg('count', '1'), 10) || 1);
const MODEL = arg('model', process.env.SEEKAI_MODEL || DEFAULT_MODEL);
const TRIES = Math.max(1, parseInt(arg('tries', '3'), 10) || 3);
const GAP_MS = Math.max(0, parseInt(arg('gap', '20000'), 10) || 0);
const TIMEOUT_MS = Math.max(5000, parseInt(arg('timeout', '60000'), 10) || 60000);
const CODE_TIMEOUT_MS = Math.max(30000, (parseInt(arg('code-timeout', '240'), 10) || 240) * 1000);
const MINT_TRIES = Math.max(1, parseInt(arg('mint-tries', '2'), 10) || 2);
/** The chat gate must fail fast: a hung exit costs this per candidate model. */
const GATE_MS = Math.max(15000, Math.min(TIMEOUT_MS, 45000));
/** The panel throttles the whole IP to ~5 requests/min — space its API calls. */
const PANEL_GAP_MS = Math.max(0, parseInt(arg('panel-gap', '14000'), 10) || 14000);
const CHROME_BIN = arg('browser', process.env.CHROME_PATH || '');
const DEBUG_PORT = parseInt(arg('debug-port', '0'), 10) || 0; // 0 = auto-pick a free, nonzero port
const HEADLESS = has('headless');
const VERIFY_ONLY = has('verify-only');
const SCREEN = has('screen');
const CONNECT_9ROUTER = has('connect-9router');
const DRY = has('dry');
const KEYS_ARG = arg('keys', KEYS_FILE);
const KEYS_PATH = path.isAbsolute(KEYS_ARG) ? KEYS_ARG : fs.existsSync(KEYS_ARG) ? path.resolve(KEYS_ARG) : path.resolve(ROOT, KEYS_ARG);

if (!DRY) fs.mkdirSync(OUT_DIR, { recursive: true });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const rand = (n) => crypto.randomBytes(32).toString('hex').slice(0, n);

// ------------------------------------------------------- fail-class ledger
/** One line per failure: {ts, account, exit, class, stage, detail} in out/attempts.jsonl. */
function ledger(rec) {
  try {
    fs.appendFileSync(path.join(OUT_DIR, 'attempts.jsonl'), JSON.stringify({ ts: new Date().toISOString(), ...rec }) + '\n');
  } catch (e) { /* diagnostics must never break the run */ }
}
function classify(e) {
  const m = String((e && e.message) || e || '');
  if (/already|exists|in use/i.test(m)) return 'account-exists';
  if (/no verification code|code arrived/i.test(m)) return 'mail';
  if (/cannot mint a turnstile token|cannot mint/i.test(m)) return 'exit-screen';
  if (/verification rejected|register failed|form never rendered/i.test(m)) return 'register';
  if (/login failed|no token for login/i.test(m)) return 'login';
  if (/token row|key reveal|no key/i.test(m)) return 'token';
  if (/chat gate|no model answered/i.test(m)) return 'chat-gate';
  if (/chrome|websocket|DevTools/i.test(m)) return 'browser';
  if (/proxy|connect|timeout|socket|ECONN|EPIPE|reset|TLS/i.test(m)) return 'exit';
  return 'other';
}

// ------------------------------------------------------------------- proxy
function parseProxy(line) {
  const s = String(line || '').trim();
  if (!s || s.startsWith('#') || s.startsWith('//')) return null;
  let m = s.match(/^(https?|socks5h?|socks4a?):\/\/(?:([^:@/]+):([^@/]+)@)?([^:/]+):(\d+)/i);
  if (!m) m = s.match(/^(?:([^:@/]+):([^@/]+)@)?([^:/]+):(\d+)$/);
  if (!m) return null;
  if (m.length === 6) {
    const raw = m[1].toLowerCase();
    if (raw === 'socks4' || raw === 'socks4a') return null; // not supported by this client
    const protocol = raw.startsWith('socks') ? 'socks5' : 'http';
    return { protocol, host: m[4], port: Number(m[5]), username: m[2] || undefined, password: m[3] || undefined, line: s };
  }
  return { protocol: 'http', host: m[3], port: Number(m[4]), username: m[1] || undefined, password: m[2] || undefined, line: s };
}
const labelOf = (p) => (p ? `${p.protocol}://${p.host}:${p.port}` : '(direct)');

/** A raw socket straight to host:port — direct-mode twin of connectThrough. */
function directConnect(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host, port });
    const t = setTimeout(() => { sock.destroy(); reject(new Error(`connect timeout (${host}:${port})`)); }, timeoutMs);
    sock.once('error', (e) => { clearTimeout(t); try { sock.destroy(); } catch {} reject(new Error(`connect failed: ${e.message}`)); });
    sock.once('connect', () => { clearTimeout(t); resolve(sock); });
  });
}

function connectThrough(proxy, host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host: proxy.host, port: proxy.port });
    const t = setTimeout(() => { sock.destroy(); reject(new Error(`proxy timeout (${proxy.host}:${proxy.port})`)); }, timeoutMs);
    const done = (err, s) => { clearTimeout(t); if (err) { try { sock.destroy(); } catch {} reject(err); } else resolve(s); };
    sock.once('error', (e) => done(new Error(`proxy connect failed: ${e.message}`)));
    sock.once('connect', () => {
      if (proxy.protocol === 'socks5') {
        sock.write(proxy.username ? Buffer.from([5, 2, 0, 2]) : Buffer.from([5, 1, 0]));
        let stage = 0;
        let buf = Buffer.alloc(0);
        const sendConnect = () => {
          const hb = Buffer.from(host);
          sock.write(Buffer.concat([Buffer.from([5, 1, 0, 3, hb.length]), hb, Buffer.from([port >> 8, port & 0xff])]));
        };
        const onData = (d) => {
          try {
            buf = Buffer.concat([buf, d]);
            for (;;) {
              if (stage === 0) {
                if (buf.length < 2) return;
                const v = buf; buf = buf.slice(2);
                if (v[0] !== 5) return done(new Error('SOCKS5 bad version'));
                if (v[1] === 2) {
                  if (!proxy.username) return done(new Error('SOCKS5 auth required'));
                  const u = Buffer.from(proxy.username || '');
                  const p = Buffer.from(proxy.password || '');
                  sock.write(Buffer.concat([Buffer.from([1, u.length]), u, Buffer.from([p.length]), p]));
                  stage = 1;
                  continue;
                }
                if (v[1] !== 0) return done(new Error('SOCKS5 no acceptable method'));
                stage = 2; sendConnect(); continue;
              }
              if (stage === 1) {
                if (buf.length < 2) return;
                const v = buf; buf = buf.slice(2);
                if (v[1] !== 0) return done(new Error('SOCKS5 auth failed'));
                stage = 2; sendConnect(); continue;
              }
              if (stage === 2) {
                if (buf.length < 5) return;
                const atyp = buf[3];
                const need = 4 + (atyp === 1 ? 4 : atyp === 3 ? 1 + buf[4] : 16) + 2;
                if (buf.length < need) return;
                const rep = buf[1]; buf = buf.slice(need);
                if (rep !== 0) return done(new Error(`SOCKS5 connect failed (code ${rep})`));
                sock.off('data', onData);
                return done(null, sock);
              }
            }
          } catch (e) { done(e); }
        };
        sock.on('data', onData);
        return;
      }
      const auth = proxy.username ? `Proxy-Authorization: Basic ${Buffer.from(`${proxy.username}:${proxy.password || ''}`).toString('base64')}\r\n` : '';
      sock.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n${auth}\r\n`);
      let buf = '';
      const onData = (d) => {
        buf += d;
        if (!buf.includes('\r\n\r\n')) return;
        sock.off('data', onData);
        if (!/^HTTP\/\d(\.\d)? 200/.test(buf)) return done(new Error(`proxy CONNECT refused: ${buf.split('\r\n')[0]}`));
        done(null, sock);
      };
      sock.on('data', onData);
    });
  });
}

/** One HTTPS request through one exit (or direct). Redirects are followed on demand. */
async function exitFetch(proxy, url, { method = 'GET', headers = {}, body = null, timeoutMs = TIMEOUT_MS, redirects = 0 } = {}) {
  let current = url;
  for (let hop = 0; ; hop++) {
    const u = new URL(current);
    const raw = proxy ? await connectThrough(proxy, u.hostname, u.port || 443, Math.min(timeoutMs, 20000)) : await directConnect(u.hostname, u.port || 443, Math.min(timeoutMs, 20000));
    const sock = tls.connect({ socket: raw, servername: u.hostname });
    try {
      await withTimeout(
        new Promise((res, rej) => { sock.once('secureConnect', res); sock.once('error', rej); }),
        timeoutMs,
        `TLS handshake timeout (${u.hostname})`
      );
      const payload = body == null ? null : Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
      const r = await withTimeout(
        new Promise((resolve, reject) => {
          const req = http.request(
            {
              method,
              path: u.pathname + u.search,
              createConnection: () => sock,
              headers: {
                host: u.host,
                'user-agent': UA,
                accept: '*/*',
                connection: 'close',
                ...(payload ? { 'content-type': 'application/json', 'content-length': payload.length } : {}),
                ...headers,
              },
            },
            (res) => {
              const chunks = [];
              res.on('data', (c) => chunks.push(c));
              res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
            }
          );
          req.on('error', reject);
          if (payload) req.write(payload);
          req.end();
        }),
        timeoutMs,
        'request timeout'
      );
      try { sock.destroy(); } catch {}
      const loc = r.headers.location;
      if ([301, 302, 303, 307, 308].includes(r.status) && loc && hop < redirects) {
        const next = new URL(loc, current).toString();
        if (!next.startsWith('https://')) return { ...r, url: current };
        current = next;
        continue;
      }
      return { ...r, url: current };
    } catch (e) {
      try { sock.destroy(); } catch {}
      throw e;
    }
  }
}

async function exitJson(proxy, url, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (opts.body != null && !Buffer.isBuffer(opts.body)) headers['content-type'] = headers['content-type'] || 'application/json';
  const r = await exitFetch(proxy, url, { ...opts, headers });
  let json = null;
  try { json = JSON.parse(r.body); } catch { /* not json */ }
  return { status: r.status, json, text: r.body, headers: r.headers };
}

// ------------------------------------------------------------------- pool
function loadExits() {
  const poolArg = arg('pool', process.env.SEEKAI_PROXIES || 'proxies.txt');
  const poolFile = fs.existsSync(poolArg) ? path.resolve(poolArg) : path.resolve(ROOT, poolArg);
  if (!fs.existsSync(poolFile)) {
    // No pool = DIRECT mode: the tool works without a proxy too.
    console.log(`no proxy list at ${poolFile} — running WITHOUT a proxy (direct).`);
    return [null];
  }
  const lines = fs.readFileSync(poolFile, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const exits = [];
  let skipped = 0;
  for (const line of lines) {
    const p = parseProxy(line);
    if (!p) { skipped++; continue; }
    // Chrome cannot authenticate to a SOCKS5 proxy; such lines are unusable in
    // the browser rail and are dropped here (fail-closed, never silently direct).
    if (p.protocol === 'socks5' && p.username) { skipped++; continue; }
    exits.push(p);
  }
  if (skipped) console.log(`pool: ${skipped} line(s) skipped (unparsable or socks5-with-auth — Chrome cannot use those)`);
  if (!exits.length) throw new Error(`${poolFile} has no usable exits`);
  return exits;
}

/**
 * Exit vet. The HTTP half only proves the page and the API are reachable; the
 * half that decides whether an exit can be *used* — does the Turnstile widget
 * mount and mint inside Chrome — can only be answered by a browser, so the mint
 * screens every exit again at `stage = 'screen'` before spending a mailbox.
 */
async function vetExit(exit) {
  const t0 = Date.now();
  const su = await exitFetch(exit, `${SITE}/sign-in`, { timeoutMs: 25000, redirects: 3 });
  if (su.status !== 200) return { ok: false, why: `sign-in ${su.status}` };
  // 2026-10-22: the panel now serves a client-rendered SPA shell — accept it (the Chrome screen at mint is the real gate).
  const spa = /id=["']root["']/.test(su.body || '') && /\/static\/js\//.test(su.body || '');
  if (!/password|sign in|登录/i.test(su.body || '') && !spa) return { ok: false, why: 'sign-in did not render' };
  let script = { status: 0 };
  try {
    // 2026-10-22: CF 302s the bare api.js to a versioned path — follow it.
    script = await exitFetch(exit, 'https://challenges.cloudflare.com/turnstile/v0/api.js', { timeoutMs: 25000, redirects: 3 });
  } catch (e) {
    return { ok: false, why: `turnstile script unreachable: ${String(e.message).slice(0, 50)}` };
  }
  if (script.status !== 200) return { ok: false, why: `turnstile script ${script.status}` };
  let api = { status: 0 };
  try {
    api = await exitFetch(exit, `${API}/models`, { timeoutMs: 25000 });
  } catch (e) {
    return { ok: false, why: `api unreachable: ${String(e.message).slice(0, 60)}` };
  }
  // No key here, so 401/403/404 all prove reachability; only a network failure is fatal.
  return { ok: true, ms: Date.now() - t0, api: api.status, signupBytes: su.body.length };
}

async function screen(exits) {
  let ok = 0;
  for (const e of exits) {
    try {
      const v = await vetExit(e);
      if (v.ok) ok++;
      console.log(`  ${v.ok ? '✔' : '✘'} ${labelOf(e)} ${v.ok ? `ok ${v.ms}ms (api ${v.api})` : v.why}`);
    } catch (err) {
      console.log(`  ✘ ${labelOf(e)} ${String(err.message).slice(0, 90)}`);
    }
  }
  console.log(`screened ${exits.length} exit(s): ${ok} pass the HTTP screen (sign-in + turnstile script + api)`);
  console.log(`note: the browser half is decided during minting — the flow refuses to register on an exit whose widget never mints (stage "screen")`);
  return ok;
}

// ------------------------------------------------------------------- mail
const emailnator = {
  headers: { origin: EMAILNATOR, referer: `${EMAILNATOR}/` },
  async json(exit, p, opts = {}) {
    return exitJson(exit, `${EMAILNATOR}${p}`, { ...opts, headers: { ...this.headers, ...(opts.headers || {}) } });
  },
};

async function newMailbox(exit) {
  const r = await emailnator.json(exit, '/api/generate-email', { method: 'POST', body: { ids: [3] } });
  const dotted = r.json && r.json.email;
  if (!dotted || !/@gmail\.com$/i.test(dotted)) throw new Error(`emailnator generate ${r.status}: ${String(r.text).slice(0, 120)}`);
  const [local, domain] = dotted.split('@');
  return { provider: 'emailnator', dotted, address: `${local.replace(/\./g, '')}@${domain}` };
}

const inboxList = async (exit, box) => {
  const r = await emailnator.json(exit, '/api/message-list', { method: 'POST', body: { email: box.address, limit: 20 } });
  return (r.json && r.json.messages) || [];
};

/**
 * A fresh Emailnator box. The rail recycles addresses: a box whose inbox is
 * nothing but the provider's own "Upgrade to Premium" wall never indexes new
 * mail, so it is dropped and another one is asked for.
 */
async function pickMailbox(exit, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const box = await newMailbox(exit);
    const msgs = await inboxList(exit, box).catch(() => []);
    const wall = msgs.filter((m) => /locked sender|upgrade to premium/i.test(`${m.from || ''} ${m.subject || ''}`));
    if (!msgs.length || wall.length < msgs.length) return box;
    log(`  mailbox ${box.address} is an expired box (${msgs.length} locked messages) — asking for another`);
  }
  throw new Error('every mailbox the rail offered was an expired/locked box');
}
const inboxRead = async (exit, box, id) => (await emailnator.json(exit, `/api/message/${encodeURIComponent(id)}`)).json || {};
/** Message ids already in the (recycled) box before this run — never accepted. */
async function baseline(exit, box) {
  try {
    return new Set((await inboxList(exit, box)).map((m) => String(m.id)));
  } catch (e) {
    return new Set();
  }
}

/**
 * A recycled gmail box is full of other panels' mail — lamp spam, SHEIN ads,
 * other panels' codes. Only the panel's own sender is accepted, so a stray
 * 6-digit number can never be typed into a foreign form.
 */
const isBrandMail = (from, subject) => /seekai/i.test(`${from} ${subject}`);

function extractCode(blobRaw) {
  const blob = String(blobRaw)
    .replace(/<[^>]+>/g, ' ')
    .replace(/#[0-9a-fA-F]{3,8}\b/g, ' ') // HTML templates carry #000000 hex colors
    .replace(/&nbsp;|&amp;/g, ' ');
  const near = [
    /(?:验证码|verification code|your code)[^0-9a-z]{0,24}([0-9a-z]{4,8})\b/i,
    /([0-9a-f]{6})\s*(?:is your|as your)/i,
  ];
  for (const re of near) {
    const m = re.exec(blob);
    if (m) return m[1].toLowerCase();
  }
  const six = /\b([0-9a-f]{6})\b/i.exec(blob);
  return six ? six[1].toLowerCase() : null;
}

/** Every not-yet-tried brand code currently in the box, newest first. */
async function collectCodes(exit, box, skip, tried) {
  const out = [];
  let messages = [];
  try { messages = await inboxList(exit, box); } catch (e) { return out; }
  for (const m of messages) {
    const id = String(m.id);
    const from = String(m.from || '');
    const subject = String(m.subject || '');
    if (skip.has(id) || !isBrandMail(from, subject)) continue;
    let text = `${subject}\n${m.content || ''}`;
    if (!m.content) {
      const full = await inboxRead(exit, box, id).catch(() => null);
      if (full) text = `${subject}\n${full.content || full.html || full.text || ''}`;
    }
    const code = extractCode(text);
    if (code && !tried.has(code)) out.push({ code, id, subject: subject.slice(0, 80), from: from.slice(0, 80) });
  }
  return out;
}

/** Waits for the panel's own code mail; returns candidates in arrival order. */
async function waitForCode(exit, box, skip, tried, { timeoutMs = Math.min(CODE_TIMEOUT_MS, 150000), pollMs = 5000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const cands = await collectCodes(exit, box, skip, tried);
    if (cands.length) return cands;
    if (Date.now() > deadline) throw new Error('no verification code arrived in the window');
    await sleep(pollMs);
  }
}

// ------------------------------------------------------------ account flow
async function mintOnExit(n, exit) {
  const started = Date.now();
  const box = await pickMailbox(exit);
  log(`account ${n}: mailbox ${box.address}`);

  const chrome = await launchChrome(exit);
  const page = new Page(chrome.cdp, chrome.sessionId);
  let ua = null;
  let stage = 'browser';
  try {
    const inPage = (p, opts) => page.eval(`window.__sk.fetchJson(${JSON.stringify(p)}, ${JSON.stringify(opts || {})})`, { awaitPromise: true, timeoutMs: 90000 });
    const panelGap = () => (PANEL_GAP_MS ? sleep(PANEL_GAP_MS) : Promise.resolve());
    const username = `skl${rand(6)}`;
    const password = `Sk${rand(10)}!7a`;

    log(`account ${n}: goto ${SITE}/sign-up via ${labelOf(exit)}`);
    await page.goto(`${SITE}/sign-up`);
    await sleep(8000);
    ua = await page.eval('navigator.userAgent');
    for (let i = 0; i < 20; i++) {
      const ready = await page.eval(`!!(document.querySelector('input[type=password]') && (document.querySelector('input[type=email]') || document.querySelector('input[name=email]')))`).catch(() => false);
      if (ready) break;
      await sleep(1500);
    }
    if (!(await ensureHelper(page))) throw new Error('page helper could not be installed on /sign-up');
    await page.shoot('01-signup');

    // Step 1 of the flow is the exit screen: the widget has to mount AND mint
    // before an account is spent — a line that loads the page but never answers
    // cannot register (measured: exactly what parked this panel on 2026-10-14).
    stage = 'screen';
    const screenTok = await widgetToken(page, 'screen', { timeoutMs: 45000, note: log });
    if (!screenTok) throw Object.assign(new Error('exit cannot mint a turnstile token'), { exitShaped: true });
    log(`  exit screen ok — token len=${screenTok.length}`);
    await panelGap();

    stage = 'form';
    const set = (sel, val) => page.eval(`window.__sk.set(${JSON.stringify(sel)}, ${JSON.stringify(val)})`).catch(() => false);
    const f = {};
    f.user = await set('input[autocomplete=username], input#username, input[name=username], input[type=text]', username);
    f.pass = await set('input[autocomplete=new-password], input[type=password]', password);
    f.confirm = await page.eval(
      `(() => { const ps = [...document.querySelectorAll('input[type=password]')]; const el = ps[ps.length - 1]; if (!el) return false; const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value'); el.focus(); d.set.call(el, ${JSON.stringify(password)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.blur(); return true; })()`
    ).catch(() => false);
    f.email = await set('input[type=email], input[name=email]', box.address);
    let terms = false;
    for (let i = 0; i < 6 && !terms; i++) {
      terms = await page.eval(`window.__sk.checkTerms()`).catch(() => false);
      if (!terms) await sleep(500);
    }
    log(`  form: ${JSON.stringify(f)} terms=${terms}`);
    if (!f.user || !f.email) throw new Error('sign-up form never rendered (username/e-mail fields not found)');
    await page.shoot('02-filled');

    // The code request and the register call share ONE token (panel contract), so
    // the screen token is spent here instead of a fresh one.
    stage = 'code';
    const skip = await baseline(exit, box);
    const v = await inPage(`/api/verification?email=${encodeURIComponent(box.address)}&turnstile=${encodeURIComponent(screenTok)}`);
    log(`  verification -> ${v.status} ${String(v.text).slice(0, 120)}`);
    if (!v.json || v.json.success === false) throw new Error(`verification rejected: ${String(v.text).slice(0, 120)}`);
    const hit = (await waitForCode(exit, box, skip, new Set()))[0];
    if (!hit) throw new Error('no verification code arrived');
    log(`  code ${hit.code} «${hit.subject}» from ${hit.from}`);
    await panelGap();

    stage = 'register';
    const reg = await inPage(`/api/user/register?turnstile=${encodeURIComponent(screenTok)}`, {
      method: 'POST',
      body: { username, password, email: box.address, verification_code: hit.code, aff_code: '', turnstile: screenTok },
    });
    log(`  register -> ${reg.status} ${String(reg.text).slice(0, 160)}`);
    if (!reg.json || reg.json.success === false) throw new Error(`register failed: ${String(reg.text).slice(0, 160)}`);
    await panelGap();

    stage = 'login';
    const loginTok = await widgetToken(page, 'login', { timeoutMs: 60000, note: log });
    if (!loginTok) throw new Error('no token for login');
    const lg = await inPage(`/api/user/login?turnstile=${encodeURIComponent(loginTok)}`, { method: 'POST', body: { username, password } });
    const jwt = lg.json && lg.json.data && lg.json.data.access_token;
    if (!jwt) throw new Error(`login failed: ${String(lg.text).slice(0, 160)}`);
    log(`  login ok — quota ${lg.json.data.quota}`);
    await panelGap();

    // Key minting needs no captcha; the panel masks the key in its list, so the
    // create -> list -> reveal dance is the only way to the value.
    stage = 'key';
    const AUTH = { authorization: `Bearer ${jwt}` };
    const made = await inPage('/api/token/', {
      method: 'POST',
      headers: AUTH,
      body: { name: `lane-${Date.now()}`, remain_quota: 0, expired_time: -1, unlimited_quota: true, model_limits_enabled: false, model_limits: '', allow_ips: '', group: '', auto_groups: [], cross_group_retry: false, tokenCount: 1 },
    });
    const list = await inPage('/api/token/?p=0&size=50', { headers: AUTH });
    const items = (list.json && list.json.data && (list.json.data.items || list.json.data)) || [];
    const newest = items.slice().sort((a, b) => (b.id || 0) - (a.id || 0))[0];
    if (!newest) throw new Error(`no token row after create (create ${made.status})`);
    const revealed = await inPage(`/api/token/${newest.id}/key`, { method: 'POST', headers: AUTH });
    const key = revealed.json && revealed.json.data && revealed.json.data.key;
    if (!key) throw new Error(`key reveal failed: ${String(revealed.text).slice(0, 160)}`);
    log(`  key ${key.slice(0, 10)}… (${key.length})`);
    await panelGap();

    // The free tier: one check-in per panel day = 10,000,000 quota = $20.
    stage = 'checkin';
    const checkToken = await widgetToken(page, 'checkin', { timeoutMs: 60000, note: log });
    let awarded = 0;
    let already = false;
    if (checkToken) {
      const ci = await inPage(`/api/user/checkin?turnstile=${encodeURIComponent(checkToken)}`, { method: 'POST', headers: AUTH, body: { turnstile: checkToken } });
      try {
        const j = JSON.parse(ci.text);
        awarded = (j.data && j.data.quota_awarded) || 0;
        already = /今日已签到/.test(String(j.message || ''));
      } catch (e) { /* keep the raw text in the log line below */ }
      log(`  checkin -> ${ci.status} awarded=${awarded}${already ? ' (already)' : ''} ${String(ci.text).slice(0, 120)}`);
    } else log('  checkin skipped — no token for it');

    // Persist before the gate: whatever happens next, the key is recoverable, but
    // the account + check-in result must survive a gate failure.
    stage = 'verify';
    const rec = {
      provider: 'seekai',
      username,
      password,
      email: box.address,
      key,
      exit: labelOf(exit),
      ua,
      ts: new Date().toISOString(),
      quotaAwarded: awarded,
      already,
      gate: 'pending',
    };
    const accounts = loadAccounts();
    accounts.push(rec);
    saveAccounts(accounts);
    await page.shoot('03-key');

    const proof = await proveKey(exit, key);
    if (!proof.ok) {
      rec.gate = `failed:${proof.status}`;
      rec.sample = String(proof.sample).slice(0, 200);
      saveAccounts(accounts);
      throw new Error(`chat gate ${proof.status}: ${String(proof.sample).slice(0, 120)}`);
    }
    rec.gate = 200;
    rec.models = proof.models;
    rec.via = proof.via;
    saveAccounts(accounts);
    await page.shoot('04-live');

    const usd = awarded / QUOTA_PER_UNIT;
    log(`account ${n}: key LIVE on ${proof.model} (${proof.models} models, via ${proof.via}) · ${key.slice(0, 10)}… · check-in +$${usd.toFixed(2)} · ${Math.round((Date.now() - started) / 1000)}s`);
    return rec;
  } catch (e) {
    await page.shoot(`99-fatal-${stage}`).catch(() => {});
    e.skStage = stage;
    throw e;
  } finally {
    await chrome.close();
  }
}

async function attemptAccount(n, exits, seed) {
  const limit = Math.min(TRIES, exits.length);
  for (let t = 0; t < limit; t++) {
    const exit = exits[(seed + t) % exits.length];
    let vet;
    try {
      vet = await vetExit(exit);
    } catch (e) {
      vet = { ok: false, why: String(e.message).slice(0, 90) };
    }
    if (!vet.ok) {
      log(`account ${n}: exit ${labelOf(exit)} failed the vet (${vet.why}) — trying the next one`);
      ledger({ account: n, exit: labelOf(exit), class: 'exit-vet', detail: vet.why });
      continue;
    }
    log(`account ${n}: exit pinned ${labelOf(exit)} (vet ${vet.ms}ms)`);
    // The mailbox rail is the flaky half: a dead box costs one full attempt,
    // then the next try builds a new box (and a new Chrome) on the same exit.
    for (let m = 1; m <= MINT_TRIES; m++) {
      try {
        return await mintOnExit(n, exit);
      } catch (e) {
        const cls = classify(e);
        log(`account ${n}: ${cls} failed (try ${m}/${MINT_TRIES}) — ${String(e.message).slice(0, 150)}`);
        ledger({ account: n, exit: labelOf(exit), class: cls, stage: e.skStage, try: m, detail: String(e.message).slice(0, 300) });
        if (m < MINT_TRIES && GAP_MS) await sleep(GAP_MS);
      }
    }
  }
  return null;
}

// ------------------------------------------------------------ key handling
function readKeys(file = KEYS_PATH) {
  try {
    return fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
function appendKey(key) {
  fs.appendFileSync(KEYS_FILE, (fs.existsSync(KEYS_FILE) && fs.statSync(KEYS_FILE).size ? '\n' : '') + key + '\n');
}
/** A key the panel refuses outright (401/403/quota/ban) leaves keys.txt and is
 *  parked in keys-dead.txt as `key<TAB>sebep<TAB>ISO`. A transport failure or a
 *  429 is not a key verdict, so it stays in keys.txt for the next run. */
function saveDeadKeys(dead) {
  fs.writeFileSync(KEYS_DEAD_FILE, dead.length ? dead.map((d) => `${d.key}\t${d.why}\t${new Date().toISOString()}`).join('\n') + '\n' : '');
}
function loadAccounts() {
  try { return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')); } catch { return []; }
}
function saveAccounts(list) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(list, null, 2) + '\n');
}

// ------------------------------------------------------------------- proof
/** Chat-capable candidates, free/cheap-looking first, embedding ids excluded. */
function pickCandidates(ids) {
  const chat = (ids || []).filter((id) => id && !/embedding|rerank/i.test(id));
  const out = [MODEL];
  for (const hint of ['free', 'flash', 'lite', 'mini', 'small', 'qwen']) {
    for (const id of chat) if (!out.includes(id) && id.toLowerCase().includes(hint)) out.push(id);
  }
  for (const id of chat) if (!out.includes(id)) out.push(id);
  return out.slice(0, 4);
}

async function listModels(exit, key) {
  const r = await exitJson(exit, `${API}/models`, { headers: { authorization: `Bearer ${key}` }, timeoutMs: TIMEOUT_MS });
  return { status: r.status, ids: ((r.json && r.json.data) || []).map((m) => m.id).filter(Boolean) };
}

const RL_HEADERS = [
  'x-ratelimit-limit-requests',
  'x-ratelimit-remaining-requests',
  'x-ratelimit-limit-tokens',
  'x-ratelimit-remaining-tokens',
  'retry-after',
];
/** One real completion; 200 with content (or reasoning) = the key is live. */
async function chatGate(exit, key, model) {
  const r = await exitJson(exit, `${API}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}` },
    timeoutMs: GATE_MS,
    body: { model, messages: [{ role: 'user', content: 'Reply with the single word: ok' }], max_tokens: 16, stream: false },
  });
  const msg = r.json && r.json.choices && r.json.choices[0] && r.json.choices[0].message;
  // This relay answers reasoning routes with an EMPTY `content` and the text in
  // `reasoning` (DeepSeek-V4-Flash on the live panel does exactly that), so a
  // content-only gate would call 18 live keys dead (measured 2026-10-21).
  const content = msg && (msg.content || msg.reasoning_content || msg.reasoning || '');
  const rateLimits = {};
  for (const k of RL_HEADERS) if (r.headers && r.headers[k] != null) rateLimits[k] = String(r.headers[k]);
  return {
    ok: r.status === 200 && !!String(content).trim(),
    status: r.status,
    model,
    via: msg && msg.content ? 'content' : 'reasoning',
    sample: content ? String(content).slice(0, 60) : String(r.text).slice(0, 140),
    rateLimits,
  };
}

/**
 * Models + a completion on the first model that answers — the keep/drop gate.
 *
 * Two measured classes are retried instead of read as a verdict: a pass that
 * only produced exit-class errors, and **`401 API key is disabled`** — on
 * 2026-10-21 three keys answered that from one exit and 200 from another in the
 * same minute, so the panel/relay, not the key, decides that answer. Rotating
 * exits needs a pool: pass `exits` for --verify-only.
 */
async function proveKey(exit, key, { attempts = 2, exits = null } = {}) {
  const pool = Array.isArray(exits) && exits.length ? exits : [exit];
  const retryable = (g) => !g || g.status === 0 || (g.status === 401 && /key is disabled/i.test(String(g.sample || '')));
  let last = null;
  for (let a = 1; a <= attempts; a++) {
    const use = pool[(a - 1) % pool.length];
    let models;
    try {
      models = await listModels(use, key);
    } catch (e) {
      last = { ok: false, status: 0, models: 0, sample: `GET /v1/models: ${String(e.message).slice(0, 100)}`, rateLimits: {} };
      await sleep(2000);
      continue;
    }
    if (models.status !== 200 || !models.ids.length) {
      last = { ok: false, status: models.status, models: 0, sample: `GET /v1/models -> ${models.status}`, rateLimits: {} };
      if (a < attempts) continue;
      return last;
    }
    let retry = false;
    for (const model of pickCandidates(models.ids)) {
      try {
        const g = await chatGate(use, key, model);
        if (g.ok) return { ok: true, status: 200, model: g.model, via: g.via, sample: g.sample, models: models.ids.length, rateLimits: g.rateLimits };
        last = { ...g, models: models.ids.length };
        if (retryable(g)) retry = true;
        else break; // a real answer (bad model id, quota, …) — no exit will change it
      } catch (e) {
        last = { status: 0, model, sample: String(e.message).slice(0, 120), rateLimits: {} };
        retry = true;
      }
    }
    if (!retry) break;
    if (a < attempts) await sleep(2500);
  }
  return { ok: false, status: last && last.status, models: (last && last.models) || 0, sample: (last && last.sample) || 'no model answered', rateLimits: (last && last.rateLimits) || {} };
}

// ------------------------------------------------------------------- modes
async function mint(exits) {
  log(`seekai mint · ${COUNT} account(s) · model ${MODEL} · exits ${exits.filter(Boolean).length || 'direct'} · keys land in ${KEYS_FILE}`);
  let made = 0;
  for (let i = 0; i < COUNT; i++) {
    const rec = await attemptAccount(i + 1, exits, i);
    // mintOnExit has already recorded the account (key + gate result) in
    // accounts.json; keys.txt is the only file written here.
    if (rec) {
      appendKey(rec.key);
      made++;
    }
    if (i < COUNT - 1 && GAP_MS) await sleep(GAP_MS);
  }
  log(`done — ${made}/${COUNT} key(s) written to ${KEYS_FILE}`);
  process.exit(made === COUNT ? 0 : 1);
}

async function verifyOnly(exits) {
  const keys = readKeys();
  if (!keys.length) {
    console.log(`no keys in ${KEYS_PATH}`);
    process.exit(0);
  }
  console.log(`keys: ${keys.length} from ${KEYS_PATH} · exits ${exits.filter(Boolean).length || 'direct'}`);
  let live = 0;
  let modelCount = null;
  const dead = [];
  for (let i = 0; i < keys.length; i++) {
    const exit = exits[i % exits.length];
    try {
      if (modelCount === null) {
        const m = await listModels(exit, keys[i]);
        modelCount = m.ids.length;
        console.log(`  /v1/models -> ${m.status}, ${modelCount} models`);
      }
      const g = await proveKey(exit, keys[i], { attempts: Math.max(2, Math.min(4, exits.length)), exits });
      if (g.ok) live++; else if ([401, 402, 403].includes(Number(g.status))) dead.push({ key: keys[i], why: g.status });
      console.log(`  ${g.ok ? '✔' : '✘'} ${keys[i].slice(0, 12)}… chat=${g.ok ? 200 : g.status || 0} ${g.ok ? `${g.model} "${g.sample}" rl=${JSON.stringify(g.rateLimits)}` : String(g.sample).slice(0, 90)}`);
    } catch (e) {
      console.log(`  ✘ ${keys[i].slice(0, 12)}… ${String(e.message).slice(0, 90)} (transport — key kept)`);
    }
  }
  if (dead.length) {
    saveDeadKeys(dead);
    const liveKeys = keys.filter((k) => !dead.some((d) => d.key === k));
    fs.writeFileSync(KEYS_FILE, liveKeys.length ? liveKeys.join('\n') + '\n' : '');
    console.log(`  dead ${dead.length} → ${KEYS_DEAD_FILE} (moved out of keys.txt)`);
  }
  console.log(`verify: ${live}/${keys.length} keys live`);
  process.exit(live === keys.length ? 0 : 1);
}

// ------------------------------------------------------------ 9Router
/** Register the provider-node + one connection per key on a local 9Router. */
async function connect9router() {
  const base = (arg('9router-base', 'http://localhost:20128')).replace(/\/$/, '');
  const password = arg('9router-password', '123456');
  const name = arg('9router-name', 'SeekAI');
  const prefix = arg('9router-prefix', 'seekai');
  const baseUrl = arg('base-url', `${API}`);
  const r9ua = 'seekai-bulk-9router-connector/1.0';
  const keys = arg('api-key', '') ? [arg('api-key', '')] : readKeys();
  if (!keys.length) {
    console.log(`no keys — mint one first (node src/cli.js --count 1), or pass --api-key <key>`);
    process.exit(1);
  }

  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': r9ua },
    body: JSON.stringify({ password }),
  });
  const setCookie = typeof login.headers.getSetCookie === 'function' ? login.headers.getSetCookie() : [];
  const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  console.log(`9Router login: ${login.ok ? 'ok' : `not required/failed ${(await login.text()).slice(0, 120)}`}`);

  const api = async (route, init = {}) => {
    const res = await fetch(`${base}${route}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'User-Agent': r9ua, ...(cookie ? { Cookie: cookie } : {}), ...(init.headers || {}) },
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON reported as text */ }
    return { status: res.status, ok: res.ok, json, text: text.slice(0, 300) };
  };

  const nodes = await api('/api/provider-nodes');
  let node = (((nodes.json || {}).nodes) || []).find((n) => n.prefix === prefix || n.name === name);
  if (node) {
    console.log(`provider-node exists: ${node.id} (prefix ${node.prefix})`);
  } else {
    const created = await api('/api/provider-nodes', {
      method: 'POST',
      body: JSON.stringify({ name, prefix, apiType: 'chat', type: 'openai-compatible', baseUrl }),
    });
    if (!created.ok) throw new Error(`create node failed ${created.status}: ${created.text}`);
    node = created.json.node;
    console.log(`provider-node created: ${node.id} (${baseUrl})`);
  }

  const conns = await api('/api/providers');
  const existing = (((conns.json || {}).connections) || []).filter((c) => c.provider === node.id || c.name === name);
  let added = 0;
  for (let i = 0; i < keys.length; i++) {
    const connName = keys.length === 1 ? name : `${prefix}-${String(i + 1).padStart(3, '0')}`;
    if (existing.some((c) => c.name === connName)) {
      console.log(`connection exists: ${connName}`);
      continue;
    }
    const created = await api('/api/providers', {
      method: 'POST',
      body: JSON.stringify({ provider: node.id, apiKey: keys[i], name: connName, priority: 1, defaultModel: MODEL }),
    });
    if (!created.ok && created.status !== 409) throw new Error(`create connection ${connName} failed ${created.status}: ${created.text}`);
    added++;
    console.log(`connection created: ${connName}`);
  }
  console.log(`\nDone — ${added} new connection(s). Models are served as ${prefix}/<model id>:\n  ${prefix}/${MODEL}`);
}

// ------------------------------------------------------------------- main
if (require.main === module) {
    if (DRY) {
      const pool = loadExits();
      const solverOk = typeof launchChrome === 'function' && typeof widgetToken === 'function';
      console.log('seekai plan (--dry — no files written, no network)');
      console.log(`  count   ${COUNT}`);
      console.log(`  model   ${MODEL}`);
      console.log(`  exits   ${pool.filter(Boolean).length || 'DIRECT (no pool)'}`);
      console.log(`  solver  ${solverOk ? 'ready — src/solver.js (--auto is the default)' : 'MISSING src/solver.js'}`);
      console.log('  writes  keys.txt · accounts.json · out/ (skipped)');
      process.exit(0);
    }
  (async () => {
    if (CONNECT_9ROUTER) {
      await connect9router();
      process.exit(0);
    }
    const exits = loadExits();
    if (SCREEN) {
      const pass = await screen(exits);
      process.exit(pass ? 0 : 1);
    }
    if (VERIFY_ONLY) {
      await verifyOnly(exits);
      return;
    }
    await mint(exits);
  })().catch((e) => {
    console.error('[fatal]', e.message);
    process.exit(1);
  });
}

// Exported so the lab can drive parts of the rail directly (page probe); the
// CLI itself only runs its main flow when executed as a script.
module.exports = { parseProxy, extractCode, pickCandidates, launchChrome, Page, pageHelper, widgetToken, ensureHelper, WsClient, CDP, solveCaptcha, proveKey, vetExit, newMailbox, waitForCode, parseArgs: arg };
