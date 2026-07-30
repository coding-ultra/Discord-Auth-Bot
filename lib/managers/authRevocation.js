// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  Auth Revocation Poller
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// Discord does NOT push any event/webhook when a user disauthorizes an app
// from User Settings > Authorized Apps — the only way to notice is to ask
// Discord ourselves. Every POLL_INTERVAL_MS, we try to refresh each linked
// member's OAuth token:
//
//   - refresh succeeds  -> still authorized, just update the stored tokens
//   - refresh fails with invalid_grant -> the member revoked access. We DM
//     them a Components V2 warning card and mark the record as revoked so
//     we don't notify them again on every future poll.
//
// A short interval (2 min) is used so this feels close to real-time without
// hammering Discord's token endpoint.

import { getAllAuthLinks, saveAuthLink, markRevoked } from './authLinks.js';
import { createState } from './authState.js';
import { buildDisauthWarningCard } from '../builders/authCard.js';

const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Attempts to refresh a single user's access token.
 * @returns {'ok' | 'revoked' | 'error'}
 */
async function checkOne(refreshToken, clientId, clientSecret) {
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

    if (res.ok) {
      const data = await res.json();
      return { status: 'ok', data };
    }

    // Discord returns 400 invalid_grant when the authorization was revoked
    // (or the refresh token is otherwise no longer valid).
    if (res.status === 400) {
      return { status: 'revoked' };
    }

    return { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

/**
 * Starts the periodic revocation check. Safe to call once at bot startup.
 * @param {import('discord.js').Client} client
 */
export function startAuthRevocationPoller(client) {
  const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, REDIRECT_URI } = process.env;

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    console.warn('  [auth-poller]  Skipped — missing DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET in .env');
    return;
  }

  const tick = async () => {
    const links = getAllAuthLinks();

    for (const [userId, record] of Object.entries(links)) {
      if (record.revoked) continue; // already notified, don't recheck forever
      if (!record.refreshToken) continue; // legacy record with no token stored

      const result = await checkOne(record.refreshToken, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET);

      if (result.status === 'ok') {
        // Still authorized — rotate the stored tokens (refresh tokens are
        // typically single-use / rotate on refresh).
        saveAuthLink(userId, {
          accessToken: result.data.access_token,
          refreshToken: result.data.refresh_token ?? record.refreshToken,
        });
        continue;
      }

      if (result.status === 'revoked') {
        markRevoked(userId);
        await notifyRevoked(client, userId, record);
      }

      // 'error' (network hiccup, Discord 5xx) — leave the record as-is and
      // just try again on the next poll tick.
    }
  };

  // Fire once shortly after startup, then on the fixed interval.
  setTimeout(tick, 15_000).unref();
  const interval = setInterval(tick, POLL_INTERVAL_MS);
  interval.unref();

  console.log(`  [auth-poller]  running — checking linked members every ${POLL_INTERVAL_MS / 60000} min`);
}

/**
 * Sends the DM warning card to a member whose authorization was revoked.
 * If their DMs are closed, we just log it and move on (no way to notify
 * them in-server without a dedicated channel, which is out of scope here).
 */
async function notifyRevoked(client, userId, record) {
  try {
    const guild = record.guildId ? client.guilds.cache.get(record.guildId) : null;

    let reauthUrl = null;
    const { DISCORD_CLIENT_ID, REDIRECT_URI } = process.env;
    if (DISCORD_CLIENT_ID && REDIRECT_URI) {
      const state = createState(userId, record.guildId ?? null);
      const url = new URL('https://discord.com/api/oauth2/authorize');
      url.searchParams.set('client_id', DISCORD_CLIENT_ID);
      url.searchParams.set('redirect_uri', REDIRECT_URI);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'identify guilds.join');
      url.searchParams.set('state', state);
      url.searchParams.set('prompt', 'consent');
      reauthUrl = url.toString();
    }

    const user = await client.users.fetch(userId);
    await user.send(buildDisauthWarningCard(guild, reauthUrl));
    console.log(`  [auth-poller]  notified ${userId} of revoked authorization`);
  } catch (err) {
    // Most common cause: member has DMs closed / blocked the bot.
    console.warn(`  [auth-poller]  could not DM ${userId} (DMs likely closed) — skipping notification`);
  }
}
