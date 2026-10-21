#!/usr/bin/env node
'use strict';
/**
 * SeekAI launcher — prints the project wordmark and offers a numbered menu over
 * `src/cli.js`, so nothing has to be typed from memory. Settings (proxy file,
 * account count, model) persist in `launcher.config.json`.
 *
 *   node src/launcher.js
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CLI = path.join(__dirname, 'cli.js');
const CONFIG = path.join(ROOT, 'launcher.config.json');
const KEYS = path.join(ROOT, 'keys.txt');
const POOL = path.join(ROOT, 'proxies.txt');

/** Same wordmark as the README — keep the two in step. */
const BANNER_LOGO = String.raw`
███████╗███████╗███████╗██╗  ██╗ █████╗ ██╗
██╔════╝██╔════╝██╔════╝██║ ██╔╝██╔══██╗██║
███████╗█████╗  █████╗  █████╔╝ ███████║██║
╚════██║██╔══╝  ██╔══╝  ██╔═██╗ ██╔══██║██║
███████║███████╗███████╗██║  ██╗██║  ██║██║
╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
`;

const DEFAULTS = { count: 1, model: 'deepseek-ai/DeepSeek-V4-Flash-0731', pool: 'proxies.txt', gap: 20000, panelGap: 14000 };

const loadConfig = () => {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG, 'utf8')) };
  } catch (e) {
    return { ...DEFAULTS };
  }
};
const saveConfig = (cfg) => fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2) + '\n');
const countLines = (file) => {
  try {
    return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#')).length;
  } catch (e) {
    return 0;
  }
};

function banner(cfg) {
  const keys = countLines(KEYS);
  const exits = countLines(POOL);
  const bar = '╔' + '═'.repeat(46) + '╗';
  console.log('');
  console.log(bar);
  for (const line of BANNER_LOGO.trim('\n').split('\n')) console.log('║' + line.padEnd(46) + '║');
  console.log('║' + 'seekai-bulk-apikey'.padEnd(46) + '║');
  console.log(bar);
  console.log(`  keys.txt ${keys} · proxies.txt ${exits} exit(s) · model ${cfg.model}`);
  console.log(`  count ${cfg.count} · pool ${cfg.pool} · gap ${cfg.gap} ms · panel gap ${cfg.panelGap} ms`);
  console.log('');
}

function run(args) {
  console.log(`\n$ node src/cli.js ${args.join(' ')}\n`);
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, stdio: 'inherit' });
  console.log(`\n(exit ${r.status === null ? '?' : r.status})\n`);
}

function ask(rl, question, dflt) {
  return new Promise((resolve) => rl.question(`${question} [${dflt}] `, (a) => resolve(a.trim() || String(dflt))));
}

(async () => {
  const cfg = loadConfig();
  banner(cfg);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const poolArgs = () => (fs.existsSync(path.join(ROOT, cfg.pool)) ? ['--pool', path.join(ROOT, cfg.pool)] : []);

  for (;;) {
    console.log('  1) mint        create accounts + claim the daily $20 check-in');
    console.log('  2) verify      re-check every key in keys.txt');
    console.log('  3) screen      HTTP screen of the exit list');
    console.log('  4) settings    proxy file / count / model');
    console.log('  5) 9router     register the provider + its keys locally');
    console.log('  6) help        CLI flags');
    console.log('  0) exit');
    const choice = (await ask(rl, 'choose', '1')).trim();
    if (choice === '0' || choice === 'q') break;
    if (choice === '1') run(['--count', String(cfg.count), '--model', cfg.model, '--gap', String(cfg.gap), '--panel-gap', String(cfg.panelGap), ...poolArgs()]);
    else if (choice === '2') run(['--verify-only', ...poolArgs()]);
    else if (choice === '3') run(['--screen', ...poolArgs()]);
    else if (choice === '4') {
      cfg.pool = await ask(rl, 'proxy file', cfg.pool);
      cfg.count = Number(await ask(rl, 'accounts per run', cfg.count)) || cfg.count;
      cfg.model = await ask(rl, 'model for the live gate', cfg.model);
      saveConfig(cfg);
      console.log(`saved ${CONFIG}`);
    } else if (choice === '5') run(['--connect-9router']);
    else if (choice === '6') run(['--help']);
    else console.log('unknown choice');
    console.log('');
  }
  rl.close();
  process.exit(0);
})();
