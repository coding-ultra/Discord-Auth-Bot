// ─────────────────────────────────────────────────────────────────────────────
//  PRIME DEV  ·  
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: discord.gg/fbGGmgWXy
// + Community: https://discord.gg/fbGGmgWXy
//
// Owner-only. Pulls up to <member_count> previously-verified members into
// the guild identified by <server_id> (must be a guild the bot is already
// in). Live-edits a single progress message in the invoking channel while
// running, 1 second between each member.

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { isOwner } from '../../../lib/managers/config.js';
import { getAllAuthLinks } from '../../../lib/managers/authLinks.js';
import { pullMembers } from '../../../lib/managers/pullMember.js';
import { logPullRun } from '../../../lib/managers/pullHistory.js';
import { PREFIX } from '../../../lib/managers/config.js';
import {
  buildPullErrorCard,
  buildPullProgressCard,
  buildPullSummaryCard,
} from '../../../lib/builders/pullMemberCard.js';

/**
 * Shared pull-run logic used by both /pullmember and the prefix version.
 * `replyFns` supplies the reply/edit functions appropriate to the context
 * (interaction vs message), so the actual pull flow only lives once.
 */
async function runPull({ executorId, serverId, memberCount, client, replyFns }) {
  const targetGuild = client.guilds.cache.get(serverId);
  if (!targetGuild) {
    return replyFns.reply(
      buildPullErrorCard(
        'Server Not Found',
        `I'm not in a server with the ID \`${serverId}\`. Make sure the bot has been added there first.`,
      ),
    );
  }

  const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_TOKEN } = process.env;
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_TOKEN) {
    return replyFns.reply(
      buildPullErrorCard(
        'Not Configured',
        'Missing `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, or `DISCORD_TOKEN` in `.env`.',
      ),
    );
  }

  const candidates = Object.entries(getAllAuthLinks()).filter(
    ([, record]) => record.revoked !== true && record.refreshToken,
  );

  if (candidates.length === 0) {
    return replyFns.reply(
      buildPullErrorCard('No Verified Members', 'There are no currently-authorized verified members to pull.'),
    );
  }

  const startedAt = Date.now();

  await replyFns.reply(
    buildPullProgressCard({ guildName: targetGuild.name, done: 0, total: Math.min(memberCount, candidates.length), joined: 0, failed: 0 }),
  );

  const result = await pullMembers({
    client,
    targetGuild,
    candidates,
    count: memberCount,
    onProgress: async (progress) => {
      try {
        await replyFns.edit(
          buildPullProgressCard({ guildName: targetGuild.name, ...progress }),
        );
      } catch {
        // Ignore edit failures mid-run (e.g. transient rate limit) —
        // the final summary edit at the end will still land.
      }
    },
  });

  const durationSec = Math.round((Date.now() - startedAt) / 1000);

  logPullRun({
    executedBy: executorId,
    guildId: targetGuild.id,
    guildName: targetGuild.name,
    requested: memberCount,
    total: result.total,
    joined: result.joined,
    failed: result.failed,
    dmFailed: result.dmFailed,
    durationSec,
    startedAt,
  });

  return replyFns.edit(
    buildPullSummaryCard({
      guildName: targetGuild.name,
      total: result.total,
      joined: result.joined,
      failed: result.failed,
      dmFailed: result.dmFailed,
      durationSec,
    }),
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName('pullmember')
    .setDescription('Pull verified members into a target server (owner-only).')
    .addStringOption((opt) =>
      opt.setName('server_id').setDescription('The target server (guild) ID').setRequired(true),
    )
    .addIntegerOption((opt) =>
      opt
        .setName('member_count')
        .setDescription('How many verified members to pull')
        .setRequired(true)
        .setMinValue(1),
    ),
  prefix: 'pullmember',

  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply(
        buildPullErrorCard('Access Denied', 'This command is restricted to the bot owner(s).'),
      );
    }

    const serverId = interaction.options.getString('server_id', true);
    const memberCount = interaction.options.getInteger('member_count', true);

    return runPull({
      executorId: interaction.user.id,
      serverId,
      memberCount,
      client: interaction.client,
      replyFns: {
        reply: (card) => interaction.reply(card),
        edit: (card) => interaction.editReply(card),
      },
    });
  },

  async prefixExecute(message, args, client) {
    if (!isOwner(message.author.id)) {
      await message.reply(
        buildPullErrorCard('Access Denied', 'This command is restricted to the bot owner(s).'),
      );
      return;
    }

    const [serverId, countStr] = args;
    const memberCount = parseInt(countStr, 10);

    if (!serverId || !Number.isInteger(memberCount) || memberCount < 1) {
      await message.reply(`Usage: \`${PREFIX}pullmember <server_id> <member_count>\``);
      return;
    }

    let sent;
    await runPull({
      executorId: message.author.id,
      serverId,
      memberCount,
      client,
      replyFns: {
        reply: async (card) => {
          sent = await message.reply(card);
          return sent;
        },
        edit: (card) => sent.edit(card),
      },
    });
  },
};
