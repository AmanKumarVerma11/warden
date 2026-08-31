// warden dashboard · fetches the local scan and renders read-only views.
// Minimal monochrome system; all file-derived strings are escaped before insertion.

const state = { data: null, view: 'overview', trash: [], editingRules: false };

const VIEWS = [
  { id: 'overview', label: 'Overview', ic: 'overview', sub: 'What Claude Code has on this machine.' },
  { id: 'capabilities', label: 'Capabilities', ic: 'capabilities', sub: 'External services the agent can reach.' },
  { id: 'rules', label: 'Rules & Hooks', ic: 'rules', sub: 'The instructions and automation that shape every session.' },
  { id: 'skills', label: 'Skills & Plugins', ic: 'skills', sub: 'Installed abilities the agent can invoke.' },
  { id: 'memory', label: 'Memory', ic: 'memory', sub: 'What the agent remembers about you.' },
  { id: 'personas', label: 'Personas', ic: 'personas', sub: 'Swappable bundles of rules, connections and permissions.' },
  { id: 'activity', label: 'Activity & Data', ic: 'activity', sub: 'Session history and its footprint on disk.' },
  { id: 'audit', label: 'Audit log', ic: 'audit', sub: 'A tamper-evident record of every change warden made.' },
  { id: 'privacy', label: 'Privacy & Egress', ic: 'privacy', sub: 'Secrets on disk and data leaving the device.' },
  { id: 'locations', label: 'All Locations', ic: 'locations', sub: 'Every place Claude Code stores things, in plain English.' },
];

// ---------- authored line icons (24x24, 1.5 stroke, currentColor) ----------
const ICONS = {
  overview: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  capabilities: '<circle cx="12" cy="12" r="2.4"/><circle cx="5.2" cy="6" r="1.7"/><circle cx="18.8" cy="6" r="1.7"/><circle cx="12" cy="20" r="1.7"/><path d="m10.2 10.4-3.5-2.8M13.8 10.4l3.5-2.8M12 14.4v3.9"/>',
  rules: '<path d="M6 3.5h7.5L18 8v11.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z"/><path d="M13.5 3.5V8H18"/><path d="M8.3 12.5h7M8.3 16h7"/>',
  skills: '<path d="M12 3.6c.55 4 1.45 4.85 5.4 5.4-3.95.55-4.85 1.45-5.4 5.4-.55-3.95-1.45-4.85-5.4-5.4 3.95-.55 4.85-1.4 5.4-5.4Z"/><path d="M18 14.4c.3 1.55.65 1.9 2.2 2.2-1.55.3-1.9.65-2.2 2.2-.3-1.55-.65-1.9-2.2-2.2 1.55-.3 1.9-.65 2.2-2.2Z"/>',
  memory: '<ellipse cx="12" cy="6.2" rx="6.3" ry="2.5"/><path d="M5.7 6.2v11.6c0 1.35 2.82 2.5 6.3 2.5s6.3-1.15 6.3-2.5V6.2"/><path d="M5.7 12c0 1.35 2.82 2.5 6.3 2.5s6.3-1.15 6.3-2.5"/>',
  personas: '<rect x="4.5" y="4.5" width="10.5" height="10.5" rx="2"/><path d="M9 19.5h8.5a2 2 0 0 0 2-2V9"/>',
  activity: '<path d="M4 6.6A1.6 1.6 0 0 1 5.6 5h3.7l2 2.2h7.1A1.6 1.6 0 0 1 21 8.8v8.6A1.6 1.6 0 0 1 19.4 19H5.6A1.6 1.6 0 0 1 4 17.4V6.6Z"/>',
  audit: '<rect x="5" y="5" width="14" height="15.5" rx="2"/><rect x="9" y="3.2" width="6" height="3.4" rx="1.1"/><path d="m8.8 13 2.2 2.2 4.2-4.4"/>',
  privacy: '<path d="M12 3 5.2 5.5v5.4c0 4.05 2.75 7.6 6.8 9.3 4.05-1.7 6.8-5.25 6.8-9.3V5.5L12 3Z"/>',
  locations: '<path d="M12 20.5c4.3-4 6.2-7.05 6.2-10A6.2 6.2 0 0 0 5.8 10.5c0 2.95 1.9 6 6.2 10Z"/><circle cx="12" cy="10.4" r="2.2"/>',
  sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 2.6v2.4M12 19v2.4M4.3 4.3 6 6M18 18l1.7 1.7M2.6 12H5M19 12h2.4M4.3 19.7 6 18M18 6l1.7-1.7"/>',
  moon: '<path d="M20 13.6A7.5 7.5 0 1 1 10.4 4 6 6 0 0 0 20 13.6Z"/>',
  chevron: '<path d="m9.5 6 6 6-6 6"/>',
};
function icon(id, cls) {
  return `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[id] || ''}</svg>`;
}

// ---------- helpers ----------
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function bytesParts(n) {
  if (!n || n < 0) return { v: '0', u: 'B' };
  const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0, v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return { v: v.toFixed(v < 10 && i > 0 ? 1 : 0), u: u[i] };
}
function fmtBytes(n) { const p = bytesParts(n); return `${p.v} ${p.u}`; }
function ago(ms) {
  if (!ms) return '·';
  const d = Date.now() - ms, day = 86400000;
  if (d < 3600000) return Math.max(1, Math.round(d / 60000)) + 'm ago';
  if (d < day) return Math.round(d / 3600000) + 'h ago';
  return Math.round(d / day) + 'd ago';
}
function mark(sev) {
  const s = ['high', 'medium', 'low', 'unknown'].includes(sev) ? sev : 'low';
  return `<span class="mark ${s}"><span class="m-dot"></span>${esc(sev)}</span>`;
}
function figure(val, label, sub, alarm) {
  return `<div class="figure"><div class="fval${alarm ? ' alarm' : ''}">${val}</div><div class="flabel">${esc(label)}</div>${sub ? `<div class="fsub">${esc(sub)}</div>` : ''}</div>`;
}
const figBytes = (n) => { const p = bytesParts(n); return `${p.v}<span class="unit">${p.u}</span>`; };

function mdToHtml(md) {
  if (!md) return '<p class="muted">Empty.</p>';
  let h = esc(md);
  h = h.replace(/```([\s\S]*?)```/g, (m, c) => `<pre class="code">${c.replace(/^\n+|\n+$/g, '')}</pre>`);
  h = h.replace(/^#{4,6}\s?(.*)$/gm, '<h4>$1</h4>')
       .replace(/^###\s?(.*)$/gm, '<h3>$1</h3>')
       .replace(/^##\s?(.*)$/gm, '<h2>$1</h2>')
       .replace(/^#\s?(.*)$/gm, '<h1>$1</h1>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`\n]+?)`/g, '<code>$1</code>');
  h = h.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
  h = h.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, (m) => `<ul>${m}</ul>`);
  h = h.split(/\n{2,}/).map((b) => (/^\s*<(h\d|ul|pre|li)/.test(b) ? b : `<p>${b.replace(/\n/g, '<br>')}</p>`)).join('');
  return h;
}

// ---------- views ----------
function viewOverview(d) {
  const s = d.summary;
  const ledger = [
    figure(figBytes(s.totalBytes), 'Total on disk'),
    figure(figBytes(s.projectsBytes), 'Session history', `${s.transcriptCount} transcripts`),
    figure(String(s.mcpCount), 'Connections', `${s.mcpHigh} high-sensitivity`),
    figure(String(s.skillCount), 'Skills', `${s.pluginCount} plugin${s.pluginCount === 1 ? '' : 's'}`),
    figure(String(s.memoryCount), 'Memory notes'),
    figure(String(s.secretCount), 'Possible secrets', null, s.secretCount > 0),
  ].join('');

  const alerts = d.attention.length
    ? d.attention.map((a) => `
      <button class="alert ${esc(a.level)}" data-goto="${esc(a.view)}">
        <span class="a-dot"></span>
        <span class="alert-body"><span class="alert-title">${esc(a.title)}</span><span class="alert-detail">${esc(a.detail)}</span></span>
        ${icon('chevron', 'a-go')}
      </button>`).join('')
    : `<div class="allclear">Nothing needs your attention right now.</div>`;

  return `
    <div class="ledger">${ledger}</div>
    <div class="section-label">Needs attention <span class="hint">ranked by risk</span></div>
    <div class="attention">${alerts}</div>`;
}

function viewCapabilities(d) {
  const bs = d.mcp.bySeverity;
  const summary = ['high', 'medium', 'low', 'unknown'].map((k) =>
    `<span class="mark ${k}"><span class="m-dot"></span>${bs[k]} ${k === 'unknown' ? 'unrecognized' : k}</span>`).join('');
  const rows = d.mcp.servers.map((s) => `
    <tr>
      <td><div class="cell-name"><strong>${esc(s.name)}</strong>${(s.flags || []).length ? `<span class="flag"><span class="m-dot"></span>${esc(s.flags[0])}</span>` : ''}${s.projectPath ? `<span class="path">${esc(s.projectPath)}</span>` : ''}</div></td>
      <td>${esc(s.category)}</td>
      <td>${mark(s.sensitivity)}</td>
      <td class="mono">${esc(s.target) || '·'}</td>
      <td><span class="tag">${esc(s.scope)}</span></td>
    </tr>`).join('');
  return `
    <p class="intro">Every MCP connection the agent can use. Each one is a door to a service outside your machine. warden classifies how sensitive that door is.</p>
    <div class="chips" style="gap:18px;margin-bottom:6px">${summary}</div>
    ${d.mcp.servers.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Server</th><th>Category</th><th>Sensitivity</th><th>Access / target</th><th>Scope</th></tr></thead>
      <tbody>${rows}</tbody></table></div>` : `<div class="allclear">No MCP connections configured.</div>`}`;
}

function viewRules(d) {
  const st = d.settings, perm = st.permissions;
  const canWrite = controlsOn();
  const permChip = (list, x) => canWrite
    ? `<span class="chip removable">${esc(x)}<button class="chip-x" data-plist="${list}" data-prule="${esc(x)}" title="Remove ${esc(x)}" aria-label="Remove ${esc(x)}">&times;</button></span>`
    : `<span class="chip">${esc(x)}</span>`;
  const chips = (list, arr) => (arr && arr.length ? `<div class="chips">${arr.map((x) => permChip(list, x)).join('')}</div>` : '<span class="muted">none</span>');
  const addForm = canWrite ? `<div class="perm-add">
      <select class="perm-add-list" aria-label="Permission list"><option value="deny">Deny</option><option value="ask">Ask</option><option value="allow">Allow</option></select>
      <input class="perm-add-input" type="text" spellcheck="false" autocomplete="off" placeholder="e.g. Bash(rm:*)" />
      <button class="btn perm-add-btn" type="button" data-perm-add>Add rule</button>
    </div>` : '';
  const hooks = st.hooks.length
    ? `<div class="table-wrap"><table><thead><tr><th>Event</th><th>Matcher</th><th>Command</th>${canWrite ? '<th></th>' : ''}</tr></thead><tbody>
        ${st.hooks.map((h) => `<tr><td>${esc(h.event)}</td><td class="mono">${esc(h.matcher)}</td><td class="mono">${esc(h.command)}</td>${canWrite ? `<td class="col-act"><button class="linkbtn danger" data-hscope="${esc(h.scope)}" data-hevent="${esc(h.event)}" data-hmatcher="${esc(h.matcher)}" data-hcommand="${esc(h.command)}">Disable</button></td>` : ''}</tr>`).join('')}
      </tbody></table></div>`
    : '<p class="muted">No hooks configured. Nothing runs shell commands automatically.</p>';
  const trash = canWrite && state.trash ? state.trash.filter((t) => t.kind === 'permission' || t.kind === 'hook' || t.kind === 'rules') : [];
  const trashBlock = trash.length ? `
    <div class="section-label">warden trash <span class="hint">reversible edits &middot; restore to undo</span></div>
    <div class="panel">${trash.map((t) => `<div class="note-item"><div class="note-head"><span class="note-name">${esc(t.label)}</span><button class="linkbtn" data-restore="${esc(t.id)}" style="margin-left:auto">${t.kind === 'hook' ? 'Re-enable' : 'Undo'}</button></div></div>`).join('')}</div>` : '';
  const projRows = st.projectPermissions.map((p) => `
    <tr><td class="path">${esc(p.path)}</td>
      <td>${p.trusted ? '<span class="tag ok">trusted</span>' : '<span class="tag">untrusted</span>'}</td>
      <td class="mono">${p.allowedTools}</td>
      <td>${p.enabledMcpJson.length ? esc(p.enabledMcpJson.join(', ')) : '<span class="faint">·</span>'}</td></tr>`).join('');

  return `
    ${canWrite ? '<p class="intro">Controls are on. Remove risky allow rules, add denies, or disable a hook. Every change backs up your settings file first and is fully reversible from the trash below.</p>' : ''}
    <div class="panel"><div class="panel-title">Global rules (CLAUDE.md)${canWrite && !state.editingRules ? '<button class="linkbtn" type="button" data-edit-rules style="margin-left:14px">Edit</button>' : ''}</div>
      <div class="panel-sub">${st.globalClaudeMd ? fmtBytes(st.globalClaudeMdBytes) + ' · injected into every session' : 'Not present.'}</div>
      ${canWrite && state.editingRules
        ? `<textarea class="rules-edit" id="rules-textarea" spellcheck="false" aria-label="Global CLAUDE.md">${esc(st.globalClaudeMd || '')}</textarea>
           <div class="edit-actions"><button class="btn" type="button" data-save-rules>Save</button><button class="linkbtn" type="button" data-cancel-rules>Cancel</button><span class="ehint">Backs up the current file first. Undo from the trash.</span></div>`
        : (st.globalClaudeMd ? `<div class="md scroll-box">${mdToHtml(st.globalClaudeMd)}</div>` : (canWrite ? '<p class="muted">No global CLAUDE.md yet. Click Edit to create one.</p>' : ''))}
    </div>
    <div class="grid-2">
      <div class="panel"><div class="panel-title">Permissions</div>
        <div class="panel-sub">Default mode: ${esc(perm.defaultMode || 'unset')}</div>
        <div class="dl">
          <div class="dl-row"><span class="dt">Allow</span><span class="dd">${chips('allow', perm.allow)}</span></div>
          <div class="dl-row"><span class="dt">Ask</span><span class="dd">${chips('ask', perm.ask)}</span></div>
          <div class="dl-row"><span class="dt">Deny</span><span class="dd">${chips('deny', perm.deny)}</span></div>
        </div>
        ${addForm}
      </div>
      <div class="panel"><div class="panel-title">Managed policy</div>
        <div class="panel-sub">Control that lives outside your own settings.</div>
        <div class="dl">
          <div class="dl-row"><span class="dt">Remote</span><span class="dd">${st.remotePresent ? '<span class="tag">present</span>' : '<span class="faint">none</span>'}</span></div>
          <div class="dl-row"><span class="dt">Policy</span><span class="dd">${st.policyPresent ? '<span class="tag">present</span>' : '<span class="faint">none</span>'}</span></div>
          <div class="dl-row"><span class="dt">Model</span><span class="dd">${st.model ? `<span class="tag mono">${esc(st.model)}</span>` : '<span class="faint">default</span>'}</span></div>
        </div>
      </div>
    </div>
    <div class="panel"><div class="panel-title">Hooks</div>
      <div class="panel-sub">Shell commands the agent runs automatically around its actions.</div>${hooks}</div>
    ${trashBlock}
    <div class="section-label">Per-project trust & permissions</div>
    ${st.projectPermissions.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Project</th><th>Trust</th><th>Allowed tools</th><th>Enabled project MCPs</th></tr></thead>
      <tbody>${projRows}</tbody></table></div>` : '<p class="muted">No per-project state recorded.</p>'}`;
}

function viewSkills(d) {
  const skills = d.skills.skills.length
    ? `<div class="table-wrap"><table><thead><tr><th>Skill</th><th>What it does</th></tr></thead><tbody>
        ${d.skills.skills.map((s) => `<tr><td><strong>${esc(s.name)}</strong></td><td class="muted">${esc(s.description) || '·'}</td></tr>`).join('')}
      </tbody></table></div>`
    : '<div class="allclear">No user skills installed.</div>';
  const plugins = d.skills.plugins.length
    ? `<div class="chips">${d.skills.plugins.map((p) => `<span class="chip">${esc(p.name)}</span>`).join('')}</div>`
    : '<span class="muted">none</span>';
  return `
    <p class="intro">Skills and plugins extend what the agent can do. Each one can change its behavior for a whole class of task.</p>
    ${skills}
    <div class="section-label">Plugins</div>${plugins}`;
}

function viewMemory(d) {
  const m = d.memory;
  const canWrite = controlsOn();
  const trash = canWrite && state.trash ? state.trash.filter((t) => t.kind === 'memory') : [];
  if (!m.byProject.length && !trash.length) return '<div class="allclear">No memory notes found.</div>';
  const blocks = m.byProject.map((p) => `
    <div class="panel">
      <div class="panel-title">${esc(p.path.split('/').filter(Boolean).pop() || p.slug)} <span class="tag">${p.noteCount} note${p.noteCount === 1 ? '' : 's'}</span></div>
      <div class="panel-sub path">${esc(p.path)}</div>
      ${p.notes.map((n) => `<div class="note-item">
        <div class="note-head"><span class="note-name">${esc(n.name)}</span>${n.type ? `<span class="tag">${esc(n.type)}</span>` : ''}<span class="note-size">${fmtBytes(n.bytes)}</span>${canWrite ? `<button class="linkbtn danger" data-forget="${esc(p.slug)}::${esc(n.file)}">Forget</button>` : ''}</div>
        ${n.description ? `<div class="note-desc">${esc(n.description)}</div>` : ''}
        ${n.preview ? `<div class="note-preview">${esc(n.preview)}${n.preview.length >= 280 ? '…' : ''}</div>` : ''}
      </div>`).join('')}
    </div>`).join('');
  const trashBlock = trash.length ? `
    <div class="section-label">Trash <span class="hint">moved to ~/.claude/.warden-trash, fully restorable</span></div>
    <div class="panel">
      ${trash.map((t) => `<div class="note-item"><div class="note-head"><span class="note-name">${esc(t.label)}</span><span class="path">${esc(t.slug)}</span><button class="linkbtn" data-restore="${esc(t.id)}" style="margin-left:auto">Restore</button></div></div>`).join('')}
    </div>` : '';
  return `
    <p class="intro">Everything the agent has written down about you, across projects. Bad or stale memories degrade its answers, and some may hold personal data.${canWrite ? ' Forget moves a note to a local trash you can restore; it is never hard-deleted.' : ''}</p>
    <div class="chips" style="gap:16px;margin-bottom:22px"><span class="tag">${m.totalNotes} notes</span><span class="tag">${m.totalEmails} email${m.totalEmails === 1 ? '' : 's'} seen</span></div>
    ${blocks}
    ${trashBlock}`;
}

function viewPersonas(d) {
  const canWrite = controlsOn();
  const pers = d.personas || { saved: [], activeId: null };
  const activeId = pers.activeId;
  const savedCards = (pers.saved || []).map((p) => `
    <div class="panel">
      <div class="panel-title">${esc(p.name)}${p.id === activeId ? ' <span class="tag ok">active</span>' : ''}</div>
      <div class="dl" style="margin-top:12px">
        <div class="dl-row"><span class="dt">Permissions</span><span class="dd mono">${p.allow} allow · ${p.ask} ask · ${p.deny} deny</span></div>
        <div class="dl-row"><span class="dt">Rules</span><span class="dd mono">${p.rulesBytes ? fmtBytes(p.rulesBytes) + ' CLAUDE.md' : 'none'}</span></div>
      </div>
      ${canWrite ? `<div class="edit-actions">${p.id === activeId ? '<span class="faint">current setup</span>' : `<button class="btn" type="button" data-persona-switch="${esc(p.id)}">Switch to this</button>`}<button class="linkbtn danger" data-persona-delete="${esc(p.id)}">Delete</button></div>` : ''}
    </div>`).join('');
  const saveForm = canWrite ? `<div class="persona-save">
      <input class="perm-add-input" id="persona-name" type="text" maxlength="80" spellcheck="false" autocomplete="off" placeholder="Name your current setup, e.g. Client A" />
      <button class="btn" type="button" data-persona-save>Save current setup</button>
    </div>` : '';
  const trash = canWrite && state.trash ? state.trash.filter((t) => t.kind === 'persona-switch' || t.kind === 'persona-def') : [];
  const trashBlock = trash.length ? `
    <div class="section-label">warden trash <span class="hint">restore to undo a switch or bring back a deleted persona</span></div>
    <div class="panel">${trash.map((t) => `<div class="note-item"><div class="note-head"><span class="note-name">${esc(t.label)}</span><button class="linkbtn" data-restore="${esc(t.id)}" style="margin-left:auto">Undo</button></div></div>`).join('')}</div>` : '';
  const previewCards = d.personasPreview.map((p) => `
    <div class="panel">
      <div class="panel-title">${esc(p.name)} ${p.kind === 'active' ? '<span class="tag ok">active</span>' : '<span class="tag">suggested</span>'}</div>
      <div class="dl" style="margin-top:12px">
        <div class="dl-row"><span class="dt">Rules</span><span class="dd">${/[\\/]/.test(p.rules) ? `<span class="path">${esc(p.rules)}</span>` : `<span class="chip">${esc(p.rules)}</span>`}</span></div>
        <div class="dl-row"><span class="dt">Connections</span><span class="dd">${p.mcps.length ? `<div class="chips">${p.mcps.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : '<span class="faint">inherits global</span>'}</span></div>
        ${p.hooks != null ? `<div class="dl-row"><span class="dt">Hooks</span><span class="dd mono">${p.hooks}</span></div>` : ''}
      </div>
      <div class="preview-note">${esc(p.note)}</div>
    </div>`).join('');
  return `
    <p class="intro">A <strong>persona</strong> is a switchable bundle of rules and permissions for one context: a client, a project, a mode of work. ${canWrite ? 'Save your current setup as a persona, then switch between them. Switching rewrites your permissions and CLAUDE.md, backing up the current ones first, so it is fully reversible.' : 'Turn on Controls to save your setup as a persona and switch between them.'}</p>
    <div class="section-label">Your personas</div>
    ${savedCards ? `<div class="grid-2" style="margin-top:14px">${savedCards}</div>` : `<p class="muted">No personas saved yet.${canWrite ? ' Save your current setup below to create one.' : ''}</p>`}
    ${saveForm}
    ${trashBlock}
    <div class="preview-note" style="margin:22px 0 0">Switching applies a persona's rules and permissions today. Connections (MCPs) are shown below but not switched yet; that is the next step.</div>
    <div class="section-label">How your current config maps <span class="hint">read-only</span></div>
    <div class="grid-2" style="margin-top:14px">${previewCards}</div>`;
}

function viewActivity(d) {
  const p = d.projects;
  const canWrite = controlsOn();
  const trash = canWrite && state.trash ? state.trash : [];
  const staged = trash.reduce((s, t) => s + (t.bytes || 0), 0);
  const rows = p.items.map((it) => {
    const name = it.path.split('/').filter(Boolean).pop() || it.slug;
    return `
    <tr>
      <td><div class="cell-name"><strong>${esc(name)}</strong><span class="path">${esc(it.path)}</span></div></td>
      <td class="mono">${fmtBytes(it.bytes)}</td>
      <td class="mono">${it.sessions}</td>
      <td class="mono">${ago(it.lastActiveMs)}</td>
      <td>${it.trusted ? '<span class="tag ok">trusted</span>' : '<span class="faint">·</span>'}</td>
      <td>${it.hasMemory ? '<span class="tag">memory</span> ' : ''}${it.hasProjectClaudeMd ? '<span class="tag">rules</span>' : ''}</td>
      ${canWrite ? `<td class="col-act">${it.sessions ? `<button class="linkbtn danger" data-archive="${esc(it.slug)}" data-name="${esc(name)}">Archive</button>` : '<span class="faint">·</span>'}</td>` : ''}
    </tr>`;
  }).join('');
  const trashBlock = canWrite && trash.length ? `
    <div class="section-label">warden trash <span class="hint">staged for deletion · restore anytime, or empty to free ${fmtBytes(staged)}</span></div>
    <div class="panel">
      ${trash.map((t) => `<div class="note-item"><div class="note-head"><span class="note-name">${esc(t.label)}</span><span class="tag">${t.kind === 'transcript' ? (t.count + ' transcript' + (t.count === 1 ? '' : 's')) : 'note'}</span><span class="note-size">${fmtBytes(t.bytes || 0)}</span><button class="linkbtn" data-restore="${esc(t.id)}" style="margin-left:14px">Restore</button><button class="linkbtn danger" data-purge="${esc(t.id)}" style="margin-left:14px">Delete</button></div></div>`).join('')}
      <div class="trash-foot"><button class="btn danger" data-empty-trash>Empty trash — free ${fmtBytes(staged)}</button><span class="hint">permanent, and only you can trigger it</span></div>
    </div>` : '';
  return `
    <p class="intro">Claude keeps a full transcript of every session. It is the largest and most sensitive store on your machine, and it is never cleaned up on its own.${canWrite ? ' Archive moves a project\'s transcripts to a local trash you can restore; nothing is freed until you empty it.' : ''}</p>
    <div class="ledger">
      ${figure(figBytes(p.totalBytes), 'Session history', 'on disk now')}
      ${figure(String(p.totalSessions), 'Transcripts', `across ${p.items.length} projects`)}
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Project</th><th>Size</th><th>Sessions</th><th>Last active</th><th>Trust</th><th>Has</th>${canWrite ? '<th></th>' : ''}</tr></thead>
      <tbody>${rows}</tbody></table></div>
    ${trashBlock}`;
}

function viewAudit(d) {
  const a = d.activity || { entries: [], count: 0, integrity: 'empty', brokenAt: null };
  const integ = a.integrity === 'verified'
    ? '<span class="statuspill"><span class="s-dot ok"></span>Integrity verified</span>'
    : a.integrity === 'broken'
      ? `<span class="statuspill"><span class="s-dot high"></span>Chain broken${a.brokenAt ? ' at #' + a.brokenAt : ''}</span>`
      : '<span class="statuspill"><span class="s-dot"></span>No entries yet</span>';
  const rows = a.entries.map((e) => `
    <tr>
      <td class="mono">${e.seq}</td>
      <td class="mono">${esc(new Date(e.at).toLocaleString())}</td>
      <td>${esc(e.summary)}</td>
      <td>${e.reversible ? '<span class="tag">reversible</span>' : '<span class="flag"><span class="m-dot"></span>permanent</span>'}</td>
    </tr>`).join('');
  return `
    <p class="intro">Every change warden makes is recorded here, each entry cryptographically chained to the one before it. Alter or remove any entry and the chain breaks, so the record is tamper-evident. It is local, append-only, and never leaves your machine.</p>
    <div class="chips" style="gap:16px;margin-bottom:22px">${integ}<span class="statuspill"><span class="s-dot"></span>${a.count} change${a.count === 1 ? '' : 's'} logged</span></div>
    ${a.entries.length
      ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>When</th><th>Change</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
      : '<div class="allclear">No changes recorded yet. When you use a control (with Controls on), it appears here.</div>'}`;
}

function viewPrivacy(d) {
  const f = d.secretFindings;
  const secretCard = f.length
    ? `<div class="table-wrap"><table><thead><tr><th>Type</th><th>Confidence</th><th>Where</th><th>Masked sample</th></tr></thead><tbody>
        ${f.map((x) => `<tr><td>${esc(x.type)}</td><td>${mark(x.severity)}</td><td class="mono">${esc(x.source)}</td><td class="mono">${esc(x.sample)}</td></tr>`).join('')}
      </tbody></table></div>`
    : '<div class="allclear">No secret patterns detected in the scanned data.</div>';
  const t = d.telemetry;
  return `
    <p class="intro">Two questions: is anything sensitive sitting in your local files, and is any data leaving the device?</p>
    <div class="section-label">Secrets & PII on disk <span class="hint">memory scanned fully · ${fmtBytes(d.coverage.transcriptBytesScanned)} of recent transcripts sampled</span></div>
    ${secretCard}
    <div class="section-label">Telemetry & egress</div>
    <div class="ledger">
      ${figure(figBytes(t.bytes), 'Telemetry on disk', `${t.files} files`)}
      ${figure(String(t.failedEvents), 'Failed / queued events', 'tried to leave, still here', t.failedEvents > 0)}
    </div>
    ${t.samples.length ? `<div class="panel"><div class="panel-sub">Sample telemetry files</div><div class="chips">${t.samples.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div></div>` : ''}
    <div class="statuspill" style="margin-top:18px"><span class="s-dot ok"></span>This scan ran entirely on your machine. warden makes no network calls and sends nothing anywhere.</div>`;
}

function viewLocations(d) {
  const rows = d.locations.map((l) => `
    <tr>
      <td><div class="cell-name"><strong>${esc(l.label)}</strong><span class="path">${esc(l.path)}</span></div></td>
      <td class="mono">${l.present ? `${fmtBytes(l.bytes)}${l.isDir ? `<div class="faint">${l.files} files</div>` : ''}` : '<span class="faint">absent</span>'}</td>
      <td class="muted">${esc(l.what)}<div class="faint" style="margin-top:5px">${esc(l.why)}</div></td>
    </tr>`).join('');
  return `
    <p class="intro">Every place Claude Code stores something, what it is, and why it matters. This is the map most people never see.</p>
    <div class="table-wrap"><table>
      <thead><tr><th>Location</th><th>Size</th><th>What it is / why it matters</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
}

const RENDERERS = {
  overview: viewOverview, capabilities: viewCapabilities, rules: viewRules, skills: viewSkills,
  memory: viewMemory, personas: viewPersonas, activity: viewActivity, audit: viewAudit, privacy: viewPrivacy, locations: viewLocations,
};

// ---------- theme ----------
function effectiveTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function paintThemeIcon() {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = icon(effectiveTheme() === 'dark' ? 'sun' : 'moon');
}
function toggleTheme() {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('warden-theme', next); } catch (e) {}
  paintThemeIcon();
}

// ---------- controls (Phase 2: opt-in, reversible writes) ----------
function isDemo() { return !!(state.data && state.data.demo); }
function controlsOn() {
  try {
    const q = new URL(location.href).searchParams.get('controls');
    if (q === '1') return true;
    if (q === '0') return false;
    const ls = localStorage.getItem('warden-controls');
    if (ls === '1') return true;
    if (ls === '0') return false;
    return isDemo();   // default: on in the demo (to show the control layer), off on a real machine
  } catch (e) { return false; }
}
function paintControls() {
  const on = controlsOn();
  const demo = isDemo();
  const btn = document.getElementById('controls-toggle');
  if (btn) { btn.textContent = on ? 'Controls: on' : 'Controls: off'; btn.style.display = ''; }
  const pill = document.getElementById('ro-pill');
  if (pill) {
    const label = !on ? 'Read-only' : (demo ? 'Preview controls' : 'Controls on');
    pill.innerHTML = `<span class="s-dot ${on ? 'medium' : 'ok'}"></span>${label}`;
  }
}
function toggleControls() {
  try { localStorage.setItem('warden-controls', controlsOn() ? '0' : '1'); } catch (e) {}
  paintControls(); render();
}
// In the demo, controls are shown but write nothing: each action explains what warden would do.
let toastTimer = null;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
}
function previewMsg(action, a) {
  a = a || {};
  switch (action) {
    case 'forgetMemory': return 'Warden would move this note to a local trash you can restore. Nothing is written in the demo.';
    case 'archiveTranscripts': return 'Warden would archive this project’s transcripts to a restorable trash. Nothing is written in the demo.';
    case 'editPermission': return `Warden would ${a.op === 'remove' ? 'remove' : 'add'} the ${a.list} rule, backing up settings.json first. Nothing is written in the demo.`;
    case 'disableHook': return 'Warden would disable this hook so it stops running, reversibly. Nothing is written in the demo.';
    case 'editRules': return 'Warden would save your CLAUDE.md, backing up the current file first. Nothing is written in the demo.';
    case 'savePersona': return 'Warden would save your current permissions and rules as a persona. Nothing is written in the demo.';
    case 'switchPersona': return 'Warden would apply this persona’s rules and permissions, backing up your current ones first. Nothing is written in the demo.';
    case 'deletePersona': return 'Warden would delete this saved persona, reversibly. Nothing is written in the demo.';
    case 'restore': return 'Warden would restore this item from the trash. Nothing is written in the demo.';
    case 'purgeItem': return 'Warden would permanently delete this archived item. Nothing is written in the demo.';
    case 'emptyTrash': return 'Warden would permanently empty the trash and free the space. Nothing is written in the demo.';
    default: return 'On your own machine this edits your real config. Nothing is written in the demo.';
  }
}
async function doAction(action, args, confirmMsg) {
  if (isDemo()) { toast(previewMsg(action, args)); return; }
  if (confirmMsg && !window.confirm(confirmMsg)) return;
  try {
    const res = await fetch('/api/action', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, ...args }) });
    const r = await res.json();
    if (!r.ok) { window.alert('Could not complete: ' + (r.error || 'unknown error')); return; }
    await scan();
  } catch (e) { window.alert('Action failed: ' + e); }
}

// ---------- shell ----------
function navCount(id, s) {
  switch (id) {
    case 'capabilities': return { n: s.mcpCount, alarm: s.mcpHigh > 0 };
    case 'skills': return { n: s.skillCount };
    case 'memory': return { n: s.memoryCount };
    case 'activity': return { n: s.projectCount };
    case 'privacy': return { n: s.secretCount, alarm: s.secretCount > 0 };
    default: return null;
  }
}
function renderNav() {
  const nav = document.getElementById('nav');
  const s = state.data && state.data.summary;
  nav.innerHTML = VIEWS.map((v) => {
    const c = s ? navCount(v.id, s) : null;
    const badge = c && c.n != null ? `<span class="nav-count${c.alarm ? ' alarm' : ''}">${c.n}</span>` : '';
    return `<button class="nav-item${v.id === state.view ? ' active' : ''}" data-view="${v.id}">${icon(v.ic, 'nav-ic')}<span>${esc(v.label)}</span>${badge}</button>`;
  }).join('');
}
function render() {
  const v = VIEWS.find((x) => x.id === state.view);
  document.getElementById('view-title').textContent = v.label;
  document.getElementById('view-sub').textContent = v.sub;
  renderNav();
  paintControls();
  const host = document.getElementById('view');
  if (!state.data) { host.innerHTML = '<div class="loading">Scanning your machine…</div>'; return; }
  if (!state.data.claudeDirExists) { host.innerHTML = '<div class="allclear">No ~/.claude directory found on this machine.</div>'; return; }
  host.innerHTML = RENDERERS[state.view](state.data);
  host.classList.remove('enter'); void host.offsetWidth; host.classList.add('enter');
}
function setView(id) {
  if (!RENDERERS[id]) return;
  state.view = id;
  state.editingRules = false;
  try { if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id); } catch (e) {}
  render();
  window.scrollTo(0, 0);
}

async function scan() {
  const at = document.getElementById('scanned-at');
  // Static mode (window.WARDEN_STATIC) powers the hosted demo: the same UI runs
  // fully client-side against a bundled scan.json, with no server behind it.
  const isStatic = !!window.WARDEN_STATIC;
  let demo = isStatic;
  try { if (!isStatic) demo = new URL(location.href).searchParams.get('demo') === '1'; } catch (e) {}
  at.textContent = isStatic ? 'loading demo…' : 'scanning…';
  document.getElementById('view').innerHTML = `<div class="loading">${demo ? 'Loading demo…' : 'Scanning your machine…'}</div>`;
  try {
    const res = await fetch(isStatic ? 'scan.json' : '/api/scan' + (demo ? '?demo=1' : ''));
    state.data = await res.json();
    if (!state.data.demo) { try { state.trash = (await (await fetch('/api/trash')).json()).items || []; } catch (e) { state.trash = []; } } else { state.trash = []; }
    at.textContent = state.data.demo ? 'demo data · not a real machine' : 'scanned ' + new Date(state.data.generatedAt).toLocaleTimeString();
  } catch (e) {
    document.getElementById('view').innerHTML = `<div class="allclear">Scan failed: ${esc(String(e))}</div>`;
    at.textContent = '';
    return;
  }
  render();
}

document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-view]');
  if (nav) return setView(nav.dataset.view);
  const goto = e.target.closest('[data-goto]');
  if (goto) return setView(goto.dataset.goto);
  const forget = e.target.closest('[data-forget]');
  if (forget) { const [slug, file] = forget.dataset.forget.split('::'); return doAction('forgetMemory', { slug, file }, `Move "${file}" to warden trash? You can restore it anytime.`); }
  const restore = e.target.closest('[data-restore]');
  if (restore) return doAction('restore', { id: restore.dataset.restore });
  const archive = e.target.closest('[data-archive]');
  if (archive) { const slug = archive.dataset.archive; const name = archive.dataset.name || 'this project'; return doAction('archiveTranscripts', { slug }, `Archive all transcripts for "${name}"? They move to warden trash and can be restored. Nothing is deleted.`); }
  const purge = e.target.closest('[data-purge]');
  if (purge) { if (isDemo()) return toast(previewMsg('purgeItem')); const t = window.prompt('Permanently delete this archived item and free its space? This cannot be undone.\n\nType PURGE to confirm:'); if (t === 'PURGE') return doAction('purgeItem', { id: purge.dataset.purge, confirm: 'PURGE' }); return; }
  const empty = e.target.closest('[data-empty-trash]');
  if (empty) { if (isDemo()) return toast(previewMsg('emptyTrash')); const t = window.prompt('This permanently deletes everything in warden trash and frees the space. This cannot be undone.\n\nType EMPTY to confirm:'); if (t === 'EMPTY') return doAction('emptyTrash', { confirm: 'EMPTY' }); return; }
  const permRm = e.target.closest('[data-plist]');
  if (permRm) { const list = permRm.dataset.plist, rule = permRm.dataset.prule; return doAction('editPermission', { list, rule, op: 'remove' }, `Remove ${list} rule "${rule}"? You can undo it from the trash.`); }
  const permAdd = e.target.closest('[data-perm-add]');
  if (permAdd) { const box = permAdd.closest('.perm-add'); const list = box.querySelector('.perm-add-list').value; const rule = box.querySelector('.perm-add-input').value.trim(); if (!rule) return; return doAction('editPermission', { list, rule, op: 'add' }); }
  const hookDis = e.target.closest('[data-hcommand]');
  if (hookDis) { const h = hookDis.dataset; return doAction('disableHook', { scope: h.hscope, event: h.hevent, matcher: h.hmatcher, command: h.hcommand }, 'Disable this hook so it no longer runs automatically? You can re-enable it from the trash.'); }
  const editRulesBtn = e.target.closest('[data-edit-rules]');
  if (editRulesBtn) { state.editingRules = true; return render(); }
  const cancelRules = e.target.closest('[data-cancel-rules]');
  if (cancelRules) { state.editingRules = false; return render(); }
  const saveRules = e.target.closest('[data-save-rules]');
  if (saveRules) { const ta = document.getElementById('rules-textarea'); if (!ta) return; const content = ta.value; state.editingRules = false; render(); return doAction('editRules', { content }); }
  const pSwitch = e.target.closest('[data-persona-switch]');
  if (pSwitch) return doAction('switchPersona', { id: pSwitch.dataset.personaSwitch }, 'Switch to this persona? It rewrites your permissions and CLAUDE.md, backing up the current ones first. Reversible from the trash.');
  const pDelete = e.target.closest('[data-persona-delete]');
  if (pDelete) return doAction('deletePersona', { id: pDelete.dataset.personaDelete }, 'Delete this saved persona? You can undo it from the trash.');
  const pSave = e.target.closest('[data-persona-save]');
  if (pSave) { const inp = document.getElementById('persona-name'); const name = inp ? inp.value.trim() : ''; if (!name) { if (inp) inp.focus(); return; } return doAction('savePersona', { name }); }
});
document.getElementById('rescan').addEventListener('click', scan);
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
document.getElementById('controls-toggle').addEventListener('click', toggleControls);
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintThemeIcon);
}

const initialView = (location.hash || '').slice(1);
if (RENDERERS[initialView]) state.view = initialView;
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (RENDERERS[h] && h !== state.view) setView(h); });

paintThemeIcon();
paintControls();
renderNav();
scan();
