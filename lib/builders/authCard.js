// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  Auth System — Card Builder
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// Component V2 "Server Authentication" cards used by /authlink. Same visual
// language as the rest of the bot (welcome/boost cards): a Section with a
// thumbnail accessory, a divider, structured key-value rows, and a muted
// footer — no emojis, accent color set on the container itself.

import {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { BRAND, BRAND_LINK, ACCENT } from '../constants.js';

const GUILD_ICON_FALLBACK =
  'https://cdn.discordapp.com/embed/avatars/0.png';

/**
 * Builds the "Server Authentication" card sent to a member when they run
 * /authlink. Contains the one-time OAuth URL as a link button.
 *
 * @param {string} authUrl one-time OAuth2 authorize URL for this member
 * @param {import('discord.js').Guild|null} guild the guild that requested the auth link
 */
export function buildAuthLinkCard(authUrl, guild) {
  const guildName = guild?.name ?? 'this server';
  const iconURL = guild?.iconURL({ size: 256, extension: 'png' }) ?? GUILD_ICON_FALLBACK;

  const container = new ContainerBuilder().setAccentColor(ACCENT);

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [
            `### Server Authentication`,
            `Verify your account to gain access to **${guildName}**.`,
          ].join('\n'),
        ),
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL)),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `**Step 1**  ·  Click **Authenticate** below.`,
        `**Step 2**  ·  Approve the authorization request from Discord.`,
        `**Step 3**  ·  You're verified automatically — no further action needed.`,
      ].join('\n'),
    ),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60;

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `**Expires**\u2002·\u2002 <t:${expiresAt}:R> · single use`,
        `**Access Requested**\u2002·\u2002 profile (avatar, banner) and server membership`,
      ].join('\n'),
    ),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ${BRAND} · ${BRAND_LINK}`),
  );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('Authenticate').setStyle(ButtonStyle.Link).setURL(authUrl),
  );

  container.addActionRowComponents(row);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * Builds the "already linked" card shown if the member has already verified.
 */
export function buildAlreadyLinkedCard(record, guild) {
  const iconURL = guild?.iconURL({ size: 256, extension: 'png' }) ?? GUILD_ICON_FALLBACK;

  const container = new ContainerBuilder().setAccentColor(ACCENT);

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [
            `### Already Verified`,
            `Your account is already authenticated with this server.`,
          ].join('\n'),
        ),
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL)),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `**Linked as**\u2002·\u2002 ${record.username}`,
        `**Linked on**\u2002·\u2002 <t:${Math.floor(record.linkedAt / 1000)}:F>`,
      ].join('\n'),
    ),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ${BRAND} · ${BRAND_LINK}`),
  );

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * Builds the DM warning card sent to a member when we detect they've
 * revoked the bot's authorization from Discord's User Settings > Authorized
 * Apps. Includes a re-authenticate link if one is provided.
 *
 * @param {import('discord.js').Guild|null} guild the guild they were linked to
 * @param {string|null} reauthUrl optional fresh OAuth URL to re-link
 */
export function buildDisauthWarningCard(guild, reauthUrl = null) {
  const guildName = guild?.name ?? 'the server';
  const iconURL = guild?.iconURL({ size: 256, extension: 'png' }) ?? GUILD_ICON_FALLBACK;

  const container = new ContainerBuilder().setAccentColor(ACCENT);

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [
            `### Authorization Revoked`,
            `Your authentication for **${guildName}** was removed.`,
          ].join('\n'),
        ),
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL)),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `We noticed you disauthorized this app from Discord's **User Settings > Authorized Apps**.`,
        `As a result, your verified status for **${guildName}** is no longer active.`,
      ].join('\n'),
    ),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# If this wasn't intentional, you can run **/authlink** again in **${guildName}** to re-verify.`,
    ),
  );

  if (reauthUrl) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Re-authenticate').setStyle(ButtonStyle.Link).setURL(reauthUrl),
    );
    container.addActionRowComponents(row);
  }

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

/**
 * Builds the DM sent to a member right after they successfully verify via
 * /authlink — a simple "thanks for verifying" confirmation.
 *
 * @param {import('discord.js').Guild|null} guild the guild they just verified for
 */
export function buildVerificationThanksCard(guild) {
  const guildName = guild?.name ?? 'the server';
  const iconURL = guild?.iconURL({ size: 256, extension: 'png' }) ?? GUILD_ICON_FALLBACK;

  const container = new ContainerBuilder().setAccentColor(ACCENT);

  container.addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [
            `### Thanks for Verifying`,
            `Your authentication for **${guildName}** is now complete.`,
          ].join('\n'),
        ),
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconURL)),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `You now have full access to **${guildName}**. Welcome aboard.`,
    ),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ${BRAND} · ${BRAND_LINK}`),
  );

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}
