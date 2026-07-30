// : ! Synora 乂 𝙳evelopment !
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
// + For any queries reach out to our community or DM us.

export const PREFIX = process.env.BOT_PREFIX || ',,';

// Multi-owner support — comma-separated Discord user IDs in .env, e.g.:
//   OWNER_IDS=738383838383838383,738288282828282828
// Not wired into any command yet, but every current/future command can
// import OWNER_IDS or call isOwner() to gate owner-only behavior.
export const OWNER_IDS = (process.env.OWNER_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

/**
 * Checks whether the given user ID belongs to a configured bot owner.
 * @param {string} userId
 * @returns {boolean}
 */
export function isOwner(userId) {
  return OWNER_IDS.includes(userId);
}

// : ! Synora 乂 𝙳evelopment !
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
// + For any queries reach out to our community or DM us.
