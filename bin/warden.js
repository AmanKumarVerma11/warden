#!/usr/bin/env node
// warden CLI — starts the local dashboard and opens it in the browser.
// Usage: warden [--port <n>] [--no-open]

import { spawn } from 'node:child_process';
import { createServer } from '../src/server.js';

const args = process.argv.slice(2);
const argVal = (name, def) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : def; };
const wantOpen = !args.includes('--no-open');
if (args.includes('--demo')) process.env.WARDEN_DEMO = '1';
const startPort = parseInt(argVal('--port', process.env.WARDEN_PORT || '4317'), 10);

const server = createServer();

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  try { spawn(cmd, [url], { stdio: 'ignore', detached: true, shell: process.platform === 'win32' }).unref(); } catch {}
}

function listen(port, triesLeft) {
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && triesLeft > 0) return listen(port + 1, triesLeft - 1);
    console.error('Failed to start warden:', e.message);
    process.exit(1);
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log('\n  warden: local visibility & control for Claude Code');
    console.log('  Read-only. Nothing leaves your machine.\n');
    if (process.env.WARDEN_DEMO === '1') console.log('  DEMO mode: showing synthetic data, not your real ~/.claude.\n');
    console.log(`  ▸  ${url}\n`);
    if (wantOpen) openBrowser(url);
  });
}

listen(startPort, 12);
