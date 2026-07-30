// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  OAuth2 State Token Manager
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// Every /authlink invocation mints a random, single-use `state` token and
// binds it (in-memory) to the Discord user + guild that requested it. When
// Discord redirects back to our Express callback with `?code=...&state=...`,
// we look the state back up here to know *whose* link this is — without this
// we'd have no way to tie the OAuth callback back to a specific member.
//
// States expire after STATE_TTL_MS so stale/abandoned links can't be replayed.

import { randomBytes } from 'crypto';

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const pendingStates = new Map(); // state -> { userId, guildId, expiresAt }

// Periodic cleanup of expired, unclaimed states.
setInterval(() => {
  const now = Date.now();
  for (const [state, entry] of pendingStates) {
    if (entry.expiresAt <= now) pendingStates.delete(state);
  }
}, 5 * 60 * 1000).unref();

/**
 * Create a new one-time state token for a user in a guild.
 * @returns {string} the generated state token
 */
export function createState(userId, guildId) {
  const state = randomBytes(24).toString('hex');
  pendingStates.set(state, {
    userId,
    guildId,
    expiresAt: Date.now() + STATE_TTL_MS,
  });
  return state;
}

/**
 * Consume (look up + delete) a state token. Returns null if it doesn't
 * exist or has expired — the caller should treat that as an invalid link.
 */
export function consumeState(state) {
  const entry = pendingStates.get(state);
  if (!entry) return null;

  pendingStates.delete(state); // single-use

  if (entry.expiresAt <= Date.now()) return null;

  return entry;
}
