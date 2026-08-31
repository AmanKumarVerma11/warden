// Orchestrates the full read-only scan and assembles a single model for the UI.
// The `attention` feed turns raw findings into "so what" — it is the product's hook.

import path from 'node:path';
import { CLAUDE_DIR, HOME, exists, statSafe, dirStats, fmtBytes, readJson } from './util.js';
import { knownLocations } from './paths.js';
import { scanSettings } from './settings.js';
import { scanMcp } from './mcp.js';
import { scanSkills } from './skills.js';
import { scanMemory } from './memory.js';
import { scanProjects } from './projects.js';
import { scanTelemetry } from './telemetry.js';

export async function fullScan() {
  const claudeDirExists = exists(CLAUDE_DIR);

  const [settings, mcp, skills, memory, projects, telemetry] = await Promise.all([
    scanSettings(), scanMcp(), scanSkills(), scanMemory(), scanProjects(), scanTelemetry(),
  ]);

  const locations = [];
  for (const loc of knownLocations()) {
    if (!exists(loc.path)) { locations.push({ ...loc, present: false, bytes: 0, files: 0 }); continue; }
    if (loc.isDir) {
      const s = await dirStats(loc.path);
      locations.push({ ...loc, present: true, bytes: s.bytes, files: s.files });
    } else {
      const s = await statSafe(loc.path);
      locations.push({ ...loc, present: true, bytes: s?.size || 0, files: 1 });
    }
  }
  const totalBytes = locations.reduce((s, l) => s + l.bytes, 0);

  const secretFindings = [...memory.secretFindings, ...projects.transcriptSecretFindings];
  const attention = buildAttention({ settings, mcp, secretFindings, projects, telemetry });
  const personasPreview = buildPersonas(settings, mcp);
  const personas = await readSavedPersonas();

  return {
    generatedAt: new Date().toISOString(),
    home: HOME,
    claudeDir: CLAUDE_DIR,
    claudeDirExists,
    summary: {
      totalBytes,
      projectsBytes: projects.totalBytes,
      transcriptCount: projects.totalSessions,
      projectCount: projects.items.length,
      mcpCount: mcp.count,
      mcpHigh: mcp.bySeverity.high,
      skillCount: skills.skills.length,
      pluginCount: skills.plugins.length,
      memoryCount: memory.totalNotes,
      hookCount: settings.hooks.length,
      secretCount: secretFindings.length,
      telemetryBytes: telemetry.bytes,
    },
    attention,
    locations,
    settings,
    mcp,
    skills,
    memory,
    projects,
    telemetry,
    personasPreview,
    personas,
    secretFindings,
    coverage: { transcriptBytesScanned: projects.scannedBytes },
  };
}

function buildAttention({ settings, mcp, secretFindings, projects, telemetry }) {
  const a = [];
  const high = mcp.servers.filter((s) => s.sensitivity === 'high');
  if (high.length) {
    const cats = [...new Set(high.map((s) => s.category))];
    a.push({ level: 'high', title: `${high.length} high-sensitivity connection${high.length > 1 ? 's' : ''}`,
      detail: `The agent can reach ${cats.join(', ')}. Review exactly what each one can touch.`, view: 'capabilities' });
  }
  const writey = mcp.servers.filter((s) => s.flags && s.flags.length);
  if (writey.length) {
    a.push({ level: 'high', title: `${writey.length} connection${writey.length > 1 ? 's' : ''} can write, not just read`,
      detail: `${writey.map((s) => s.name).join(', ')} run with write / unrestricted access. The agent can modify data there, not only read it.`, view: 'capabilities' });
  }
  const unknown = mcp.servers.filter((s) => s.sensitivity === 'unknown');
  if (unknown.length) {
    a.push({ level: 'medium', title: `${unknown.length} unrecognized connection${unknown.length > 1 ? 's' : ''}`,
      detail: `warden couldn't classify: ${unknown.map((s) => s.name).join(', ')}. Confirm you set these up yourself.`, view: 'capabilities' });
  }
  if (secretFindings.length) {
    const highConf = secretFindings.filter((f) => f.severity === 'high').length;
    a.push({ level: highConf ? 'high' : 'medium', title: `Possible secret${secretFindings.length > 1 ? 's' : ''} in local data`,
      detail: `${secretFindings.length} pattern match${secretFindings.length > 1 ? 'es' : ''} in memory notes and recent transcripts${highConf ? ` (${highConf} high-confidence)` : ''}.`, view: 'privacy' });
  }
  if (settings.hooks.length) {
    a.push({ level: 'medium', title: `${settings.hooks.length} hook${settings.hooks.length > 1 ? 's' : ''} auto-run commands`,
      detail: `Shell commands run automatically around the agent's actions. Know what they do.`, view: 'rules' });
  }
  if (settings.managedPresent) {
    a.push({ level: 'info', title: 'Managed policy is active',
      detail: `Remote settings / policy limits are present, and some behavior is controlled outside your own settings.`, view: 'rules' });
  }
  if (projects.totalBytes > 200 * 1024 * 1024) {
    a.push({ level: 'info', title: `${fmtBytes(projects.totalBytes)} of session history on disk`,
      detail: `${projects.totalSessions} transcripts across ${projects.items.length} projects. A full record of your work.`, view: 'activity' });
  }
  if (telemetry.failedEvents) {
    a.push({ level: 'info', title: `${telemetry.failedEvents} failed telemetry event${telemetry.failedEvents > 1 ? 's' : ''} queued`,
      detail: `Analytics data that tried to leave the device and is still sitting on disk.`, view: 'privacy' });
  }
  const order = { high: 0, medium: 1, info: 2 };
  a.sort((x, y) => (order[x.level] ?? 3) - (order[y.level] ?? 3));
  return a;
}

// Read-only preview: shows how today's scattered config maps onto the "persona"
// concept — a switchable bundle of rules + connections + permissions per context.
// Saved personas (warden's own concept), read from ~/.claude/.warden/personas.json.
// Summaries only; the full rules content stays on disk and is applied by switchPersona.
async function readSavedPersonas() {
  const data = (await readJson(path.join(CLAUDE_DIR, '.warden', 'personas.json'))) || { personas: [], activeId: null };
  const saved = (data.personas || []).map((p) => ({
    id: p.id,
    name: p.name,
    allow: (p.permissions?.allow || []).length,
    ask: (p.permissions?.ask || []).length,
    deny: (p.permissions?.deny || []).length,
    rulesBytes: p.rules ? Buffer.byteLength(p.rules) : 0,
    createdAt: p.createdAt || null,
  }));
  return { saved, activeId: data.activeId || null };
}

function buildPersonas(settings, mcp) {
  const personas = [{
    id: 'default',
    name: 'Default (global)',
    kind: 'active',
    rules: settings.globalClaudeMd ? 'Global CLAUDE.md' : 'none',
    mcps: mcp.servers.filter((s) => s.scope === 'global' || s.scope === 'user-settings').map((s) => s.name),
    hooks: settings.hooks.length,
    note: 'What every project inherits today.',
  }];
  for (const p of settings.projectPermissions.slice(0, 8)) {
    personas.push({
      id: p.slug,
      name: p.path.split('/').filter(Boolean).pop() || p.slug,
      kind: 'suggested',
      rules: p.path,
      mcps: mcp.servers.filter((s) => s.projectPath === p.path).map((s) => s.name),
      allowedTools: p.allowedTools,
      trusted: p.trusted,
      note: 'Detected context, could become a switchable persona.',
    });
  }
  return personas;
}
