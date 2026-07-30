// Synora 乂 𝙳evelopment
// Component V2 "Authentication Status" stats card — used by /authstatus.

import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} from 'discord.js';
import { BRAND, BRAND_LINK, ACCENT } from '../constants.js';

/**
 * Builds the /authstatus stats card.
 * @param {{ total: number, authorized: number, unauthorized: number }} stats
 * @param {import('discord.js').Guild|null} guild
 */
export function buildAuthStatusCard(stats, guild) {
  const guildName = guild?.name ?? 'this server';

  const container = new ContainerBuilder().setAccentColor(ACCENT);
  const generatedAt = Math.floor(Date.now() / 1000);
  const authorizedRate = stats.total > 0 ? Math.round((stats.authorized / stats.total) * 100) : 0;

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `### Authentication Status`,
        `Verification overview for **${guildName}**.`,
        `-# Generated <t:${generatedAt}:F>`,
      ].join('\n'),
    ),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `**Total Verified**\u2002·\u2002 \`${stats.total}\``,
        `**Authorized**\u2002·\u2002 \`${stats.authorized}\` (\`${authorizedRate}%\`)`,
        `**Unauthorized**\u2002·\u2002 \`${stats.unauthorized}\``,
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
