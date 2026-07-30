// Synora 乂 𝙳evelopment
// Component V2 "Pull History" card builder — used by /pullhistory.

import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} from 'discord.js';
import { BRAND, BRAND_LINK, ACCENT } from '../constants.js';

const MAX_ENTRIES_SHOWN = 10;

/**
 * Builds the /pullhistory card.
 * @param {Array<object>} runs history entries, most recent first (from getPullHistory())
 */
export function buildPullHistoryCard(runs) {
  const container = new ContainerBuilder().setAccentColor(ACCENT);

  if (runs.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `### Pull History`,
          `No pulls have been run yet — use **/pullmember** to run one.`,
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

  const shown = runs.slice(0, MAX_ENTRIES_SHOWN);
  const generatedAt = Math.floor(Date.now() / 1000);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      [
        `### Pull History`,
        `Showing the **${shown.length}** most recent pull${shown.length !== 1 ? 's' : ''} of **${runs.length}** total.`,
        `-# Generated <t:${generatedAt}:R>`,
      ].join('\n'),
    ),
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  );

  shown.forEach((run, index) => {
    const ranAt = Math.floor(run.startedAt / 1000);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `**#${index + 1}**\u2002·\u2002 <t:${ranAt}:F>\u2002·\u2002 <t:${ranAt}:R>`,
          `**Target**\u2002·\u2002 ${run.guildName}\u2002·\u2002 \`${run.guildId}\``,
          `**Requested**\u2002·\u2002 \`${run.requested}\`\u2002 **Attempted**\u2002·\u2002 \`${run.total}\``,
          `**Joined**\u2002·\u2002 \`${run.joined}\`\u2002 **Failed**\u2002·\u2002 \`${run.failed}\`\u2002 **DM Failed**\u2002·\u2002 \`${run.dmFailed}\``,
          `**Duration**\u2002·\u2002 \`${run.durationSec}s\`\u2002 **Executed by**\u2002·\u2002 <@${run.executedBy}>`,
        ].join('\n'),
      ),
    );

    if (index < shown.length - 1) {
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      );
    }
  });

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
