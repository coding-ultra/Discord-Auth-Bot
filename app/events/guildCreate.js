// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  Guild Create Event
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// Auto-applies the nameplate style the moment the bot joins a new server —
// no command, no prefix, fully automatic.

import { c } from '../../lib/utils/colors.js';
import { applyNameStyleToGuild } from '../../lib/managers/nameStyle.js';
import { deployCommandsToGuild } from '../../lib/builders/deployCommands.js';

const TAG = `${c.c1}${c.bold}[NAMEPLATE]${c.reset}`;

export default {
  name: 'guildCreate',
  once: false,

  async execute(guild, client) {
    // Instant slash command registration for this new guild
    deployCommandsToGuild(client, guild.id).catch(() => {});

    const result = await applyNameStyleToGuild(client, guild.id);

    if (result.ok) {
      console.log(`  ${TAG} ${c.green}OK${c.reset}  ${c.white}${guild.name}${c.muted}  (${guild.id})${c.reset}`);
    } else {
      console.log(`  ${TAG} ${c.yellow}SKIP${c.reset}  ${c.white}${guild.name}${c.muted}  (${result.reason})${c.reset}`);
    }
  },
};
