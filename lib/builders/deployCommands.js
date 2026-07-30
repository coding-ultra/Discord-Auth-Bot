// ─────────────────────────────────────────────────────────────────────────────
//  S Y N O R A   D E V E L O P M E N T  ·  Command Deploy
// ─────────────────────────────────────────────────────────────────────────────

import { REST, Routes } from 'discord.js';
import { readdirSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { c, RULE } from '../utils/colors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ─── Colours ──────────────────────────────────────────────────────────────────



const TAG  = `${c.c1}${c.bold}[DEPLOY]${c.reset}`;

// ─── Main export ──────────────────────────────────────────────────────────────

async function collectCommands() {
  const commands = [];

  function collectCommandFiles(dir) {
    if (!existsSync(dir)) return [];
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        files.push(...collectCommandFiles(join(dir, entry.name)));
      } else if (entry.name.endsWith('.js')) {
        files.push(join(dir, entry.name));
      }
    }
    return files;
  }

  const commandFiles = collectCommandFiles(join(__dirname, '../../app/commands'));
  for (const filePath of commandFiles) {
    try {
      const mod = await import(pathToFileURL(filePath).href);
      if (mod.default?.data) commands.push(mod.default.data.toJSON());
    } catch (err) {
      console.log(`  ${TAG} ${c.red}Could not load ${filePath} — ${err.message}${c.reset}`);
    }
  }

  return commands;
}

// ─── Global deploy (kept for compatibility — can take up to 1hr to propagate) ──

export default async function deployCommands(token, clientId) {
  if (!token || !clientId) {
    console.log(`  ${TAG} ${c.muted}TOKEN or CLIENT_ID missing — skipping deploy${c.reset}`);
    return;
  }

  const commands = await collectCommands();

  console.log(`  ${RULE}`);
  console.log(`  ${TAG} ${c.white}${c.bold}Registering slash commands (global)...${c.reset}`);

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    const names = commands.map(cmd => `${c.c3}/${cmd.name}${c.reset}`).join(`  ${c.muted}|${c.reset}  `);
    console.log(`  ${TAG} ${c.green}${c.bold}OK${c.reset}  ${c.white}${commands.length} command${commands.length !== 1 ? 's' : ''} registered${c.reset}`);
    console.log(`  ${TAG} ${c.muted}Commands:${c.reset} ${names}`);
  } catch (err) {
    console.log(`  ${TAG} ${c.red}${c.bold}FAILED${c.reset}  ${c.red}registration failed — ${err.message}${c.reset}`);
  }

  console.log(`  ${RULE}`);
}

// ─── Clear global commands (removes stale global registrations that cause  ────
// ─── duplicate entries alongside guild-scoped commands) ───────────────────────

export async function clearGlobalCommands(client) {
  const token    = client.token;
  const clientId = client.user?.id;

  if (!token || !clientId) return;

  try {
    await new REST({ version: '10' }).setToken(token).put(Routes.applicationCommands(clientId), { body: [] });
    console.log(`  ${TAG} ${c.green}OK${c.reset}  ${c.white}Cleared stale global commands${c.reset}`);
  } catch (err) {
    console.log(`  ${TAG} ${c.red}FAILED${c.reset}  clearing global commands — ${err.message}`);
  }
}

// ─── Single-guild deploy (instant — used when bot joins a NEW guild) ──────────

export async function deployCommandsToGuild(client, guildId) {
  const token    = client.token;
  const clientId = client.user?.id;

  if (!token || !clientId) return { ok: false, reason: 'missing token/clientId' };

  try {
    const commands = await collectCommands();
    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`  ${TAG} ${c.green}OK${c.reset}  ${c.white}Instant commands registered${c.reset} ${c.muted}(${guildId})${c.reset}`);
    return { ok: true };
  } catch (err) {
    console.log(`  ${TAG} ${c.red}FAILED${c.reset}  ${c.muted}(${guildId})${c.reset} — ${err.message}`);
    return { ok: false, reason: err.message };
  }
}

// ─── Guild-scoped deploy (instant — every guild the bot is in) ────────────────
// Guild commands propagate immediately, unlike global commands (~1hr delay).
// Call this AFTER client is ready (client.guilds.cache only populates then).

export async function deployGuildCommands(client) {
  const token    = client.token;
  const clientId = client.user?.id;

  if (!token || !clientId) {
    console.log(`  ${TAG} ${c.muted}TOKEN or CLIENT_ID missing — skipping guild deploy${c.reset}`);
    return;
  }

  const commands = await collectCommands();
  const rest = new REST({ version: '10' }).setToken(token);
  const guilds = [...client.guilds.cache.values()];

  console.log(`  ${RULE}`);
  console.log(`  ${TAG} ${c.white}${c.bold}Registering slash commands (guild-instant)...${c.reset}`);
  console.log(`  ${TAG} ${c.muted}Target guilds:${c.reset} ${c.white}${guilds.length}${c.reset}`);

  const results = await Promise.allSettled(
    guilds.map(guild =>
      rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: commands })
    )
  );

  let ok = 0, failed = 0;
  results.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      ok++;
    } else {
      failed++;
      console.log(`  ${TAG} ${c.red}FAILED${c.reset}  ${c.white}${guilds[i].name}${c.reset} ${c.muted}(${guilds[i].id})${c.reset} — ${res.reason?.message ?? res.reason}`);
    }
  });

  const names = commands.map(cmd => `${c.c3}/${cmd.name}${c.reset}`).join(`  ${c.muted}|${c.reset}  `);
  console.log(`  ${TAG} ${c.green}${c.bold}OK${c.reset}  ${c.white}${ok}/${guilds.length} guild${guilds.length !== 1 ? 's' : ''} updated instantly${c.reset}${failed ? c.red + `, ${failed} failed` + c.reset : ''}`);
  console.log(`  ${TAG} ${c.muted}Commands:${c.reset} ${names}`);
  console.log(`  ${RULE}`);

  return { ok, failed, total: guilds.length };
}
