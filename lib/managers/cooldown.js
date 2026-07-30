// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  Command Cooldown Manager
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// Generic, in-memory, per-user-per-command cooldown tracker.
//
// Usage in a command file:
//
//   export default {
//     data: new SlashCommandBuilder()...,
//     cooldown: 5, // seconds — omit or 0 for no cooldown
//     async execute(interaction, client) { ... },
//   };
//
// The cooldown is enforced centrally in app/listeners/interactionCreate.js
// before command.execute() is called, so individual commands don't need to
// implement their own throttling logic.

const cooldowns = new Map(); // key: `${commandName}:${userId}` -> expiry timestamp (ms)

// ─── Periodic cleanup ─────────────────────────────────────────────────────────
// Prevent memory leak: clear expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of cooldowns) {
    if (expiry <= now) cooldowns.delete(key);
  }
}, 10 * 60 * 1000).unref(); // .unref() so this timer won't keep the process alive

/**
 * Check whether a user is currently on cooldown for a command.
 * Returns the remaining time in milliseconds if on cooldown, or 0 if not.
 */
export function getRemainingCooldown(commandName, userId) {
  const key    = `${commandName}:${userId}`;
  const expiry = cooldowns.get(key);
  if (!expiry) return 0;

  const remaining = expiry - Date.now();
  if (remaining <= 0) {
    cooldowns.delete(key);
    return 0;
  }
  return remaining;
}

/**
 * Start (or restart) the cooldown for a user on a command.
 * @param {string} commandName
 * @param {string} userId
 * @param {number} cooldownSeconds
 */
export function triggerCooldown(commandName, userId, cooldownSeconds) {
  if (!cooldownSeconds || cooldownSeconds <= 0) return;
  const key = `${commandName}:${userId}`;
  cooldowns.set(key, Date.now() + cooldownSeconds * 1000);
}

/**
 * Format a millisecond duration as a short human-readable string, e.g. "3.2s".
 */
export function formatCooldown(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}
