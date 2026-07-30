# Synora 乂 𝙳evelopment — Auth Bot (Pterodactyl Hosting Guide)

Discord bot with a built-in OAuth2 "verify" system (`/authlink`), roles,
member auto-join, and pull/history tracking. This README covers **hosting
it on a Pterodactyl panel** end-to-end — egg, `.env`, allocations, and how
the website (OAuth callback) connects back to the bot.

---

## 1. What this project actually is

- **One single Node.js process** (`index.js`) runs everything:
  - The Discord bot (gateway connection via `discord.js` v14)
  - An Express web server (`auth-server/server.js`) for the OAuth2 callback
- They are **not separate services** — the web server starts *inside*
  the bot process, right after `client.login(TOKEN)`. This matters for
  Pterodactyl because your egg only needs **one startup command**, not two.

```
index.js
 ├─ loads commands/events/listeners
 ├─ client.login(TOKEN)              → Discord bot goes online
 └─ startAuthServer(client)          → Express server starts (OAuth callback)
```

---

## 2. Pterodactyl Egg — Node.js

Use a standard **Node.js egg** (e.g. "Generic Node.js" / "Yolks: Node.js").
Recommended settings:

| Setting | Value |
|---|---|
| Docker Image | `ghcr.io/parkervcp/yolks:nodejs_20` (or `_22`) |
| Startup Command | `node index.js` (or `npm start`) |
| Install Script | default Node.js egg install script (runs `npm install`) |

No custom egg is required — this is a plain Node app with `express`,
`discord.js`, and `dotenv` as dependencies (see `package.json`).

**Node version:** `discord.js v14` needs Node **18+**. Use Node 20 or 22 in
the egg image to be safe.

---

## 3. Pterodactyl — Network / Allocations (important!)

This is the part people usually miss. You need **two allocations (ports)**
on this server, not one:

1. **Primary allocation** (auto-assigned, e.g. `wings.yourhost.cloud:3002`)
   → not actually used for incoming traffic; the bot only makes *outbound*
   connections to Discord's gateway. Leave it as-is.
2. **Second allocation** (e.g. `wings.yourhost.cloud:3003`)
   → this is the port the Express auth server binds to, for Discord's
   OAuth2 redirect to hit.

**How to add it:** Server page → **Network** tab → **Allocations** →
add a new allocation (or ask whoever administers the node — some panels
restrict this to admins). Note down the **hostname + port** it gives you.

---

## 4. `.env` file — full reference

Copy `example.env` to `.env` in the root and fill in:

```env
DISCORD_TOKEN=                     # Bot token — Discord Developer Portal > Bot
DISCORD_CLIENT_ID=                 # Application ID — Developer Portal > General Information
BOT_PREFIX=,,                      # Prefix for legacy text commands

OWNER_IDS=123...,456...            # Comma-separated Discord user IDs (reserved, not yet wired to a command)

BOT_NAME=Synora 乂 𝙳evelopment      # Used in every embed/card footer + web pages
SUPPORT_SERVER_LINK=https://dsc.gg/synoraxdev

# ── /authlink OAuth2 system ──────────────────────────────
DISCORD_CLIENT_SECRET=             # Developer Portal > OAuth2 > Client Information
REDIRECT_URI=                      # MUST exactly match a Redirect URL in Developer Portal
                                    # e.g. http://wings.yourhost.cloud:3003/callback
AUTH_SERVER_PORT=3003              # The SECOND allocation's port (not the bot's main one)
AUTO_JOIN_GUILD=false              # true = auto-join verified users into the guild
```

| Variable | Required | Notes |
|---|---|---|
| `DISCORD_TOKEN` | Yes | Bot won't start without it (hard exit in `index.js`) |
| `DISCORD_CLIENT_ID` | Yes | Used for slash command deployment |
| `BOT_PREFIX` | No | Defaults handled in code if blank |
| `OWNER_IDS` | No | Reserved for future owner-only features |
| `BOT_NAME` / `SUPPORT_SERVER_LINK` | No | Cosmetic — shown on embeds & the success/error web pages |
| `DISCORD_CLIENT_SECRET` | Only for `/authlink` | Without it, auth server logs a warning and **does not start** (bot still runs fine) |
| `REDIRECT_URI` | Only for `/authlink` | Byte-for-byte match with Discord Developer Portal redirect |
| `AUTH_SERVER_PORT` | Only for `/authlink` | Defaults to `3000` if unset — but on Pterodactyl you must set it to your second allocation's port |
| `AUTO_JOIN_GUILD` | No | Requires bot already in the target guild; reuses `DISCORD_TOKEN` |

---

## 5. Discord Developer Portal setup

1. Go to https://discord.com/developers/applications → select your bot's app.
2. **OAuth2 → General**
   - Copy **Client ID** → `.env` → `DISCORD_CLIENT_ID`
   - Copy **Client Secret** → `.env` → `DISCORD_CLIENT_SECRET`
3. **OAuth2 → Redirects** → click **Add Redirect** → enter exactly:
   ```
   http://wings.yourhost.cloud:3003/callback
   ```
   Replace `wings.yourhost.cloud:3003` with your **actual node hostname +
   second allocation port**. This must be character-for-character identical
   to `REDIRECT_URI` in `.env`, including `http://` vs `https://`.
4. **Bot → Privileged Gateway Intents** → enable:
   - `SERVER MEMBERS INTENT` (needed for `GuildMembers` + auto-join/role-grant)
   - `MESSAGE CONTENT INTENT` (needed for prefix commands)
   - `PRESENCE INTENT` (used by `GuildPresences` in `index.js`)

---

## 6. How the OAuth flow connects, step by step

1. A member runs **`/authlink`** in Discord (`app/commands/utility/authlink.js`).
   The bot builds a Discord authorize URL with scope `identify guilds.join`
   plus a one-time `state` token, and shows an **Authenticate** button.
2. Member clicks it → approves on Discord's consent screen.
3. Discord redirects the browser to your **`REDIRECT_URI`**
   (`GET /callback?code=...&state=...`) — this hits the Express server
   running inside your bot process, on `AUTH_SERVER_PORT`.
4. The server (`auth-server/server.js`):
   - Validates the one-time `state` token (`lib/managers/authState.js`)
   - Exchanges `code` for an access token (`POST discord.com/api/oauth2/token`)
   - Fetches the member's Discord profile (`GET discord.com/api/users/@me`)
   - Optionally auto-joins them into the guild if `AUTO_JOIN_GUILD=true`
   - Saves the verified record via `lib/managers/authLinks.js`
   - Auto-grants the configured verify role if one was set via `/verifyrole`
   - DMs the member a "thanks for verifying" card
   - Shows a styled **success page** in their browser (`auth-server/pages/success.js`)
5. Data persists to `database/system/auth-links.json` on disk (via
   `lib/utils/atomicJson.js` for crash-safe writes).

There's also a `/health` route (`GET /callback`'s sibling, `GET /health`)
that just returns `ok` — useful for an uptime monitor pinging the second
allocation.

---

## 7. Deploying on Pterodactyl — step by step

1. Upload/extract this project into the server's file manager (root should
   contain `index.js`, `package.json`, etc.).
2. Fill in `.env` (copy from `example.env`) with all values from sections 4–5.
3. Make sure **Startup Command** is `node index.js`.
4. Click **Reinstall** (runs `npm install`) if you didn't upload
   `node_modules`, or just **Start** if dependencies are already installed.
5. Console should show the ASCII banner, then:
   ```
   [auth-server]  listening on port 3003
   [auth-server]  callback endpoint: http://wings.yourhost.cloud:3003/callback
   ```
   If instead you see:
   ```
   [auth-server]  Skipped — missing DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET / REDIRECT_URI in .env
   ```
   → the bot still runs fine, but `/authlink` won't work until you fill
   those three `.env` values in and restart.
6. Deploy slash commands (see `lib/builders/deployCommands.js` — run once
   after any command changes, per its own instructions).

---

## 8. Testing the full flow

1. In your Discord server, run **`/authlink`**.
2. Click **Authenticate** → approve on Discord.
3. Browser redirects to your second allocation's URL → should show the
   **"Verification Complete"** success page.
4. Check `database/system/auth-links.json` — a new entry should exist for
   your Discord user ID.
5. (Optional) If you set a role with `/verifyrole`, confirm you received it.
6. (Optional) If `AUTO_JOIN_GUILD=true`, confirm you were added to the guild.

---

## 9. Common issues

| Symptom | Fix |
|---|---|
| Bot won't start at all | `DISCORD_TOKEN` missing/invalid in `.env` |
| `/authlink` command exists but auth server didn't start | Fill `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `REDIRECT_URI` |
| Discord shows "Invalid OAuth2 redirect_uri" | `REDIRECT_URI` in `.env` doesn't exactly match the one in Developer Portal → OAuth2 → Redirects |
| Callback page never loads / times out | Second allocation not actually reachable — check Pterodactyl port is exposed/forwarded, and `AUTH_SERVER_PORT` matches that allocation's port |
| "This link is invalid or expired" on callback | The one-time `state` token expired — run `/authlink` again for a fresh link |
| Auto-join / role grant fails silently | Bot needs `GuildMembers` intent enabled in Developer Portal + already present in the target guild |
