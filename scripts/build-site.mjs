// Assembles the static marketing site's generated parts.
//
// site/index.html (the landing page) is authored by hand and committed.
// This script generates the two things that must stay in sync with the product:
//   site/demo/   — the real dashboard UI, switched into static mode, running
//                  fully client-side against a bundled demo dataset (no server).
//   site/assets/ — the product screenshots the landing page embeds.
//
// Run after changing src/ui/* or the demo data:  npm run build:site

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { demoModel } from '../src/scanner/demo.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const UI = path.join(ROOT, 'src/ui');
const SITE = path.join(ROOT, 'site');
const DEMO = path.join(SITE, 'demo');
const ASSETS = path.join(SITE, 'assets');

await fs.mkdir(DEMO, { recursive: true });
await fs.mkdir(ASSETS, { recursive: true });

// 1. The product UI, copied verbatim so the demo is the real thing, not a mockup.
for (const f of ['app.js', 'styles.css']) {
  await fs.copyFile(path.join(UI, f), path.join(DEMO, f));
}

// 2. The demo dataset the client-side UI reads instead of scanning a machine.
await fs.writeFile(path.join(DEMO, 'scan.json'), JSON.stringify(demoModel()));

// 3. The shell, switched into static demo mode: relative asset paths, the
//    WARDEN_STATIC flag set before app.js runs, and the wordmark linking home.
let html = await fs.readFile(path.join(UI, 'index.html'), 'utf8');
html = html
  .replace('<title>warden</title>', '<title>warden — live demo</title>')
  .replace('href="/styles.css"', 'href="styles.css"')
  .replace('src="/app.js"', 'src="app.js"')
  .replace('<script src="app.js"></script>', '<script>window.WARDEN_STATIC = true;</script>\n  <script src="app.js"></script>')
  .replace('<div class="wordmark" aria-label="warden">', '<a class="wordmark" href="/" aria-label="warden — back to home" style="text-decoration:none">')
  .replace('      </div>\n      <nav id="nav"', '      </a>\n      <nav id="nav"');
await fs.writeFile(path.join(DEMO, 'index.html'), html);

// 4. The product screenshots the landing page embeds.
for (const f of await fs.readdir(path.join(ROOT, 'docs/assets'))) {
  if (f.endsWith('.png')) await fs.copyFile(path.join(ROOT, 'docs/assets', f), path.join(ASSETS, f));
}

console.log('Built site/demo/ and site/assets/ from src/ui + demo data.');
