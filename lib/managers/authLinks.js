// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  Auth Link Storage Manager
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// Persists verified-member OAuth data (id, username, avatar, banner, the
// guild they linked from, and timestamps) to a single JSON file using the
// project's existing atomic-write helper so a crash mid-write never corrupts
// the store.

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readJson, writeJsonAtomic } from '../utils/atomicJson.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const DB_PATH = join(__dirname, '../../database/system/auth-links.json');

function load() {
  return readJson(DB_PATH, { links: {} });
}

function save(data) {
  writeJsonAtomic(DB_PATH, data);
}

/**
 * Save/update a member's verified auth record.
 * @param {string} userId
 * @param {object} record  { username, discriminator, avatar, avatarURL, banner, bannerURL, guildId, joinedGuild, linkedAt }
 */
export function saveAuthLink(userId, record) {
  const data = load();
  data.links[userId] = {
    ...(data.links[userId] || {}),
    ...record,
    userId,
    linkedAt: data.links[userId]?.linkedAt || Date.now(),
    updatedAt: Date.now(),
  };
  save(data);
  return data.links[userId];
}

/**
 * Fetch a single member's stored auth record, or null.
 */
export function getAuthLink(userId) {
  const data = load();
  return data.links[userId] || null;
}

/**
 * Check whether a member has already linked.
 */
export function isLinked(userId) {
  return getAuthLink(userId) !== null;
}

/**
 * Remove a member's stored auth record (e.g. for /authunlink later).
 */
export function removeAuthLink(userId) {
  const data = load();
  if (!data.links[userId]) return false;
  delete data.links[userId];
  save(data);
  return true;
}

/**
 * Mark a stored record as revoked (member disauthorized the app in Discord's
 * User Settings > Authorized Apps). We keep the record instead of deleting
 * it so we don't re-notify the same user on every poll cycle.
 */
export function markRevoked(userId) {
  const data = load();
  if (!data.links[userId]) return false;
  data.links[userId].revoked = true;
  data.links[userId].revokedAt = Date.now();
  save(data);
  return true;
}

/**
 * Return every stored auth record (for admin/list tooling later).
 */
export function getAllAuthLinks() {
  return load().links;
}
