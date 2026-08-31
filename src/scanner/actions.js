// Phase 2: safe, reversible write actions.
//
// Safety model (load-bearing for trust):
//  - warden never hard-deletes your live data. A "forget" or "archive" MOVES the
//    file(s) into a local trash (~/.claude/.warden-trash) recorded in a manifest,
//    so anything can be restored to exactly where it was.
//  - The ONLY permanent delete is emptying that trash. It is never automatic:
//    it only runs when the person explicitly asks and confirms, and it can only
//    ever remove paths that live inside the trash folder.
//  - Every path is validated to resolve INSIDE ~/.claude before any move, and
//    every delete is validated to resolve INSIDE the trash folder.
//  - Moves are atomic (fs.rename on the same filesystem).
//  - The server only reaches this module for explicit, user-confirmed actions,
//    and never in demo mode.

import fs from 'node:fs/promises';
import path from 'node:path';
import { CLAUDE_DIR, readJson, exists, statSafe, listDir, decodeProjectSlug } from './util.js';

const TRASH = path.join(CLAUDE_DIR, '.warden-trash');
const MANIFEST = path.join(TRASH, 'manifest.json');

function insideClaude(p) {
  const rp = path.resolve(p);
  return rp === CLAUDE_DIR || rp.startsWith(CLAUDE_DIR + path.sep);
}
function insideTrash(p) {
  const rp = path.resolve(p);
  return rp === TRASH || rp.startsWith(TRASH + path.sep);
}
function safeSlug(slug) {
  return !!slug && !slug.includes('/') && !slug.includes('\\') && !slug.includes('..');
}
function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }

async function readManifest() { return (await readJson(MANIFEST)) || { items: [] }; }
async function writeManifest(m) {
  await fs.mkdir(TRASH, { recursive: true });
  await fs.writeFile(MANIFEST, JSON.stringify(m, null, 2));
}
async function sizeOf(p) { const s = await statSafe(p); return s ? s.size : 0; }
async function dirSize(dir) {
  let bytes = 0;
  for (const e of await listDir(dir)) {
    if (e.isFile()) bytes += await sizeOf(path.join(dir, e.name));
    else if (e.isDirectory()) bytes += await dirSize(path.join(dir, e.name));
  }
  return bytes;
}

// Move a single memory note into the trash. Reversible via restore().
export async function forgetMemory({ slug, file } = {}) {
  if (!safeSlug(slug) || !file || !file.endsWith('.md') || file.includes('/') || file.includes('\\') || file.includes('..')) {
    return { ok: false, error: 'Invalid note reference.' };
  }
  const src = path.join(CLAUDE_DIR, 'projects', slug, 'memory', file);
  if (!insideClaude(src)) return { ok: false, error: 'Path is outside ~/.claude.' };
  if (!exists(src)) return { ok: false, error: 'Note not found (already moved?).' };
  const bytes = await sizeOf(src);
  const id = `${stamp()}__${slug}__${file}`;
  const dest = path.join(TRASH, id);
  await fs.mkdir(TRASH, { recursive: true });
  await fs.rename(src, dest);
  const m = await readManifest();
  m.items.unshift({ id, kind: 'memory', label: file.replace(/\.md$/, ''), slug, file, original: src, trashed: dest, bytes, at: new Date().toISOString() });
  await writeManifest(m);
  return { ok: true, id, bytes };
}

// Move every session transcript (*.jsonl) of one project into the trash, as one
// restorable batch. This is the reclaim-disk action: it stages the space for
// release without deleting anything. Emptying the trash is what frees the disk.
export async function archiveTranscripts({ slug } = {}) {
  if (!safeSlug(slug)) return { ok: false, error: 'Invalid project reference.' };
  const dir = path.join(CLAUDE_DIR, 'projects', slug);
  if (!insideClaude(dir)) return { ok: false, error: 'Path is outside ~/.claude.' };
  if (!exists(dir)) return { ok: false, error: 'Project not found.' };
  const names = (await listDir(dir)).filter((e) => e.isFile() && e.name.endsWith('.jsonl')).map((e) => e.name);
  if (!names.length) return { ok: false, error: 'No transcripts to archive.' };
  const id = `${stamp()}__${slug}__transcripts`;
  const destDir = path.join(TRASH, id);
  await fs.mkdir(destDir, { recursive: true });
  let bytes = 0;
  const moved = [];
  for (const name of names) {
    const src = path.join(dir, name);
    if (!insideClaude(src)) continue;
    bytes += await sizeOf(src);
    await fs.rename(src, path.join(destDir, name));
    moved.push(name);
  }
  const label = decodeProjectSlug(slug).split('/').filter(Boolean).pop() || slug;
  const m = await readManifest();
  m.items.unshift({ id, kind: 'transcript', label, slug, files: moved, originalDir: dir, trashedDir: destDir, count: moved.length, bytes, at: new Date().toISOString() });
  await writeManifest(m);
  return { ok: true, id, count: moved.length, bytes };
}

// Move a trashed item (single note or a batch of transcripts) back to origin.
export async function restore({ id } = {}) {
  const m = await readManifest();
  const idx = m.items.findIndex((x) => x.id === id);
  if (idx < 0) return { ok: false, error: 'Not in trash.' };
  const it = m.items[idx];
  if (it.kind === 'transcript') {
    if (!insideClaude(it.originalDir) || !insideTrash(it.trashedDir)) return { ok: false, error: 'Path escaped its safe root.' };
    if (!exists(it.trashedDir)) return { ok: false, error: 'Archived files are missing.' };
    await fs.mkdir(it.originalDir, { recursive: true });
    for (const name of it.files || []) {
      const from = path.join(it.trashedDir, name);
      if (exists(from)) await fs.rename(from, path.join(it.originalDir, name));
    }
    await fs.rmdir(it.trashedDir).catch(() => {});
  } else {
    if (!insideClaude(it.original) || !insideTrash(it.trashed)) return { ok: false, error: 'Path escaped its safe root.' };
    if (!exists(it.trashed)) return { ok: false, error: 'Trashed file is missing.' };
    await fs.mkdir(path.dirname(it.original), { recursive: true });
    await fs.rename(it.trashed, it.original);
  }
  m.items.splice(idx, 1);
  await writeManifest(m);
  return { ok: true };
}

// Permanently delete ONE trashed item. Only ever removes a path inside the trash.
export async function purgeItem({ id, confirm } = {}) {
  if (confirm !== 'PURGE') return { ok: false, error: 'Confirmation required.' };
  const m = await readManifest();
  const idx = m.items.findIndex((x) => x.id === id);
  if (idx < 0) return { ok: false, error: 'Not in trash.' };
  const it = m.items[idx];
  const target = it.kind === 'transcript' ? it.trashedDir : it.trashed;
  if (!insideTrash(target)) return { ok: false, error: 'Refusing to delete outside the trash.' };
  const freed = it.bytes || 0;
  await fs.rm(target, { recursive: true, force: true });
  m.items.splice(idx, 1);
  await writeManifest(m);
  return { ok: true, freed };
}

// Permanently delete EVERYTHING in the trash. The only bulk delete warden performs,
// and only on explicit confirmation. Never touches anything outside the trash folder.
export async function emptyTrash({ confirm } = {}) {
  if (confirm !== 'EMPTY') return { ok: false, error: 'Confirmation required.' };
  const m = await readManifest();
  let freed = 0, removed = 0;
  for (const it of m.items) {
    const target = it.kind === 'transcript' ? it.trashedDir : it.trashed;
    if (!target || !insideTrash(target)) continue;   // never delete outside the trash
    if (exists(target)) {
      freed += it.bytes || (it.kind === 'transcript' ? await dirSize(target) : await sizeOf(target));
      await fs.rm(target, { recursive: true, force: true });
      removed++;
    }
  }
  await writeManifest({ items: [] });
  return { ok: true, freed, removed };
}

// Total bytes currently staged in the trash (what emptying would free).
export async function listTrash() {
  const items = (await readManifest()).items;
  const staged = items.reduce((s, i) => s + (i.bytes || 0), 0);
  return { items, staged };
}

const ACTIONS = { forgetMemory, archiveTranscripts, restore, purgeItem, emptyTrash };

export async function runAction(name, args) {
  const fn = ACTIONS[name];
  if (!fn) return { ok: false, error: 'Unknown action.' };
  try { return await fn(args || {}); }
  catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
}
