# /authlink — Setup Guide (Pterodactyl, single process)

The auth server now runs **inside the same Node process as the bot**
(`index.js` calls `startAuthServer(client)` right after `client.login`).
This matches your Pterodactyl egg's single startup command — no second
process, no second `npm install`.

## 1. Pterodactyl — Network tab
You need **two allocations** on this server:
- The existing one (e.g. `wings.hostigo.cloud:3002`) — used by the Discord
  bot's gateway connection, don't touch this.
- A second one (e.g. `wings.hostigo.cloud:3003`) — this is the one the
  auth server will bind to. If you don't have a second allocation yet,
  add one from Network > Allocations (or ask whoever manages the node).

## 2. Discord Developer Portal
1. https://discord.com/developers/applications → your bot's application.
2. **OAuth2 → General** → copy `Client Secret` → `.env` → `DISCORD_CLIENT_SECRET=`
3. **OAuth2 → Redirects** → "Add Redirect" → enter EXACTLY:
   ```
   http://wings.hostigo.cloud:3003/callback
   ```
   (swap in your real node hostname + second allocation's port). Discord
   matches this string byte-for-byte, so it must equal `REDIRECT_URI` below.

## 3. `.env`
```
DISCORD_CLIENT_SECRET=your_secret_here
REDIRECT_URI=http://wings.hostigo.cloud:3003/callback
AUTH_SERVER_PORT=3003
AUTO_JOIN_GUILD=false   # set true to auto-join verified members (reuses DISCORD_TOKEN above)
```

## 4. Deploy
1. `npm install` (root) — this now also installs `express`.
2. Restart the server from Pterodactyl.
3. Console should show both the bot's normal ready log AND:
   ```
   [auth-server]  listening on port 3003
   [auth-server]  callback endpoint: http://wings.hostigo.cloud:3003/callback
   ```

## 5. Test
1. `/authlink` in Discord → click **Authenticate**.
2. Approve on Discord's consent screen.
3. You're redirected to the second allocation's URL — should show the
   "Verification Complete" success page.
4. Check `database/system/auth-links.json` — a record should be saved.

## Notes
- If `startAuthServer` logs `Skipped — missing DISCORD_CLIENT_ID / ...`,
  double-check `.env` has `DISCORD_CLIENT_SECRET` and `REDIRECT_URI` filled in.
- `AUTO_JOIN_GUILD=true` requires the bot to already be a member of the
  target guild (guilds.join can't make the bot join a NEW guild on your behalf).
