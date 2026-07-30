// ─────────────────────────────────────────────────────────────────────────────
//  P R I M E      D E V  ·  Ready Event
// ─────────────────────────────────────────────────────────────────────────────

import { ActivityType } from 'discord.js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PREFIX } from '../../lib/managers/config.js';
import { c, RULE } from '../../lib/utils/colors.js';
import { applyNameStyleToAllGuilds } from '../../lib/managers/nameStyle.js';
import { deployGuildCommands, clearGlobalCommands } from '../../lib/builders/deployCommands.js';
import { BRAND, BRAND_LINK } from '../../lib/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);



const TAG  = `${c.c1}${c.bold}[READY]${c.reset}`;

const AVATAR_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

function findAvatarPath() {
  for (const ext of AVATAR_EXTS) {
    const p = join(__dirname, '../../storage/avatar.' + ext);
    if (existsSync(p)) return p;
  }
  return null;
}

export default {
  // NOTE: In discord.js v15+, rename this to 'clientReady' to suppress the deprecation warning.
  // Currently on v14.26.4 — keeping 'ready' for compatibility.
  name: 'ready',
  once: true,

  async execute(client) {

    // ── Presence ──
    client.user.setPresence({
      activities: [{
        name: `Synora 乂 Assistant  ·  /help  ${PREFIX}help`,
        type: ActivityType.Custom,
      }],
      status: 'dnd',
    });

    // ── Avatar ──
    const avatarPath = findAvatarPath();
    if (avatarPath) {
      try {
        await client.user.setAvatar(readFileSync(avatarPath));
        console.log(`  ${TAG} ${c.green}OK${c.reset}  ${c.white}Avatar updated${c.reset}`);
      } catch (err) {
        console.log(`  ${TAG} ${c.yellow}WARN${c.reset}  ${c.white}Avatar not changed${c.muted}  (${err.message})${c.reset}`);
      }
    }

    // ── Online log ──
    console.log(`  ${RULE}`);
    console.log(`  ${TAG} ${c.green}${c.bold}ONLINE${c.reset}  ${c.muted}as${c.reset}  ${c.white}${c.bold}${client.user.username}${c.reset}`);
    console.log(`  ${TAG} ${c.muted}Guilds:${c.reset} ${c.white}${client.guilds.cache.size}${c.reset}   ${c.muted}Prefix:${c.reset} ${c.white}${PREFIX}${c.reset}   ${c.muted}Slash:${c.reset} ${c.white}/${c.reset}`);
    console.log(`  ${TAG} ${c.muted}${BRAND}${c.reset}  ${c.muted}|${c.reset}  ${c.c3}${BRAND_LINK.replace(/^https?:\/\//, '')}${c.reset}`);
    console.log(`  ${TAG} ${c.muted}Developed by${c.reset}  ${c.c2}its2yashpatel_${c.reset}`);
    console.log(`  ${RULE}`);

    // ── Member cache warm-up ──
    const MEMBER_TAG = `${c.c1}${c.bold}[MEMBERS]${c.reset}`;
    for (const guild of client.guilds.cache.values()) {
      guild.members.fetch()
        .then(members => {
          console.log(`  ${MEMBER_TAG} ${c.green}OK${c.reset}  ${c.white}${guild.name}${c.muted}  (${members.size} members cached)${c.reset}`);
        })
        .catch(err => {
          console.log(`  ${MEMBER_TAG} ${c.yellow}SKIP${c.reset}  ${c.white}${guild.name}${c.muted}  (${err.message})${c.reset}`);
        });
    }

    // ── Guild-instant command registration (registers in every guild immediately) ──
    // First clear any stale global commands (prevents duplicate command listings),
    // then register guild-scoped commands to every guild.
    clearGlobalCommands(client)
      .then(() => deployGuildCommands(client))
      .catch(err => {
        console.log(`  ${TAG} ${c.red}${c.bold}FAILED${c.reset}  ${c.red}command deploy crashed — ${err.message}${c.reset}`);
      });

    // ── Nameplate style auto-apply (all guilds, no command needed) ──
    const STYLE_TAG = `${c.c1}${c.bold}[NAMEPLATE]${c.reset}`;
    console.log(`  ${STYLE_TAG} ${c.white}${c.bold}Applying nameplate style to all guilds...${c.reset}`);

    applyNameStyleToAllGuilds(client)
      .then(({ ok, failed, results }) => {
        console.log(`  ${STYLE_TAG} ${c.green}${c.bold}Done${c.reset}  ${c.white}${ok} applied${c.reset}${c.muted}, ${failed} failed${c.reset}`);
        for (const r of results) {
          if (!r.ok) {
            console.log(`  ${STYLE_TAG} ${c.yellow}SKIP${c.reset}  ${c.white}${r.guildId}${c.muted}  (${r.reason})${c.reset}`);
          }
        }
        console.log(`  ${RULE}`);
      })
      .catch(err => {
        console.log(`  ${STYLE_TAG} ${c.red}${c.bold}FAILED${c.reset}  ${c.red}${err.message}${c.reset}`);
      });
  },
};
