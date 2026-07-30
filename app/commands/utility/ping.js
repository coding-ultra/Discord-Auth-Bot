// Synora 乂 𝙳evelopment

import {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  MessageFlags,
} from 'discord.js';
import { BRAND, ACCENT } from '../../../lib/constants.js';


function wsStatus(ms) {
  if (ms < 0)   return { label: 'Measuring',  detail: 'Heartbeat not yet recorded — try again shortly' };
  if (ms < 80)  return { label: 'Excellent',  detail: 'Sub-80ms — running clean' };
  if (ms < 150) return { label: 'Good',        detail: 'Solid connection, smooth operation' };
  if (ms < 250) return { label: 'Moderate',    detail: 'Minor lag detected — monitoring' };
  return               { label: 'Degraded',    detail: 'Elevated latency — possible hiccup' };
}

function bar(ms) {
  if (ms < 0) return '`' + '░'.repeat(5) + '`';
  const filled = Math.min(Math.round(ms / 60), 5);
  const empty  = 5 - filled;
  return '`' + '█'.repeat(filled) + '░'.repeat(empty) + '`';
}

function buildPingCard(ws, rest, avatar) {
  const { label, detail } = wsStatus(ws);
  const c = new ContainerBuilder().setAccentColor(ACCENT);

  c.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# Latency Report\n-# **${label}** — ${detail}`,
        ),
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatar)),
  );

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
  );

  // `rest === null` means the REST round-trip hasn't actually been measured
  // yet (first render of the prefix-command flow) — show "Measuring..."
  // instead of a fake 0ms so we never display an incorrect number.
  const restLine = rest === null ? '**REST Round-Trip**  `Measuring...`' : `**REST Round-Trip**  \`${rest}ms\``;

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `**WebSocket**  \`${ws}ms\`   ${bar(ws)}`,
        restLine,
      ].join('\n'),
    ),
  );

  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  const statusLine =
    ws < 0
      ? `WebSocket still warming up`
      : ws < 150
        ? `All systems operational`
        : ws < 250
          ? `Slight delay — not critical`
          : `Latency elevated — monitor closely`;

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# ${statusLine}  ·  ${BRAND}`,
    ),
  );

  return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),
  prefix: 'ping',

  async execute(interaction) {
    const ws = interaction.client.ws.ping;
    const t  = Date.now();
    await interaction.deferReply();
    const rest   = Date.now() - t;
    const avatar = interaction.client.user.displayAvatarURL({ size: 256, extension: 'png' });
    await interaction.editReply(buildPingCard(ws, rest, avatar));
  },

  async prefixExecute(message, _args, client) {
    const ws     = client.ws.ping;
    const avatar = client.user.displayAvatarURL({ size: 256, extension: 'png' });
    const t      = Date.now();
    const sent   = await message.reply(buildPingCard(ws, null, avatar));
    const rest   = Date.now() - t;
    await sent.edit(buildPingCard(ws, rest, avatar));
  },
};
