
```markdown
# 🔗 `/authlink` — Setup Guide (Pterodactyl, Single Process)

> **Overview:** The auth server now runs **inside the same Node process as the bot** (`index.js` calls `startAuthServer(client)` right after `client.login`). This matches your Pterodactyl egg's single startup command — no second process, no second `npm install` required.

## 1. 🌐 Pterodactyl — Network Tab
You need **two allocations (ports)** on this server for the setup to work:
- 🔹 **Primary Allocation** (e.g., `wings.hostigo.cloud:3002`) — Used by the Discord bot's gateway connection. **Do not touch this.**
- 🔹 **Secondary Allocation** (e.g., `wings.hostigo.cloud:3003`) — This is the one the auth server will bind to. *(If you don't have a second allocation yet, add one from Network > Allocations).*

## 2. 👾 Discord Developer Portal
1. Go to your [Discord Developer Portal](https://discord.com/developers/applications) and select your application.
2. Go to **OAuth2 > General** ➔ copy the `Client Secret` ➔ paste it into your `.env` file as `DISCORD_CLIENT_SECRET=`.
3. Go to **OAuth2 > Redirects** ➔ click **Add Redirect** ➔ enter EXACTLY:
   ```http
   [http://wings.hostigo.cloud:3003/callback](http://wings.hostigo.cloud:3003/callback)

```
> **Note:** Swap in your real node hostname and second allocation's port. Discord matches this string byte-for-byte, so it must equal the REDIRECT_URI below.
> 
## 3. ⚙️ Environment Variables (.env)
Update your .env file with the following configuration:
```env
DISCORD_CLIENT_SECRET=your_secret_here
REDIRECT_URI=[http://wings.hostigo.cloud:3003/callback](http://wings.hostigo.cloud:3003/callback)
AUTH_SERVER_PORT=3003
AUTO_JOIN_GUILD=false   # Set true to auto-join verified members (reuses DISCORD_TOKEN)

```
## 4. 🚀 Deploy
 1. Run npm install in the root directory (this also installs express).
 2. Restart the server from Pterodactyl.
 3. The console should show both the bot's normal ready log AND:
   ```text
   [auth-server] listening on port 3003
   [auth-server] callback endpoint: [http://wings.hostigo.cloud:3003/callback](http://wings.hostigo.cloud:3003/callback)
   
   ```
## 5. ✅ Test
 1. Run /authlink in Discord ➔ click **Authenticate**.
 2. Approve on Discord's consent screen.
 3. You will be redirected to the second allocation's URL, showing the "Verification Complete" success page.
 4. Check database/system/auth-links.json — a new record should be saved here.
## 📌 Important Notes
 * ⚠️ If startAuthServer logs Skipped — missing DISCORD_CLIENT_ID / ..., double-check that your .env has both DISCORD_CLIENT_SECRET and REDIRECT_URI correctly filled in.
 * ⚠️ AUTO_JOIN_GUILD=true requires the bot to *already* be a member of the target guild (guilds.join cannot make the bot join a new guild on your behalf).

