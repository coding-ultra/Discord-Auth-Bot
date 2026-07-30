// Synora 乂 𝙳evelopment
// Component V2 cards used by /pullmember.

import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} from 'discord.js';
import { BRAND, BRAND_LINK, ACCENT } from '../constants.js';

/**
 * Generic CV2 error card (owner-only rejection, guild not found, etc).
 */
export function buildPullErrorCard(title, description) {
  const container = new ContainerBuilder().setAccentColor(ACCENT);
  const occurredAt = Math.floor(Date.now() / 1000);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [`### ${title}`, description, `-# <t:${occurredAt}:R>`].join('\n'),
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
 * DM sent to each member right after they're pulled into the target guild.
 */
export function buildSorryForPullingCard(guild) {
  const guildName = guild?.name ?? 'a server';
  const container = new ContainerBuilder().setAccentColor(ACCENT);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `### You've Been Added`,
        `You were automatically added to **${guildName}** using the server-join permission you granted during verification.`,
      ].join('\n'),
    ),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# Sorry for pulling you in without asking first. Feel free to leave at any time if it's not for you.`,
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
 * Live progress card, edited in-place in the command channel while the
 * pull is running.
 */
export function buildPullProgressCard({ guildName, done, total, joined, failed }) {
  const container = new ContainerBuilder().setAccentColor(ACCENT);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `### Pulling Members`,
        `Target server\u2002·\u2002 ${guildName}`,
      ].join('\n'),
    ),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `**Progress**\u2002·\u2002 \`${done}/${total}\` (\`${percent}%\`)`,
        `**Joined**\u2002·\u2002 \`${joined}\``,
        `**Failed**\u2002·\u2002 \`${failed}\``,
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
 * Final summary card once the pull finishes.
 */
export function buildPullSummaryCard({ guildName, total, joined, failed, dmFailed, durationSec }) {
  const container = new ContainerBuilder().setAccentColor(ACCENT);
  const completedAt = Math.floor(Date.now() / 1000);
  const successRate = total > 0 ? Math.round((joined / total) * 100) : 0;

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `### Pull Complete`,
        `Finished pulling members into **${guildName}**.`,
        `-# Completed <t:${completedAt}:F>`,
      ].join('\n'),
    ),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `**Requested**\u2002·\u2002 \`${total}\``,
        `**Joined**\u2002·\u2002 \`${joined}\` (\`${successRate}%\`)`,
        `**Failed**\u2002·\u2002 \`${failed}\``,
        `**DM Failed**\u2002·\u2002 \`${dmFailed}\``,
        `**Duration**\u2002·\u2002 \`${durationSec}s\``,
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
