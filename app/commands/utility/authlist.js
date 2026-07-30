// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  /authlist
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// Admin-only, paginated list of every member who has authenticated via
// /authlink from THIS guild specifically (auth-links.json stores guildId
// per record, so cross-guild records never leak into another server's list).

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { getAllAuthLinks } from '../../../lib/managers/authLinks.js';
import { ACCENT, BRAND, BRAND_LINK } from '../../../lib/constants.js';

const PAGE_SIZE = 10;

export const AUTHLIST_PREV_ID = 'authlist_prev_';
export const AUTHLIST_NEXT_ID = 'authlist_next_';

// ─── Component V2 message builders ────────────────────────────────────────────

function buildNoPermissionMessage() {
  const c = new ContainerBuilder().setAccentColor(ACCENT);

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### Auth List\nOnly server **Administrators** can use this command.`,
    ),
  );

  return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

function buildEmptyMessage(guildName) {
  const c = new ContainerBuilder().setAccentColor(ACCENT);

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `### Auth List`,
        `No members have authenticated yet in **${guildName}**.`,
      ].join('\n'),
    ),
  );

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ${BRAND} · ${BRAND_LINK}`),
  );

  return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

function buildNavButtons(page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${AUTHLIST_PREV_ID}${page}`)
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId(`${AUTHLIST_NEXT_ID}${page}`)
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );
}

/**
 * Builds the paginated list message.
 * `records` — array of { userId, username, revoked, joinedGuild, linkedAt }.
 */
export function buildAuthListMessage(records, guildName, page) {
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const clampedPage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = clampedPage * PAGE_SIZE;
  const pageItems = records.slice(start, start + PAGE_SIZE);

  const c = new ContainerBuilder().setAccentColor(ACCENT);

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `### Auth List`,
        `**${guildName}**\u2002·\u2002 ${records.length} authenticated member${records.length === 1 ? '' : 's'}`,
      ].join('\n'),
    ),
  );

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  const lines = pageItems.map((r, i) => {
    const num = start + i + 1;
    const linkedTs = Math.floor((r.linkedAt || Date.now()) / 1000);
    const status = r.revoked ? 'Unauthorized' : 'Authorized';
    return [
      `**${num}.**  ${'\u2002'}·${'\u2002'}  <@${r.userId}> \`(${r.username || r.userId})\``,
      `> **Status**\u2002·\u2002 ${status}\u2002 **Joined Guild**\u2002·\u2002 ${r.joinedGuild ? 'Yes' : 'No'}`,
      `> **Linked**\u2002·\u2002 <t:${linkedTs}:F> · <t:${linkedTs}:R>`,
    ].join('\n');
  });

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(lines.join('\n\n')),
  );

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# Page ${clampedPage + 1}/${totalPages} · ${BRAND} · ${BRAND_LINK}`,
    ),
  );

  c.addActionRowComponents(buildNavButtons(clampedPage, totalPages));

  return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

// ─── Shared logic ──────────────────────────────────────────────────────────────

/** Fetches every auth record linked from the given guild, most recent first. */
export function fetchGuildAuthRecords(guildId) {
  const links = getAllAuthLinks();
  return Object.values(links)
    .filter((r) => r.guildId === guildId)
    .sort((a, b) => (b.linkedAt || 0) - (a.linkedAt || 0));
}

async function runList(guild) {
  const records = fetchGuildAuthRecords(guild.id);

  if (records.length === 0) {
    return { payload: buildEmptyMessage(guild.name), records };
  }

  return { payload: buildAuthListMessage(records, guild.name, 0), records };
}

// ─── Command export ───────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
    .setName('authlist')
    .setDescription('List every member who has authenticated via /authlink in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  prefix: 'authlist',

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ ...buildNoPermissionMessage(), flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const { payload } = await runList(interaction.guild);
    await interaction.editReply(payload);
  },

  async prefixExecute(message) {
    if (!message.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
      await message.reply(buildNoPermissionMessage());
      return;
    }

    const { payload } = await runList(message.guild);
    await message.reply(payload);
  },
};
