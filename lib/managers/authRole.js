// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  Auth Role Storage Manager
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// Persists the per-guild role that's automatically granted to a member once
// they complete /authlink. Same atomic-write pattern used across the project.

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readJson, writeJsonAtomic } from '../utils/atomicJson.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const DB_PATH = join(__dirname, '../../database/system/auth-role.json');

function load() {
  return readJson(DB_PATH, { guilds: {} });
}

function save(data) {
  writeJsonAtomic(DB_PATH, data);
}

/**
 * Set/update the role granted on successful authentication for a guild.
 * @param {string} guildId
 * @param {string} roleId
 */
export function setAuthRole(guildId, roleId) {
  const data = load();
  data.guilds[guildId] = { roleId, updatedAt: Date.now() };
  save(data);
  return data.guilds[guildId];
}

/**
 * Get the configured auth role id for a guild, or null if unset.
 * @param {string} guildId
 * @returns {string|null}
 */
export function getAuthRole(guildId) {
  const data = load();
  return data.guilds[guildId]?.roleId ?? null;
}

/**
 * Clear the configured auth role for a guild.
 * @param {string} guildId
 */
export function clearAuthRole(guildId) {
  const data = load();
  if (!data.guilds[guildId]) return false;
  delete data.guilds[guildId];
  save(data);
  return true;
}
