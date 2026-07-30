// Synora 乂 𝙳evelopment

import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { PREFIX } from '../../lib/managers/config.js';
import { BRAND, BRAND_LINK, ACCENT } from '../../lib/constants.js';

// ─── Mention reply ────────────────────────────────────────────────────────────

async function handleMention(message, client) {
  const avatar = client.user.displayAvatarURL({ size: 256, extension: 'png' });
  const guilds = client.guilds.cache.size;
  const c      = new ContainerBuilder().setAccentColor(ACCENT);

  // ── Header ──
  c.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${BRAND}\n-# Hey ${message.author}, you called? Here's what I can do.`,
        ),
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatar)),
  );

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
  );

  // ── Quick commands ──
  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `**Get Started**`,
        `> Use \`/help\` or \`${PREFIX}help\` to browse all available commands.`,
        ``,
        `**Check Latency**`,
        `> Use \`/ping\` or \`${PREFIX}ping\` to view live WebSocket & REST latency.`,

      ].join('\n'),
    ),
  );

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  // ── Footer ──
  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# Active in **${guilds}** server${guilds !== 1 ? 's' : ''}  ·  ${BRAND}  ·  ${BRAND_LINK.replace(/^https?:\/\//, '')}`,
    ),
  );

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Support Server')
        .setURL(BRAND_LINK)
        .setStyle(ButtonStyle.Link),
    ),
  );

  const sent = await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  setTimeout(() => sent.delete().catch(() => {}), 30_000);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;

    const isMentioned =
      message.mentions.users.has(client.user.id) &&
      !message.content.trimStart().startsWith(PREFIX);

    if (isMentioned) {
      await handleMention(message, client).catch(() => {});
      return;
    }

    if (!message.content.startsWith(PREFIX)) return;

    const args        = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    if (!commandName) return;
    const command     = client.prefixCommands.get(commandName);
    if (!command) return;

    try {
      await command.prefixExecute(message, args, client);
    } catch (err) {
      console.error(err);
      await message.reply(`Something went wrong.`).catch(() => {});
    }
  },
};
