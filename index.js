// ─────────────────────────────────────────────────────────────────────────────
//  S Y N O R A   D E V E L O P M E N T  ·  Core Loader
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import { readdirSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { ensureDir }   from './lib/managers/database.js';
import { c }            from './lib/utils/colors.js';
import { startAuthServer } from './auth-server/server.js';
import { startAuthRevocationPoller } from './lib/managers/authRevocation.js';
import { BRAND, BRAND_LINK } from './lib/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ─── Colour palette ───────────────────────────────────────────────────────────



// ─── Banner ───────────────────────────────────────────────────────────────────

function banner() {
  const grad = [c.c1, c.c2, c.c3, c.c4, c.c5, c.c6];

  const art = [
    ' ____ __   __ _   _  ___  ____    _    ',
    '/ ___|\\ \\ / /| \\ | |/ _ \\|  _ \\  / \\   ',
    '\\___ \\ \\ V / |  \\| | | | | |_) |/ _ \\  ',
    ' ___) | | |  | |\\  | |_| |  _ </ ___ \\ ',
    '|____/  |_|  |_| \\_|\\___/|_| \\_/_/   \\_\\',
  ];

  console.log('');
  art.forEach((line, i) => console.log(`  ${grad[i]}${c.bold}${line}${c.reset}`));
  console.log('');
  console.log(`  ${c.white}${c.bold}${BRAND}${c.reset}  ${c.muted}|${c.reset}  ${c.c4}${BRAND_LINK.replace(/^https?:\/\//, '')}${c.reset}`);
  console.log(`  ${c.muted}discord.js v14  |  Components V2  |  ${BRAND} v2.2.2${c.reset}`);
  console.log(`  ${c.muted}Developed by${c.reset}  ${c.c3}its2yashpatel_${c.reset}`);
  console.log('');
}

// ─── Token guard ──────────────────────────────────────────────────────────────

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error(`\n  [FATAL] DISCORD_TOKEN is not set — cannot start.\n`);
  process.exit(1);
}

// ─── Boot sequence ────────────────────────────────────────────────────────────

ensureDir();
banner();

// ─── Client setup ─────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel],
  ws: { properties: { browser: 'Discord Android' } },
});

client.commands       = new Collection();
client.prefixCommands = new Collection();

// ─── Load commands ────────────────────────────────────────────────────────────

// ─── Recursive command file collector ────────────────────────────────────────
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

const commandFiles = collectCommandFiles(join(__dirname, 'app/commands'));
for (const filePath of commandFiles) {
  try {
    const mod     = await import(pathToFileURL(filePath).href);
    const command = mod.default;
    if (command?.data)   client.commands.set(command.data.name, command);
    if (command?.prefix) client.prefixCommands.set(command.prefix, command);
  } catch (err) {
    console.error(`  ${c.red}${c.bold}[COMMAND LOAD FAILED]${c.reset}  ${c.white}${filePath}${c.reset}  ${c.red}${err.message}${c.reset}`);
  }
}

// ─── Load events ──────────────────────────────────────────────────────────────

const eventFiles = existsSync(join(__dirname, 'app/events'))
  ? readdirSync(join(__dirname, 'app/events')).filter(f => f.endsWith('.js'))
  : [];
for (const file of eventFiles) {
  try {
    const mod   = await import(pathToFileURL(join(__dirname, 'app/events', file)).href);
    const event = mod.default;
    if (!event?.name) continue;
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  } catch (err) {
    console.error(`  ${c.red}${c.bold}[EVENT LOAD FAILED]${c.reset}  ${c.white}${file}${c.reset}  ${c.red}${err.message}${c.reset}`);
  }
}

// ─── Load listeners ───────────────────────────────────────────────────────────

const listenerFiles = existsSync(join(__dirname, 'app/listeners'))
  ? readdirSync(join(__dirname, 'app/listeners')).filter(f => f.endsWith('.js'))
  : [];
for (const file of listenerFiles) {
  try {
    const mod   = await import(pathToFileURL(join(__dirname, 'app/listeners', file)).href);
    const event = mod.default;
    if (!event?.name) continue;
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  } catch (err) {
    console.error(`  ${c.red}${c.bold}[LISTENER LOAD FAILED]${c.reset}  ${c.white}${file}${c.reset}  ${c.red}${err.message}${c.reset}`);
  }
}

client.login(TOKEN);
startAuthServer(client);
client.once('ready', () => startAuthRevocationPoller(client));

// ─── Global error handlers ────────────────────────────────────────────────────

client.on('error', err =>
  console.error(`  ${c.red}${c.bold}[WS ERROR]${c.reset}  ${err.message}`),
);
client.on('warn', msg =>
  console.warn(`  ${c.c2}${c.bold}[WARN]${c.reset}  ${msg}`),
);

process.on('unhandledRejection', reason =>
  console.error(`  ${c.red}${c.bold}[UNHANDLED REJECTION]${c.reset}`, reason),
);

process.on('uncaughtException', err =>
  console.error(`  ${c.red}${c.bold}[UNCAUGHT EXCEPTION]${c.reset}  ${err.message}`),
);
