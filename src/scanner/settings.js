// Reads settings, global rules, managed policy, hooks, and per-project permission state.

import path from 'node:path';
import { CLAUDE_DIR, BIG_CONFIG, readJson, readText, exists, decodeProjectSlug } from './util.js';
import { mask } from './secrets.js';

const SECRET_KEY_RE = /key|token|secret|password|passwd|credential|auth/i;

function flattenHooks(hooksObj, scope) {
  const out = [];
  if (!hooksObj || typeof hooksObj !== 'object') return out;
  for (const [event, arr] of Object.entries(hooksObj)) {
    if (!Array.isArray(arr)) continue;
    for (const group of arr) {
      const matcher = group?.matcher ?? '*';
      const hooks = Array.isArray(group?.hooks) ? group.hooks : [];
      for (const h of hooks) {
        out.push({ event, matcher, type: h?.type || 'command', command: h?.command || '', scope });
      }
    }
  }
  return out;
}

function redactEnv(env) {
  if (!env || typeof env !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(env)) out[k] = SECRET_KEY_RE.test(k) ? mask(v) : v;
  return out;
}

export async function scanSettings() {
  const userSettings = (await readJson(path.join(CLAUDE_DIR, 'settings.json'))) || {};
  const localSettings = await readJson(path.join(CLAUDE_DIR, 'settings.local.json'));
  const remote = await readJson(path.join(CLAUDE_DIR, 'remote-settings.json'));
  const policy = await readJson(path.join(CLAUDE_DIR, 'policy-limits.json'));
  const big = (await readJson(BIG_CONFIG)) || {};
  const globalClaudeMd = await readText(path.join(CLAUDE_DIR, 'CLAUDE.md'));

  const permissions = {
    allow: userSettings?.permissions?.allow || [],
    deny: userSettings?.permissions?.deny || [],
    ask: userSettings?.permissions?.ask || [],
    defaultMode: userSettings?.permissions?.defaultMode || null,
  };

  const hooks = [
    ...flattenHooks(userSettings?.hooks, 'user'),
    ...flattenHooks(localSettings?.hooks, 'local'),
  ];

  const projectPermissions = [];
  for (const [slug, cfg] of Object.entries(big.projects || {})) {
    projectPermissions.push({
      slug,
      path: decodeProjectSlug(slug),
      allowedTools: cfg?.allowedTools?.length || 0,
      trusted: !!cfg?.hasTrustDialogAccepted,
      enabledMcpJson: cfg?.enabledMcpjsonServers || [],
      disabledMcpJson: cfg?.disabledMcpjsonServers || [],
    });
  }

  return {
    userSettingsPresent: exists(path.join(CLAUDE_DIR, 'settings.json')),
    localSettingsPresent: !!localSettings,
    managedPresent: !!remote || !!policy,
    remotePresent: !!remote,
    policyPresent: !!policy,
    model: userSettings?.model || null,
    permissions,
    hooks,
    env: redactEnv(userSettings?.env),
    globalClaudeMd: globalClaudeMd || null,
    globalClaudeMdBytes: globalClaudeMd ? Buffer.byteLength(globalClaudeMd) : 0,
    projectPermissions,
  };
}
