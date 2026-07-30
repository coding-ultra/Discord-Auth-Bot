// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  Pull History Storage Manager
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// Persists a log entry for every /pullmember run (who ran it, target guild,
// counts, timestamps) so /pullhistory can show a detailed record of past
// pulls. Uses the project's atomic-write helper, same pattern as authLinks.js.

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readJson, writeJsonAtomic } from '../utils/atomicJson.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const DB_PATH = join(__dirname, '../../database/system/pull-history.json');

function load() {
  return readJson(DB_PATH, { runs: [] });
}

function save(data) {
  writeJsonAtomic(DB_PATH, data);
}

/**
 * Appends a completed pull run to the history log.
 * @param {object} entry
 * @param {string} entry.executedBy   user ID of the owner who ran /pullmember
 * @param {string} entry.guildId
 * @param {string} entry.guildName
 * @param {number} entry.requested    the member_count that was requested
 * @param {number} entry.total        candidates actually attempted (may be < requested)
 * @param {number} entry.joined
 * @param {number} entry.failed
 * @param {number} entry.dmFailed
 * @param {number} entry.durationSec
 * @param {number} entry.startedAt    epoch ms
 */
export function logPullRun(entry) {
  const data = load();
  data.runs.push({
    ...entry,
    completedAt: Date.now(),
  });
  save(data);
}

/**
 * Returns all logged pull runs, most recent first.
 */
export function getPullHistory() {
  const data = load();
  return [...data.runs].sort((a, b) => b.completedAt - a.completedAt);
}
