// Enumerates installed skills and plugins.

import path from 'node:path';
import { CLAUDE_DIR, listDir, readText, parseFrontmatter } from './util.js';

export async function scanSkills() {
  const skillsRoot = path.join(CLAUDE_DIR, 'skills');
  const skills = [];
  for (const e of await listDir(skillsRoot)) {
    if (!e.isDirectory()) continue;
    const md = await readText(path.join(skillsRoot, e.name, 'SKILL.md'));
    const fm = parseFrontmatter(md);
    skills.push({
      name: fm.name || e.name,
      description: fm.description || '',
      path: path.join(skillsRoot, e.name),
    });
  }
  skills.sort((a, b) => a.name.localeCompare(b.name));

  const pluginsRoot = path.join(CLAUDE_DIR, 'plugins');
  const plugins = [];
  for (const e of await listDir(pluginsRoot)) {
    if (e.name.startsWith('.')) continue;
    plugins.push({ name: e.name, type: e.isDirectory() ? 'dir' : 'file', path: path.join(pluginsRoot, e.name) });
  }

  return { skills, plugins };
}
