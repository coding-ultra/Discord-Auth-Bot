// Synora 乂 𝙳evelopment

import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { getRemainingCooldown, triggerCooldown, formatCooldown } from '../../lib/managers/cooldown.js';
import { buildHelpMessage, PAGES as HELP_PAGES } from '../commands/utility/help.js';
import {
  fetchGuildAuthRecords,
  buildAuthListMessage,
  AUTHLIST_PREV_ID,
  AUTHLIST_NEXT_ID,
} from '../commands/utility/authlist.js';

// ─── Auth list: prev/next nav buttons ──────────────────────────────────────────

async function handleAuthListNav(interaction, direction, currentPage) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: `Only server **Administrators** can use this button.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const records = fetchGuildAuthRecords(interaction.guildId);
  const nextPage = direction === 'next' ? currentPage + 1 : currentPage - 1;

  await interaction.update(buildAuthListMessage(records, interaction.guild.name, nextPage));
}

// ─── Help menu/button handler ─────────────────────────────────────────────────
// HELP_PAGES is imported from help.js (single source of truth) so this list
// can never drift out of sync with the actual pages help.js renders.

async function handleHelpMenu(interaction, client) {
  let targetPage;

  if (interaction.isStringSelectMenu()) {
    targetPage = interaction.values[0];
  } else if (interaction.customId?.startsWith('help_prev_')) {
    const current = interaction.customId.replace('help_prev_', '');
    const idx     = HELP_PAGES.indexOf(current);
    targetPage    = idx > 0 ? HELP_PAGES[idx - 1] : current;
  } else {
    const current = interaction.customId.replace('help_next_', '');
    const idx     = HELP_PAGES.indexOf(current);
    targetPage    = idx < HELP_PAGES.length - 1 ? HELP_PAGES[idx + 1] : current;
  }

  await interaction.update(buildHelpMessage(interaction.user, client, targetPage));
}

export default {
  name: 'interactionCreate',
  once: false,

  async execute(interaction, client) {

    // ── Slash commands ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      // ── Cooldown check ──
      if (command.cooldown) {
        const remaining = getRemainingCooldown(command.data.name, interaction.user.id);
        if (remaining > 0) {
          await interaction.reply({
            content: `Please wait **${formatCooldown(remaining)}** before using \`/${command.data.name}\` again.`,
            flags: MessageFlags.Ephemeral,
          }).catch(() => {});
          return;
        }
        triggerCooldown(command.data.name, interaction.user.id, command.cooldown);
      }

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        const msg = {
          content: `Something went wrong.`,
          flags: MessageFlags.Ephemeral,
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
      return;
    }

    // ── Component interactions (dropdowns / buttons) ────────────────────────
    try {

      // ── Help: category dropdown ──────────────────────────────────────────
      if (interaction.isStringSelectMenu() && interaction.customId === 'help_menu') {
        await handleHelpMenu(interaction, client);
        return;
      }

      // ── Help: prev/next nav buttons ──────────────────────────────────────
      if (
        interaction.isButton() &&
        (interaction.customId.startsWith('help_prev_') || interaction.customId.startsWith('help_next_'))
      ) {
        await handleHelpMenu(interaction, client);
        return;
      }

      // ── Auth list: prev/next nav buttons ──────────────────────────────────
      if (interaction.isButton() && interaction.customId.startsWith(AUTHLIST_PREV_ID)) {
        const page = parseInt(interaction.customId.replace(AUTHLIST_PREV_ID, ''), 10) || 0;
        await handleAuthListNav(interaction, 'prev', page);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith(AUTHLIST_NEXT_ID)) {
        const page = parseInt(interaction.customId.replace(AUTHLIST_NEXT_ID, ''), 10) || 0;
        await handleAuthListNav(interaction, 'next', page);
        return;
      }

    } catch (err) {
      console.error(err);
      const msg = {
        content: `Something went wrong.`,
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => {});
      } else if (interaction.isRepliable()) {
        await interaction.reply(msg).catch(() => {});
      }
    }
  },
};
