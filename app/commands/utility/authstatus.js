// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  /authstatus
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// Owner-only command (checked against OWNER_IDS in .env) that shows a public
// (non-ephemeral) breakdown of the auth-link system:
//   - Total Verified   -> every member who has ever completed /authlink
//   - Authorized       -> currently active (not revoked) verified members
//   - Unauthorized     -> verified members who later revoked the app's
//                         access from Discord's Authorized Apps settings

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { isOwner } from '../../../lib/managers/config.js';
import { getAllAuthLinks } from '../../../lib/managers/authLinks.js';
import { buildAuthStatusCard } from '../../../lib/builders/authStatusCard.js';

export default {
  data: new SlashCommandBuilder()
    .setName('authstatus')
    .setDescription('View verified / authorized / unauthorized member counts (owner-only).'),
  prefix: 'authstatus',

  cooldown: 5,

  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        content: 'This command is restricted to the bot owner(s).',
        flags: MessageFlags.Ephemeral,
      });
    }

    const links = getAllAuthLinks();
    const records = Object.values(links);

    const total = records.length;
    const unauthorized = records.filter((r) => r.revoked === true).length;
    const authorized = total - unauthorized;

    const card = buildAuthStatusCard({ total, authorized, unauthorized }, interaction.guild);

    // Public response — no Ephemeral flag, everyone in the channel sees it.
    return interaction.reply(card);
  },

  async prefixExecute(message) {
    if (!isOwner(message.author.id)) {
      await message.reply('This command is restricted to the bot owner(s).');
      return;
    }

    const links = getAllAuthLinks();
    const records = Object.values(links);

    const total = records.length;
    const unauthorized = records.filter((r) => r.revoked === true).length;
    const authorized = total - unauthorized;

    const card = buildAuthStatusCard({ total, authorized, unauthorized }, message.guild);

    await message.reply(card);
  },
};
