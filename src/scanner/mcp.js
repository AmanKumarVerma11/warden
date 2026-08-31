// Discovers every MCP connection the agent can use and classifies what it can touch.
// "What external services can this agent reach, and how sensitive are they?"

import path from 'node:path';
import { BIG_CONFIG, CLAUDE_DIR, readJson, decodeProjectSlug } from './util.js';
import { mask } from './secrets.js';

const SECRET_KEY_RE = /key|token|secret|password|auth|credential/i;

// Ordered most-sensitive first so the first keyword match wins.
const CATEGORIES = [
  { cat: 'Payments', sensitivity: 'high', kw: ['stripe', 'paypal', 'braintree', 'plaid', 'payment'] },
  { cat: 'Finance / cap table', sensitivity: 'high', kw: ['carta', 'quickbooks', 'xero', 'brex', 'ramp'] },
  { cat: 'Cloud infrastructure', sensitivity: 'high', kw: ['aws', 'gcp', 'google-cloud', 'azure', 'cloudflare', 'terraform', 'kubernetes', 'k8s'] },
  { cat: 'Database', sensitivity: 'high', kw: ['postgres', 'postgresql', 'mysql', 'mongo', 'mongodb', 'redis', 'sqlite', 'supabase', 'snowflake', 'bigquery', 'database', 'sql'] },
  { cat: 'Email', sensitivity: 'high', kw: ['gmail', 'email', 'outlook', 'sendgrid', 'resend', 'mailgun'] },
  { cat: 'Version control', sensitivity: 'high', kw: ['github', 'gitlab', 'bitbucket'] },
  { cat: 'Filesystem / shell', sensitivity: 'high', kw: ['filesystem', 'file-system', 'desktop-commander', 'commander', 'shell', 'terminal'] },
  { cat: 'Communication', sensitivity: 'medium', kw: ['slack', 'discord', 'telegram', 'teams', 'twilio', 'intercom'] },
  { cat: 'Issue tracking / docs', sensitivity: 'medium', kw: ['linear', 'jira', 'asana', 'notion', 'clickup', 'monday', 'confluence', 'trello'] },
  { cat: 'CRM / sales', sensitivity: 'medium', kw: ['hubspot', 'salesforce', 'apollo', 'close', 'clay', 'pipedrive'] },
  { cat: 'Browser automation', sensitivity: 'medium', kw: ['browser', 'playwright', 'puppeteer', 'chrome', 'selenium'] },
  { cat: 'Analytics / monitoring', sensitivity: 'medium', kw: ['amplitude', 'pendo', 'similarweb', 'datadog', 'langfuse', 'pagerduty'] },
  { cat: 'Design', sensitivity: 'low', kw: ['figma', 'canva', 'adobe'] },
  { cat: 'Search / web', sensitivity: 'low', kw: ['exa', 'tavily', 'brave', 'search', 'fetch'] },
  { cat: 'Docs / reference', sensitivity: 'low', kw: ['context7', 'documentation', 'docs'] },
];

function classify(name, def) {
  const hay = [name, def?.command, (def?.args || []).join(' '), def?.url, Object.keys(def?.env || {}).join(' ')]
    .filter(Boolean).join(' ').toLowerCase();
  for (const c of CATEGORIES) if (c.kw.some((k) => hay.includes(k))) return { category: c.cat, sensitivity: c.sensitivity };
  return { category: 'Unrecognized', sensitivity: 'unknown' };
}

function transportOf(def) {
  if (def?.type) return def.type;
  if (def?.url) return def.url.startsWith('http') ? 'http/sse' : 'remote';
  if (def?.command) return 'stdio';
  return 'unknown';
}

function summarize(def) {
  if (def?.url) { try { return new URL(def.url).host; } catch { return String(def.url).slice(0, 60); } }
  if (def?.command) return [def.command, ...(def.args || [])].join(' ').slice(0, 90);
  return '';
}

function detectFlags(name, def) {
  const hay = [name, def?.command, (def?.args || []).join(' '), def?.url].filter(Boolean).join(' ').toLowerCase();
  const flags = [];
  if (/unrestricted|access-mode=unrestricted|read-?write|--write|allow-write|full-access/.test(hay)) {
    flags.push('write / unrestricted access');
  }
  return flags;
}

function toEntry(name, def, scope, projectPath) {
  const { category, sensitivity } = classify(name, def);
  const envKeys = Object.keys(def?.env || {});
  return {
    name, scope, projectPath: projectPath || null,
    category, sensitivity,
    transport: transportOf(def),
    target: summarize(def),
    flags: detectFlags(name, def),
    envKeys: envKeys.map((k) => (SECRET_KEY_RE.test(k) ? `${k}=${mask(def.env[k])}` : k)),
    hasSecrets: envKeys.some((k) => SECRET_KEY_RE.test(k)),
  };
}

export async function scanMcp() {
  const big = (await readJson(BIG_CONFIG)) || {};
  const settings = (await readJson(path.join(CLAUDE_DIR, 'settings.json'))) || {};
  const entries = [];

  for (const [name, def] of Object.entries(big.mcpServers || {})) entries.push(toEntry(name, def, 'global'));
  for (const [name, def] of Object.entries(settings.mcpServers || {})) {
    if (!entries.find((e) => e.name === name)) entries.push(toEntry(name, def, 'user-settings'));
  }
  for (const [slug, cfg] of Object.entries(big.projects || {})) {
    for (const [name, def] of Object.entries(cfg?.mcpServers || {})) {
      entries.push(toEntry(name, def, 'project', decodeProjectSlug(slug)));
    }
  }

  entries.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2, unknown: 3 };
    return (rank[a.sensitivity] - rank[b.sensitivity]) || a.name.localeCompare(b.name);
  });

  const bySeverity = { high: 0, medium: 0, low: 0, unknown: 0 };
  for (const e of entries) bySeverity[e.sensitivity] = (bySeverity[e.sensitivity] || 0) + 1;

  return { servers: entries, count: entries.length, bySeverity };
}
