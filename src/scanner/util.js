// Filesystem helpers and shared constants for the warden scanner.
// Everything here is read-only. Nothing in this project ever writes to ~/.claude.

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const HOME = os.homedir();
export const CLAUDE_DIR = path.join(HOME, '.claude');
export const BIG_CONFIG = path.join(HOME, '.claude.json');

export function exists(p) {
  try { return existsSync(p); } catch { return false; }
}

export async function readText(p, { maxBytes = 5 * 1024 * 1024 } = {}) {
  try {
    const st = await fs.stat(p);
    if (st.size > maxBytes) {
      const fh = await fs.open(p, 'r');
      try {
        const buf = Buffer.alloc(maxBytes);
        const { bytesRead } = await fh.read(buf, 0, maxBytes, 0);
        return buf.subarray(0, bytesRead).toString('utf8');
      } finally { await fh.close(); }
    }
    return await fs.readFile(p, 'utf8');
  } catch { return null; }
}

export async function readJson(p) {
  const t = await readText(p);
  if (t == null) return null;
  try { return JSON.parse(t); } catch { return null; }
}

export async function statSafe(p) {
  try { return await fs.stat(p); } catch { return null; }
}

export async function listDir(p) {
  try { return await fs.readdir(p, { withFileTypes: true }); }
  catch { return []; }
}

// Recursive directory size + file count, bounded to avoid pathological trees.
export async function dirStats(root, { maxEntries = 300000 } = {}) {
  let bytes = 0, files = 0, newestMs = 0, seen = 0, truncated = false;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    const entries = await listDir(dir);
    for (const e of entries) {
      if (seen++ > maxEntries) { truncated = true; break; }
      if (e.isSymbolicLink()) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { stack.push(full); continue; }
      if (e.isFile()) {
        const s = await statSafe(full);
        if (s) { bytes += s.size; files++; if (s.mtimeMs > newestMs) newestMs = s.mtimeMs; }
      }
    }
    if (truncated) break;
  }
  return { bytes, files, newestMs, truncated };
}

// Claude encodes a project's filesystem path by replacing '/' with '-'.
// Decoding is approximate (real '-' characters are indistinguishable), which is fine for display.
export function decodeProjectSlug(slug) {
  if (!slug) return slug;
  return slug.replace(/-/g, '/');
}

// Minimal YAML-ish frontmatter parser (flat key: value only).
export function parseFrontmatter(md) {
  if (!md) return {};
  const m = md.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^\s*([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (mm && mm[2] !== undefined && mm[2] !== '') out[mm[1]] = mm[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

export function fmtBytes(n) {
  if (!n || n < 0) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0, v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}
