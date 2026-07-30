// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  Nameplate Style Manager
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// Applies the bot's Discord nameplate/name-style (font + effect + color) to
// its own guild member record. This is guild-scoped — Discord does not
// re-apply it automatically on restart, so it's re-patched on every `ready`.
//
// Endpoint: PATCH /guilds/{guild_id}/members/@me  (bot-token only, guild-scoped)

import { REST } from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';

const FONT_IDS   = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
const EFFECT_IDS = new Set([1, 2, 3, 4, 5, 6]);

// ─── Active style config ──────────────────────────────────────────────────────
// Font 4  = Chicle
// Effect 4 = Toon (subtle gradient fill with visible stroke/outline)
// Color   = #808080 (standard gray) — Toon only needs 1 color

export const NAME_STYLE = {
  fontId:   4,
  effectId: 4,
  hexColors: ['#808080'],
};

/**
 * Converts a hex color string to a 24-bit integer.
 * @param {string} hex - e.g. "#808080" or "808080"
 * @returns {number}
 */
function hexToInt(hex) {
  return parseInt(hex.replace(/^#/, ''), 16);
}

/**
 * Returns true if the value is a valid 24-bit color integer.
 * @param {number} n
 * @returns {boolean}
 */
function isValidColor(n) {
  return Number.isInteger(n) && n >= 0 && n <= 0xFFFFFF;
}

/**
 * Applies the configured nameplate style to the bot's member record in a
 * single guild. Silently skips guilds where the bot lacks permission or
 * where the guild has no nameplate support, logging a short reason instead
 * of throwing — so a single guild failure never stops the batch.
 *
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @returns {Promise<{ guildId: string, ok: boolean, reason?: string }>}
 */
export async function applyNameStyleToGuild(client, guildId) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return { guildId, ok: false, reason: 'guild not cached' };

  let me = guild.members.me;
  if (!me) {
    try {
      me = await guild.members.fetchMe();
    } catch {
      return { guildId, ok: false, reason: 'bot member not resolvable' };
    }
  }
  if (!me) return { guildId, ok: false, reason: 'bot member not resolvable' };

  if (!me.permissions.has(PermissionFlagsBits.ChangeNickname)) {
    return { guildId, ok: false, reason: 'missing Change Nickname permission' };
  }

  if (!FONT_IDS.has(NAME_STYLE.fontId) || !EFFECT_IDS.has(NAME_STYLE.effectId)) {
    return { guildId, ok: false, reason: 'invalid font/effect id in config' };
  }

  const colors = NAME_STYLE.hexColors.map(hexToInt);
  if (!colors.length || colors.length > 2 || !colors.every(isValidColor)) {
    return { guildId, ok: false, reason: 'invalid color config' };
  }
  if (NAME_STYLE.effectId === 2 && colors.length < 2) {
    return { guildId, ok: false, reason: 'gradient effect requires 2 colors' };
  }

  const rest = new REST({ version: '10' }).setToken(client.token);

  try {
    await rest.patch(`/guilds/${guildId}/members/@me`, {
      body: {
        display_name_font_id:   NAME_STYLE.fontId,
        display_name_effect_id: NAME_STYLE.effectId,
        display_name_colors:    colors,
      },
    });
    return { guildId, ok: true };
  } catch (err) {
    const reason = err?.rawError?.message ?? err?.message ?? 'unknown error';
    return { guildId, ok: false, reason };
  }
}

/**
 * Applies the configured nameplate style across every guild the bot is
 * currently in. Calls are spaced out to avoid hitting Discord's rate limiter
 * when the bot is in many servers.
 *
 * @param {import('discord.js').Client} client
 * @returns {Promise<{ ok: number, failed: number, results: Array }>}
 */
export async function applyNameStyleToAllGuilds(client) {
  const guildIds = [...client.guilds.cache.keys()];
  const results  = [];

  for (const guildId of guildIds) {
    const result = await applyNameStyleToGuild(client, guildId);
    results.push(result);
    // Space out calls to avoid rate limiting on large bots.
    await new Promise(r => setTimeout(r, 1500));
  }

  const ok     = results.filter(r => r.ok).length;
  const failed = results.length - ok;
  return { ok, failed, results };
}
