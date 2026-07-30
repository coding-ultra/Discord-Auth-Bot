// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  Member Pull Manager
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// Pulls previously-verified (/authlink) members into a target guild using
// the `guilds.join` OAuth2 scope they granted during verification. Same
// mechanism RestoreCord/Vultcord-style bots use. For each member:
//   1. Refresh their access token via their stored refresh_token (long-lived
//      as long as they haven't revoked access — this avoids ever hitting an
//      expired-access-token wall).
//   2. PUT /guilds/{guildId}/members/{userId} with that fresh access token.
//   3. On success, DM them the "sorry for pulling" card.
//   4. Wait 1 second before moving to the next member (rate-limit safety).
//
// No upper limit on member_count is enforced here — the command layer is
// responsible for whatever count the owner requests.

import { saveAuthLink } from './authLinks.js';
import { buildSorryForPullingCard } from '../builders/pullMemberCard.js';

const DELAY_BETWEEN_MEMBERS_MS = 1000;

/**
 * Refreshes a single member's access token.
 * @returns {{ ok: true, accessToken: string, refreshToken: string } | { ok: false, reason: string }}
 */
async function refreshAccessToken(refreshToken, clientId, clientSecret) {
  try {
    const res = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      return { ok: false, reason: res.status === 400 ? 'revoked' : 'refresh_failed' };
    }

    const data = await res.json();
    return { ok: true, accessToken: data.access_token, refreshToken: data.refresh_token ?? refreshToken };
  } catch {
    return { ok: false, reason: 'network_error' };
  }
}

/**
 * Attempts to add a single user to the target guild via guilds.join.
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
async function joinGuild(guildId, userId, accessToken, botToken) {
  try {
    const res = await fetch(`https://discord.com/api/guilds/${guildId}/members/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    // 201 = newly added, 204 = already a member (both are "success" for us)
    if (res.ok || res.status === 201 || res.status === 204) {
      return { ok: true };
    }

    return { ok: false, reason: `http_${res.status}` };
  } catch {
    return { ok: false, reason: 'network_error' };
  }
}

/**
 * Pulls up to `count` verified members into `targetGuild`.
 *
 * @param {object} opts
 * @param {import('discord.js').Client} opts.client
 * @param {import('discord.js').Guild} opts.targetGuild
 * @param {Array<[string, object]>} opts.candidates entries from getAllAuthLinks() -> [userId, record]
 * @param {number} opts.count how many members to attempt
 * @param {(progress: { done: number, total: number, joined: number, failed: number }) => Promise<void>|void} opts.onProgress
 *   called after every member attempt so the caller can live-edit a progress message
 */
export async function pullMembers({ client, targetGuild, candidates, count, onProgress }) {
  const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_TOKEN } = process.env;

  const selected = candidates.slice(0, count);
  const total = selected.length;

  let joined = 0;
  let failed = 0;
  let dmFailed = 0;

  for (let i = 0; i < selected.length; i++) {
    const [userId, record] = selected[i];

    let success = false;

    if (record.refreshToken) {
      const refreshed = await refreshAccessToken(record.refreshToken, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET);

      if (refreshed.ok) {
        saveAuthLink(userId, {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        });

        const joinResult = await joinGuild(targetGuild.id, userId, refreshed.accessToken, DISCORD_TOKEN);
        success = joinResult.ok;
      }
    }

    if (success) {
      joined++;
      try {
        const user = await client.users.fetch(userId);
        await user.send(buildSorryForPullingCard(targetGuild));
      } catch {
        dmFailed++;
      }
    } else {
      failed++;
    }

    if (onProgress) {
      await onProgress({ done: i + 1, total, joined, failed });
    }

    if (i < selected.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_MEMBERS_MS));
    }
  }

  return { total, joined, failed, dmFailed };
}
