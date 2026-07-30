// ─────────────────────────────────────────────────────────────────────────────
//  PRIME DEV  ·  
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: discord.gg/fbGGmgWXy
// + Community: https://discord.gg/fbGGmgWXy
//
// Owner-only. Shows a detailed Components V2 log of past /pullmember runs —
// when each ran, which server was targeted, and the join/fail counts.

import { SlashCommandBuilder } from 'discord.js';
import { isOwner } from '../../../lib/managers/config.js';
import { getPullHistory } from '../../../lib/managers/pullHistory.js';
import { buildPullHistoryCard } from '../../../lib/builders/pullHistoryCard.js';
import { buildPullErrorCard } from '../../../lib/builders/pullMemberCard.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pullhistory')
    .setDescription('View the history of past /pullmember runs (owner-only).'),
  prefix: 'pullhistory',

  cooldown: 5,

  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply(
        buildPullErrorCard('Access Denied', 'This command is restricted to the bot owner(s).'),
      );
    }

    const runs = getPullHistory();

    return interaction.reply(buildPullHistoryCard(runs));
  },

  async prefixExecute(message) {
    if (!isOwner(message.author.id)) {
      await message.reply(
        buildPullErrorCard('Access Denied', 'This command is restricted to the bot owner(s).'),
      );
      return;
    }

    const runs = getPullHistory();

    await message.reply(buildPullHistoryCard(runs));
  },
};
