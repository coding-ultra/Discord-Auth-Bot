// ─────────────────────────────────────────────────────────────────────────────
//  PRIME DEV  ·  /authlink
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: discord.gg/fbGGmgWXy
// + Community: https://discord.gg/fbGGmgWXy
//
// Generates a one-time, per-member Discord OAuth2 authorize link (scope:
// "identify guilds.join"). The member clicks it, approves on Discord, and
// gets redirected to our auth-server, which exchanges the code, pulls their
// profile (avatar/banner), optionally joins them to the guild, and stores
// everything. This command only *creates the link* — it never talks to the
// auth-server directly.

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createState } from '../../../lib/managers/authState.js';
import { getAuthLink } from '../../../lib/managers/authLinks.js';
import { buildAuthLinkCard, buildAlreadyLinkedCard } from '../../../lib/builders/authCard.js';

const OAUTH_SCOPES = ['identify', 'guilds.join'];

function buildAuthUrlFor(userId, guildId) {
  const { DISCORD_CLIENT_ID, REDIRECT_URI } = process.env;
  if (!DISCORD_CLIENT_ID || !REDIRECT_URI) return null;

  const state = createState(userId, guildId ?? null);

  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', OAUTH_SCOPES.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'consent');

  return authUrl.toString();
}

export default {
  data: new SlashCommandBuilder()
    .setName('authlink')
    .setDescription('Get your personal authentication link to verify and gain access to this server.'),
  prefix: 'authlink',

  cooldown: 10,

  async execute(interaction) {
    const { DISCORD_CLIENT_ID, REDIRECT_URI } = process.env;

    if (!DISCORD_CLIENT_ID || !REDIRECT_URI) {
      return interaction.reply({
        content: 'Auth system is not configured yet — missing `DISCORD_CLIENT_ID` or `REDIRECT_URI` in `.env`.',
        flags: MessageFlags.Ephemeral,
      });
    }

    // If already linked, just show their existing status instead of minting
    // a new (unnecessary) OAuth link.
    const existing = getAuthLink(interaction.user.id);
    if (existing) {
      return interaction.reply(buildAlreadyLinkedCard(existing, interaction.guild));
    }

    const authUrlStr = buildAuthUrlFor(interaction.user.id, interaction.guild?.id);
    const card = buildAuthLinkCard(authUrlStr, interaction.guild);

    return interaction.reply(card);
  },

  async prefixExecute(message) {
    const { DISCORD_CLIENT_ID, REDIRECT_URI } = process.env;

    if (!DISCORD_CLIENT_ID || !REDIRECT_URI) {
      await message.reply('Auth system is not configured yet — missing `DISCORD_CLIENT_ID` or `REDIRECT_URI` in `.env`.');
      return;
    }

    const existing = getAuthLink(message.author.id);
    if (existing) {
      await message.reply(buildAlreadyLinkedCard(existing, message.guild));
      return;
    }

    const authUrlStr = buildAuthUrlFor(message.author.id, message.guild?.id);
    const card = buildAuthLinkCard(authUrlStr, message.guild);

    await message.reply(card);
  },
};
