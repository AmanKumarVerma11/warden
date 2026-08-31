// Synthetic demo dataset. Returns the exact shape of fullScan() so the UI renders
// it unchanged, but with fictional data. Used for public screenshots and for letting
// people try warden without pointing it at their own machine. Reads nothing.

const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;
const KB = 1024;
const ago = (ms) => Date.now() - ms;
const HOUR = 3600000, DAY = 86400000;

const MCP = [
  { name: 'stripe', scope: 'global', projectPath: null, category: 'Payments', sensitivity: 'high', transport: 'stdio',
    target: 'npx @stripe/mcp --tools=all', flags: ['write / unrestricted access'], envKeys: ['STRIPE_SECRET_KEY=sk_l…x9Qa'], hasSecrets: true },
  { name: 'postgres-prod', scope: 'global', projectPath: null, category: 'Database', sensitivity: 'high', transport: 'stdio',
    target: 'docker run … crystaldba/postgres-mcp --access-mode=unrestricted', flags: ['write / unrestricted access'], envKeys: ['DATABASE_URI=post…3b2f'], hasSecrets: true },
  { name: 'aws', scope: 'global', projectPath: null, category: 'Cloud infrastructure', sensitivity: 'high', transport: 'stdio',
    target: 'uvx awslabs.core-mcp-server', flags: [], envKeys: ['AWS_ACCESS_KEY_ID=AKIA…M7QR', 'AWS_SECRET_ACCESS_KEY=•••'], hasSecrets: true },
  { name: 'github', scope: 'global', projectPath: null, category: 'Version control', sensitivity: 'high', transport: 'stdio',
    target: 'npx @modelcontextprotocol/server-github', flags: [], envKeys: ['GITHUB_TOKEN=ghp_…4KdP'], hasSecrets: true },
  { name: 'slack', scope: 'global', projectPath: null, category: 'Communication', sensitivity: 'medium', transport: 'stdio',
    target: 'npx @modelcontextprotocol/server-slack', flags: [], envKeys: ['SLACK_BOT_TOKEN=xoxb…9f2a'], hasSecrets: true },
  { name: 'linear', scope: 'project', projectPath: '/Users/alex/code/billing-service', category: 'Issue tracking / docs', sensitivity: 'medium', transport: 'stdio',
    target: 'npx linear-mcp', flags: [], envKeys: ['LINEAR_API_KEY=lin_…8xQ2'], hasSecrets: true },
  { name: 'exa-search', scope: 'global', projectPath: null, category: 'Search / web', sensitivity: 'low', transport: 'http/sse',
    target: 'mcp.exa.ai', flags: [], envKeys: [], hasSecrets: false },
];

const SECRETS = [
  { type: 'Stripe live key', severity: 'high', source: 'transcript · billing-service (recent)', sample: 'sk_l…x9Qa' },
  { type: 'AWS access key id', severity: 'high', source: 'memory · infra-credentials.md', sample: 'AKIA…M7QR' },
  { type: 'JWT', severity: 'medium', source: 'transcript · acme-api (recent)', sample: 'eyJh…k2Qw' },
];

const PROJECTS = [
  { path: '/Users/alex/code/acme-api', bytes: 780 * MB, files: 512, sessions: 42, lastActiveMs: ago(3 * HOUR), hasMemory: true, hasProjectClaudeMd: true, hasProjectDotClaude: true, trusted: true, allowedTools: 12 },
  { path: '/Users/alex/code/acme-web', bytes: 486 * MB, files: 388, sessions: 31, lastActiveMs: ago(1 * DAY), hasMemory: true, hasProjectClaudeMd: true, hasProjectDotClaude: true, trusted: true, allowedTools: 8 },
  { path: '/Users/alex/code/billing-service', bytes: 410 * MB, files: 297, sessions: 28, lastActiveMs: ago(5 * HOUR), hasMemory: true, hasProjectClaudeMd: true, hasProjectDotClaude: true, trusted: true, allowedTools: 15 },
  { path: '/Users/alex/code/infra', bytes: 95 * MB, files: 141, sessions: 19, lastActiveMs: ago(2 * DAY), hasMemory: false, hasProjectClaudeMd: true, hasProjectDotClaude: true, trusted: true, allowedTools: 6 },
  { path: '/Users/alex/side/blog', bytes: 12 * MB, files: 44, sessions: 8, lastActiveMs: ago(6 * DAY), hasMemory: false, hasProjectClaudeMd: false, hasProjectDotClaude: false, trusted: false, allowedTools: 0 },
].map((p) => ({ slug: p.path.replace(/\//g, '-'), ...p }));

const CLAUDE_MD = `# Global rules

## Engineering defaults
- TypeScript strict everywhere. No \`any\` without a comment explaining why.
- Tests colocated with source. Run \`pnpm test\` before proposing a change is done.
- Never commit secrets. Read from the environment.

## Safety
- Never run a destructive command (\`rm -rf\`, \`DROP\`, \`TRUNCATE\`) without explicit approval.
- Production database access is read-only unless I say otherwise in the same message.
- Ask before \`git push\` and before opening a pull request.

## Voice
- Be concise. Lead with the answer, then the reasoning.
`;

const MEMORY = [
  { path: '/Users/alex/code/acme-api', notes: [
    { name: 'stack-conventions', description: 'TypeScript strict, Vitest, pnpm workspaces', type: 'project', bytes: 412, preview: 'API is a Fastify service. Validation with zod. Errors go through the central problem+json handler.' },
    { name: 'deploy-process', description: 'CI deploys on merge to main via GitHub Actions', type: 'project', bytes: 298, preview: 'main → staging automatically. Production is a manual approval step in the Actions run.' },
    { name: 'db-schema-notes', description: 'Multi-tenant; every table carries org_id', type: 'project', bytes: 356, preview: 'Row-level security is on. Never write a query without an org_id predicate.' },
  ] },
  { path: '/Users/alex/code/billing-service', notes: [
    { name: 'stripe-integration', description: 'Webhooks + idempotency keys; test mode by default', type: 'project', bytes: 388, preview: 'All Stripe calls carry an idempotency key. Webhook signatures verified before processing.' },
    { name: 'invoice-rounding', description: 'Round half-to-even at the line level, not the total', type: 'reference', bytes: 210, preview: 'Finance confirmed banker rounding per line item. Do not change without their sign-off.' },
  ] },
  { path: '/Users/alex/code/infra', notes: [
    { name: 'infra-credentials', description: 'Where infra secrets live (and where they must not)', type: 'reference', bytes: 264, preview: 'Secrets are in AWS Secrets Manager. Do not paste keys into terminals or notes.' },
  ] },
  { path: '/Users/alex', notes: [
    { name: 'user-prefers-concise', description: 'Alex likes short answers and direct recommendations', type: 'feedback', bytes: 180, preview: 'Skip the preamble. Give the recommendation first, then a one-line why.' },
    { name: 'timezone', description: 'Works in America/New_York', type: 'user', bytes: 120, preview: 'Schedule and relative dates are Eastern time.' },
  ] },
].map((p) => ({ slug: p.path.replace(/\//g, '-'), path: p.path, noteCount: p.notes.length, notes: p.notes.map((n) => ({ file: `${n.name}.md`, ...n })), hasIndex: true }));

const SKILLS = [
  { name: 'code-review', description: 'Review a diff for security, performance and correctness before merge' },
  { name: 'deploy-checklist', description: 'Pre-deploy verification: migrations, flags, rollback plan' },
  { name: 'pr-description', description: 'Draft a pull request description from the staged diff' },
  { name: 'sql-optimizer', description: 'Explain a slow query and propose indexes' },
  { name: 'incident-runbook', description: 'Walk an on-call incident: triage, comms, postmortem' },
  { name: 'test-writer', description: 'Generate table-driven tests for a target module' },
  { name: 'changelog', description: 'Summarize merged PRs into a release changelog' },
  { name: 'threat-model', description: 'Draft a lightweight threat model for a new feature' },
  { name: 'sdk-migrator', description: 'Port code across a breaking SDK version bump' },
].map((s) => ({ ...s, path: `/Users/alex/.claude/skills/${s.name}` }));

const LOCATIONS = [
  { id: 'bigConfig', label: 'Global config & MCP registry', path: '/Users/alex/.claude.json', category: 'config', present: true, bytes: 82 * KB, files: 1,
    what: 'The main config file. Holds your MCP server connections, per-project trust and permission state, and your account link.',
    why: 'The single most powerful file on your machine. It defines what external services the agent can reach. It lives loose in your home folder, not inside ~/.claude.' },
  { id: 'userSettings', label: 'User settings', path: '/Users/alex/.claude/settings.json', category: 'config', present: true, bytes: 1.4 * KB, files: 1,
    what: 'Your global Claude Code settings: permissions, hooks, environment variables, and model choice.', why: 'Applies to every project unless a project overrides it.' },
  { id: 'globalClaudeMd', label: 'Global rules (CLAUDE.md)', path: '/Users/alex/.claude/CLAUDE.md', category: 'rules', present: true, bytes: 1.2 * KB, files: 1,
    what: 'Instructions injected into every session, across every project.', why: 'These rules shape everything the agent does. Worth knowing exactly what they say.' },
  { id: 'remoteSettings', label: 'Managed / remote settings', path: '/Users/alex/.claude/remote-settings.json', category: 'governance', present: true, bytes: 0.6 * KB, files: 1,
    what: 'Settings pushed from an organization or a remote policy source.', why: 'Someone other than you may be controlling behavior through this file.' },
  { id: 'skillsDir', label: 'Skills', path: '/Users/alex/.claude/skills', category: 'capability', isDir: true, present: true, bytes: 5.1 * MB, files: 63,
    what: 'Installed skills, the packaged instructions the agent can invoke on demand.', why: 'Each skill can change how the agent behaves for a whole class of task.' },
  { id: 'pluginsDir', label: 'Plugins', path: '/Users/alex/.claude/plugins', category: 'capability', isDir: true, present: true, bytes: 18 * MB, files: 214,
    what: 'Installed plugins, which can bundle skills, MCP servers, hooks, and commands together.', why: 'A single plugin can add many capabilities at once.' },
  { id: 'projectsDir', label: 'Session history & memory', path: '/Users/alex/.claude/projects', category: 'data', isDir: true, present: true, bytes: 1783 * MB, files: 1482,
    what: 'Full transcripts of your sessions, plus per-project memory notes.', why: 'Usually the largest and most sensitive store, a complete record of your work.' },
  { id: 'telemetryDir', label: 'Telemetry', path: '/Users/alex/.claude/telemetry', category: 'privacy', isDir: true, present: true, bytes: 6.2 * MB, files: 40,
    what: 'Product analytics and event data, including events queued or failed to send.', why: 'This is data about you leaving, or trying to leave, the device.' },
  { id: 'backupsDir', label: 'Backups', path: '/Users/alex/.claude/backups', category: 'data', isDir: true, present: true, bytes: 940 * KB, files: 22,
    what: 'Automatic backups of config and files.', why: 'Old copies of your settings can persist here after you change them.' },
  { id: 'shellSnapshotsDir', label: 'Shell snapshots', path: '/Users/alex/.claude/shell-snapshots', category: 'data', isDir: true, present: true, bytes: 210 * KB, files: 31,
    what: 'Captured shell-environment snapshots used during sessions.', why: 'Can contain environment details from your terminal.' },
];

export function demoModel() {
  const projectsBytes = PROJECTS.reduce((s, p) => s + p.bytes, 0);
  const totalSessions = PROJECTS.reduce((s, p) => s + p.sessions, 0);
  const totalNotes = MEMORY.reduce((s, p) => s + p.noteCount, 0);
  const totalBytes = LOCATIONS.reduce((s, l) => s + l.bytes, 0);
  const bySeverity = { high: 0, medium: 0, low: 0, unknown: 0 };
  for (const s of MCP) bySeverity[s.sensitivity]++;

  const hooks = [
    { event: 'PreToolUse', matcher: 'Bash', type: 'command', command: '~/.claude/hooks/guard.sh', scope: 'user' },
    { event: 'Stop', matcher: '*', type: 'command', command: "osascript -e 'display notification \"Claude finished\"'", scope: 'user' },
  ];

  const attention = [
    { level: 'high', title: '4 high-sensitivity connections', detail: 'The agent can reach Payments, Database, Cloud infrastructure, Version control. Review exactly what each one can touch.', view: 'capabilities' },
    { level: 'high', title: '2 connections can write, not just read', detail: 'stripe, postgres-prod run with write / unrestricted access. The agent can modify data there, not only read it.', view: 'capabilities' },
    { level: 'high', title: 'Possible secrets in local data', detail: '3 pattern matches in memory notes and recent transcripts (2 high-confidence), including a live payment key.', view: 'privacy' },
    { level: 'medium', title: '2 hooks auto-run commands', detail: "Shell commands the agent runs automatically around its actions. Know what they do.", view: 'rules' },
    { level: 'info', title: 'Managed policy is active', detail: 'Remote settings / policy limits are present, and some behavior is controlled outside your own settings.', view: 'rules' },
    { level: 'info', title: '1.7 GB of session history on disk', detail: '128 transcripts across 5 projects. A full record of your work.', view: 'activity' },
    { level: 'info', title: '14 failed telemetry events queued', detail: 'Analytics data that tried to leave the device and is still sitting on disk.', view: 'privacy' },
  ];

  const personasPreview = [
    { id: 'default', name: 'Default (global)', kind: 'active', rules: 'Global CLAUDE.md', mcps: MCP.filter((m) => m.scope === 'global').map((m) => m.name), hooks: hooks.length, note: 'What every project inherits today.' },
    ...PROJECTS.slice(0, 5).map((p) => ({ id: p.slug, name: p.path.split('/').pop(), kind: 'suggested', rules: p.path, mcps: MCP.filter((m) => m.projectPath === p.path).map((m) => m.name), allowedTools: p.allowedTools, trusted: p.trusted, note: 'Detected context, could become a switchable persona.' })),
  ];

  return {
    generatedAt: new Date().toISOString(),
    home: '/Users/alex', claudeDir: '/Users/alex/.claude', claudeDirExists: true, demo: true,
    summary: {
      totalBytes, projectsBytes, transcriptCount: totalSessions, projectCount: PROJECTS.length,
      mcpCount: MCP.length, mcpHigh: bySeverity.high, skillCount: SKILLS.length, pluginCount: 3,
      memoryCount: totalNotes, hookCount: hooks.length, secretCount: SECRETS.length, telemetryBytes: 6.2 * MB,
    },
    attention,
    locations: LOCATIONS,
    settings: {
      userSettingsPresent: true, localSettingsPresent: true, managedPresent: true, remotePresent: true, policyPresent: true, model: null,
      permissions: { allow: ['Read', 'Grep', 'Bash(pnpm test:*)', 'Edit'], deny: ['Read(./.env)', 'Read(./secrets/**)'], ask: ['Bash(git push:*)', 'Bash(gh pr create:*)'], defaultMode: 'acceptEdits' },
      hooks, env: { NODE_ENV: 'development', WARDEN_DEMO: '1' },
      globalClaudeMd: CLAUDE_MD, globalClaudeMdBytes: Buffer.byteLength(CLAUDE_MD),
      projectPermissions: PROJECTS.map((p) => ({ slug: p.slug, path: p.path, allowedTools: p.allowedTools, trusted: p.trusted, enabledMcpJson: p.path.endsWith('billing-service') ? ['linear'] : [], disabledMcpJson: [] })),
    },
    mcp: { servers: MCP, count: MCP.length, bySeverity },
    skills: { skills: SKILLS, plugins: [{ name: 'engineering', type: 'dir', path: '/Users/alex/.claude/plugins/engineering' }, { name: 'productivity', type: 'dir', path: '/Users/alex/.claude/plugins/productivity' }, { name: 'security-review', type: 'dir', path: '/Users/alex/.claude/plugins/security-review' }] },
    memory: { byProject: MEMORY, totalNotes, totalEmails: 2, secretFindings: [SECRETS[1]] },
    projects: { items: PROJECTS.slice().sort((a, b) => b.bytes - a.bytes), totalBytes: projectsBytes, totalSessions, transcriptSecretFindings: [SECRETS[0], SECRETS[2]], scannedBytes: 8 * MB },
    telemetry: { present: true, bytes: 6.2 * MB, files: 40, failedEvents: 14, samples: ['1p_failed_events.a1c9…json', '1p_failed_events.7f20…json', 'metrics.session.json', 'events.buffer.jsonl'] },
    personasPreview,
    personas: {
      saved: [
        { id: 'demo-client-acme', name: 'Acme (client, locked down)', allow: 3, ask: 4, deny: 6, rulesBytes: 2100, createdAt: '2026-08-18T10:00:00.000Z' },
        { id: 'demo-personal', name: 'Personal projects', allow: 9, ask: 1, deny: 1, rulesBytes: 540, createdAt: '2026-08-09T14:30:00.000Z' },
        { id: 'demo-review', name: 'Read-only review', allow: 4, ask: 0, deny: 8, rulesBytes: 1280, createdAt: '2026-08-22T09:15:00.000Z' },
      ],
      activeId: 'demo-personal',
    },
    secretFindings: SECRETS,
    coverage: { transcriptBytesScanned: 8 * MB },
  };
}
