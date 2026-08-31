// Reads what the agent remembers about you, across every project namespace.
// Memory notes are small markdown files; we read them fully and scan for secrets/PII.

import path from 'node:path';
import { CLAUDE_DIR, listDir, readText, statSafe, parseFrontmatter, decodeProjectSlug } from './util.js';
import { scanText, countEmails } from './secrets.js';

export async function scanMemory() {
  const projectsRoot = path.join(CLAUDE_DIR, 'projects');
  const byProject = [];
  const secretFindings = [];
  let totalNotes = 0, totalEmails = 0;

  for (const proj of await listDir(projectsRoot)) {
    if (!proj.isDirectory()) continue;
    const memDir = path.join(projectsRoot, proj.name, 'memory');
    const notes = [];
    for (const f of await listDir(memDir)) {
      if (!f.isFile() || !f.name.endsWith('.md') || f.name === 'MEMORY.md') continue;
      const full = path.join(memDir, f.name);
      const text = await readText(full);
      const st = await statSafe(full);
      const fm = parseFrontmatter(text);
      notes.push({
        file: f.name,
        name: fm.name || f.name.replace(/\.md$/, ''),
        description: fm.description || '',
        type: fm.type || '',
        bytes: st?.size || 0,
        preview: (text || '').replace(/^---[\s\S]*?---/, '').trim().slice(0, 280),
      });
      secretFindings.push(...scanText(text, `memory · ${f.name}`));
      totalEmails += countEmails(text);
    }
    const index = await readText(path.join(memDir, 'MEMORY.md'));
    if (notes.length || index) {
      totalNotes += notes.length;
      notes.sort((a, b) => a.name.localeCompare(b.name));
      byProject.push({
        slug: proj.name,
        path: decodeProjectSlug(proj.name),
        noteCount: notes.length,
        notes,
        hasIndex: !!index,
      });
    }
  }

  byProject.sort((a, b) => b.noteCount - a.noteCount);
  return { byProject, totalNotes, totalEmails, secretFindings };
}
