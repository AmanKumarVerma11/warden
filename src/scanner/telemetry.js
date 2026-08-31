// Inspects the telemetry store — what analytics data sits on disk, including
// events that tried to leave the device and failed.

import path from 'node:path';
import { CLAUDE_DIR, listDir, dirStats } from './util.js';

export async function scanTelemetry() {
  const dir = path.join(CLAUDE_DIR, 'telemetry');
  const stats = await dirStats(dir);
  let failedEvents = 0, files = 0;
  const samples = [];
  for (const e of await listDir(dir)) {
    if (!e.isFile()) continue;
    files++;
    if (/failed/i.test(e.name)) failedEvents++;
    if (samples.length < 10) samples.push(e.name);
  }
  return { present: stats.files > 0, bytes: stats.bytes, files, failedEvents, samples };
}
