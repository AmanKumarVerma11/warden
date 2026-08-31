// The canonical map of where Claude Code stores things on disk, in plain English.
// This map is the core knowledge warden is built on: a non-expert should be able to
// read it and understand what every location is and why it matters.

import path from 'node:path';
import { CLAUDE_DIR, BIG_CONFIG } from './util.js';

export function knownLocations() {
  return [
    {
      id: 'bigConfig', label: 'Global config & MCP registry', path: BIG_CONFIG, category: 'config',
      what: 'The main config file. Holds your MCP server connections, per-project trust and permission state, and your account link.',
      why: 'The single most powerful file on your machine. It defines what external services the agent can reach. It lives loose in your home folder, not inside ~/.claude.',
    },
    {
      id: 'userSettings', label: 'User settings', path: path.join(CLAUDE_DIR, 'settings.json'), category: 'config',
      what: 'Your global Claude Code settings: permissions, hooks, environment variables, and model choice.',
      why: 'Applies to every project unless a project overrides it.',
    },
    {
      id: 'localSettings', label: 'Local settings override', path: path.join(CLAUDE_DIR, 'settings.local.json'), category: 'config',
      what: 'Machine-local settings overrides that are not meant to be shared.',
      why: 'Can silently change behavior on this machine only.',
    },
    {
      id: 'globalClaudeMd', label: 'Global rules (CLAUDE.md)', path: path.join(CLAUDE_DIR, 'CLAUDE.md'), category: 'rules',
      what: 'Instructions injected into every session, across every project.',
      why: 'These rules shape everything the agent does. Worth knowing exactly what they say.',
    },
    {
      id: 'remoteSettings', label: 'Managed / remote settings', path: path.join(CLAUDE_DIR, 'remote-settings.json'), category: 'governance',
      what: 'Settings pushed from an organization or a remote policy source.',
      why: 'Someone other than you may be controlling behavior through this file.',
    },
    {
      id: 'policyLimits', label: 'Policy limits', path: path.join(CLAUDE_DIR, 'policy-limits.json'), category: 'governance',
      what: 'Usage or capability limits enforced by policy.',
      why: 'Proof that org-level governance already exists as a surface to build on.',
    },
    {
      id: 'skillsDir', label: 'Skills', path: path.join(CLAUDE_DIR, 'skills'), category: 'capability', isDir: true,
      what: 'Installed skills, the packaged instructions the agent can invoke on demand.',
      why: 'Each skill can change how the agent behaves for a whole class of task.',
    },
    {
      id: 'pluginsDir', label: 'Plugins', path: path.join(CLAUDE_DIR, 'plugins'), category: 'capability', isDir: true,
      what: 'Installed plugins, which can bundle skills, MCP servers, hooks, and commands together.',
      why: 'A single plugin can add many capabilities at once.',
    },
    {
      id: 'projectsDir', label: 'Session history & memory', path: path.join(CLAUDE_DIR, 'projects'), category: 'data', isDir: true,
      what: 'Full transcripts of your sessions, plus per-project memory notes.',
      why: 'Usually the largest and most sensitive store, a complete record of your work.',
    },
    {
      id: 'telemetryDir', label: 'Telemetry', path: path.join(CLAUDE_DIR, 'telemetry'), category: 'privacy', isDir: true,
      what: 'Product analytics and event data, including events queued or failed to send.',
      why: 'This is data about you leaving, or trying to leave, the device.',
    },
    {
      id: 'backupsDir', label: 'Backups', path: path.join(CLAUDE_DIR, 'backups'), category: 'data', isDir: true,
      what: 'Automatic backups of config and files.',
      why: 'Old copies of your settings can persist here after you change them.',
    },
    {
      id: 'shellSnapshotsDir', label: 'Shell snapshots', path: path.join(CLAUDE_DIR, 'shell-snapshots'), category: 'data', isDir: true,
      what: 'Captured shell-environment snapshots used during sessions.',
      why: 'Can contain environment details from your terminal.',
    },
    {
      id: 'sessionsDir', label: 'Sessions', path: path.join(CLAUDE_DIR, 'sessions'), category: 'data', isDir: true,
      what: 'Session bookkeeping data.',
      why: 'Tracks your activity across runs.',
    },
    {
      id: 'ideDir', label: 'IDE integration', path: path.join(CLAUDE_DIR, 'ide'), category: 'config', isDir: true,
      what: 'State for IDE extensions.',
      why: 'Links the agent to your editor.',
    },
  ];
}
