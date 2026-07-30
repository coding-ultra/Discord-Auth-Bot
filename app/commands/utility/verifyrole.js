// Synora 乂 𝙳evelopment

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import { setAuthRole } from '../../../lib/managers/authRole.js';
import { PREFIX } from '../../../lib/managers/config.js';

/**
 * Checks whether the bot can manage a given role (i.e. the bot's highest
 * role sits above `role` in the hierarchy). Returns true if manageable.
 */
function botCanManageRole(guild, role) {
  const botMember = guild.members.me;
  if (!botMember) return false;
  return botMember.roles.highest.position > role.position;
}

export default {
  data: new SlashCommandBuilder()
    .setName('verifyrole')
    .setDescription('Set the role automatically given to members when they authenticate via /authlink')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(opt =>
      opt
        .setName('role')
        .setDescription('Role to grant automatically on successful authentication')
        .setRequired(true),
    ),
  prefix: 'verifyrole',

  async execute(interaction, client) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: `Only server **Administrators** can use this command.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const role = interaction.options.getRole('role');

    if (!botCanManageRole(interaction.guild, role)) {
      await interaction.reply({
        content: [
          `**Can't set ${role} as the verify role.**`,
          `> This role is positioned **above** my highest role in the server's role list.`,
          `> Move my role above ${role} (Server Settings → Roles) and try again.`,
        ].join('\n'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    setAuthRole(interaction.guildId, role.id);

    await interaction.reply({
      content: `**Verify role set.**\n> Members will now automatically receive ${role} when they complete **/authlink**.`,
      flags: MessageFlags.Ephemeral,
    });
  },

  async prefixExecute(message, args, client) {
    if (!message.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
      await message.reply(`Only server **Administrators** can use this command.`);
      return;
    }

    const role = message.mentions.roles.first();

    if (!role) {
      await message.reply(`Usage: \`${PREFIX}verifyrole @role\``);
      return;
    }

    if (!botCanManageRole(message.guild, role)) {
      await message.reply(
        [
          `**Can't set ${role} as the verify role.**`,
          `> This role is positioned **above** my highest role in the server's role list.`,
          `> Move my role above ${role} (Server Settings → Roles) and try again.`,
        ].join('\n'),
      );
      return;
    }

    setAuthRole(message.guildId, role.id);

    await message.reply(
      `**Verify role set.**\n> Members will now automatically receive ${role} when they complete **/authlink**.`,
    );
  },
};
