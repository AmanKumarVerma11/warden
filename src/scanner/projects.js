// Measures the disk footprint and activity of each project's session history,
// and scans a bounded sample of recent transcripts for leaked secrets.

import path from 'node:path';
import {
  CLAUDE_DIR, BIG_CONFIG, listDir, statSafe, dirStats, readJson, readText, decodeProjectSlug, exists,
} from './util.js';
import { scanText } from './secrets.js';

const SCAN_BUDGET = 8 * 1024 * 1024;      // scan up to ~8 MB of recent transcript text for secrets
const MAX_FILE_SCAN = 20 * 1024 * 1024;   // never load a single transcript larger than this

export async function scanProjects() {
  const projectsRoot = path.join(CLAUDE_DIR, 'projects');
  const big = (await readJson(BIG_CONFIG)) || {};
  const bigProjects = big.projects || {};
  const items = [];
  const transcriptSecretFindings = [];
  let scannedBytes = 0;

  for (const proj of await listDir(projectsRoot)) {
    if (!proj.isDirectory()) continue;
    const dir = path.join(projectsRoot, proj.name);
    const stats = await dirStats(dir);

    let sessions = 0, newestPath = null, newestMs = 0, newestSize = 0;
    for (const f of await listDir(dir)) {
      if (!f.isFile() || !f.name.endsWith('.jsonl')) continue;
      sessions++;
      const st = await statSafe(path.join(dir, f.name));
      if (st && st.mtimeMs > newestMs) { newestMs = st.mtimeMs; newestPath = path.join(dir, f.name); newestSize = st.size; }
    }

    const realPath = decodeProjectSlug(proj.name);
    const cfg = bigProjects[proj.name] || {};
    items.push({
      slug: proj.name,
      path: realPath,
      bytes: stats.bytes,
      files: stats.files,
      sessions,
      lastActiveMs: stats.newestMs || newestMs,
      hasMemory: exists(path.join(dir, 'memory')),
      hasProjectClaudeMd: exists(path.join(realPath, 'CLAUDE.md')),
      hasProjectDotClaude: exists(path.join(realPath, '.claude')),
      trusted: !!cfg?.hasTrustDialogAccepted,
      allowedTools: cfg?.allowedTools?.length || 0,
    });

    if (newestPath && newestSize <= MAX_FILE_SCAN && scannedBytes < SCAN_BUDGET) {
      const text = await readText(newestPath, { maxBytes: SCAN_BUDGET - scannedBytes });
      if (text) {
        scannedBytes += text.length;
        transcriptSecretFindings.push(...scanText(text, `transcript · ${path.basename(realPath)} (recent)`));
      }
    }
  }

  items.sort((a, b) => b.bytes - a.bytes);
  return {
    items,
    totalBytes: items.reduce((s, i) => s + i.bytes, 0),
    totalSessions: items.reduce((s, i) => s + i.sessions, 0),
    transcriptSecretFindings,
    scannedBytes,
  };
}
