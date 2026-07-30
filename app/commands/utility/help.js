// ─────────────────────────────────────────────────────────────────────────────
//  PRIME DEV  
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: discord.gg/fbGGmgWXy
// + Community: https://discord.gg/fbGGmgWXy

import {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  MessageFlags,
} from 'discord.js';
import { BRAND, BRAND_LINK, ACCENT } from '../../../lib/constants.js';
import { PREFIX }   from '../../../lib/managers/config.js';


export const PAGES = ['overview', 'auth'];

// ─── Page builders ────────────────────────────────────────────────────────────

function buildOverview(user, client) {
  const avatar = client.user.displayAvatarURL({ size: 256, extension: 'png' });
  const guilds = client.guilds.cache.size;
  const c      = new ContainerBuilder().setAccentColor(ACCENT);

  c.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# Command Centre\n-# Welcome, **${user.username}** — here's what's available`,
        ),
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatar)),
  );

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
  );

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `\`/help\`  \`${PREFIX}help\``,
        `> Shows this interactive command reference.`,
        ``,
        `\`/ping\`  \`${PREFIX}ping\``,
        `> Check bot latency — WebSocket & REST round-trip.`,
      ].join('\n'),
    ),
  );

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `Slash prefix: \`/\`   ·   Message prefix: \`${PREFIX}\``,
        `-# Active in **${guilds}** server${guilds !== 1 ? 's' : ''}   ·   ${BRAND}`,
      ].join('\n'),
    ),
  );

  return c;
}

function buildAuthPage(user, client) {
  const c = new ContainerBuilder().setAccentColor(ACCENT);

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# Authentication\n-# Verify members through Discord OAuth2`,
    ),
  );

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
  );

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `\`/authlink\`  \`${PREFIX}authlink\``,
        `> Sends a one-time OAuth2 authentication link to the member.`,
        ``,
        `\`/authstatus\`  \`${PREFIX}authstatus\``,
        `> Admin only. View the authentication overview for this server —`,
        `> total verified, authorized, and unauthorized counts.`,
        ``,
        `\`/authlist\`  \`${PREFIX}authlist\``,
        `> Admin only. Paginated list of every member who has authenticated`,
        `> in this server, with status, guild-join state, and link date.`,
        ``,
        `\`/verifyrole\`  \`${PREFIX}verifyrole @role\``,
        `> Admin only. Set the role automatically granted to a member once`,
        `> they complete /authlink.`,
        ``,
        `\`/pullmember\`  \`${PREFIX}pullmember\``,
        `> Owner only. Pull every currently authenticated member into a target server.`,
        ``,
        `\`/pullhistory\`  \`${PREFIX}pullhistory\``,
        `> Owner only. View the history of previous pull runs.`,
        ``,
        `-# On authenticate: profile + membership data is stored, the`,
        `-# configured verify role (if set) is granted, and a confirmation DM is sent.`,
      ].join('\n'),
    ),
  );

  return c;
}

const PAGE_BUILDERS = {
  overview: buildOverview,
  auth: buildAuthPage,
};

const PAGE_LABELS = {
  overview: { label: 'Overview', description: 'General command reference' },
  auth:     { label: 'Authentication', description: 'OAuth2 verification & verify role' },
};

// ─── Nav ──────────────────────────────────────────────────────────────────────

function buildCategoryMenu(currentPage) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('help_menu')
    .setPlaceholder('Select a category...')
    .addOptions(
      PAGES.map(page => ({
        label: PAGE_LABELS[page].label,
        description: PAGE_LABELS[page].description,
        value: page,
        default: page === currentPage,
      })),
    );

  return new ActionRowBuilder().addComponents(menu);
}

function buildNavButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Support Server')
      .setURL(BRAND_LINK)
      .setStyle(ButtonStyle.Link),
  );
}

// ─── Public builder ───────────────────────────────────────────────────────────

export function buildHelpMessage(user, client, page = 'overview') {
  const builder = PAGE_BUILDERS[page] || buildOverview;
  const c = builder(user, client);

  c.addActionRowComponents(buildCategoryMenu(page));
  c.addActionRowComponents(buildNavButtons());

  return {
    components: [c],
    flags: MessageFlags.IsComponentsV2,
  };
}

// ─── Command export ───────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Interactive command reference'),
  prefix: 'help',

  async execute(interaction, client) {
    await interaction.reply(buildHelpMessage(interaction.user, interaction.client, 'overview'));
  },

  async prefixExecute(message, _args, client) {
    await message.reply(buildHelpMessage(message.author, client, 'overview'));
  },
};
