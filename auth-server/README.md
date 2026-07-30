
```markdown
# 🔗 `/authlink` — Ultimate Setup Guide 🚀

> [!NOTE]
> **Overview:** The auth server now runs **inside the same Node process as the bot** (`index.js` calls `startAuthServer(client)` right after `client.login`). This perfectly matches your Pterodactyl egg's single startup command — no second process, and no second `npm install` required! 🎉

## 🌐 1. Pterodactyl — Network Tab
You will need **two allocations (ports)** on your server for this to work properly:

*   🔵 **Primary Allocation** (e.g., `wings.hostigo.cloud:3002`): Used by the Discord bot's gateway connection. **Do not touch this.**
*   🟢 **Secondary Allocation** (e.g., `wings.hostigo.cloud:3003`): This is the one the auth server will bind to. 

> [!TIP]
> If you don't have a second allocation yet, add one from **Network > Allocations** (or ask whoever manages the node).

## 👾 2. Discord Developer Portal
1. 🔗 Go to the [Discord Developer Portal](https://discord.com/developers/applications) and select your bot's application.
2. 🔐 Navigate to **OAuth2 ➔ General**. Copy your `Client Secret` and paste it into your `.env` file as `DISCORD_CLIENT_SECRET=`.
3. ↪️ Navigate to **OAuth2 ➔ Redirects**, click **"Add Redirect"**, and enter EXACTLY:
   ```http
   [http://wings.hostigo.cloud:3003/callback](http://wings.hostigo.cloud:3003/callback)

```
> [!IMPORTANT]
> **Crucial:** Swap in your *real* node hostname and your *second* allocation's port. Discord matches this string byte-for-byte, so it must perfectly equal the REDIRECT_URI you set below.
> 
## ⚙️ 3. Environment Variables (.env)
Update your .env file with the following configuration:
```env
DISCORD_CLIENT_SECRET=your_secret_here
REDIRECT_URI=[http://wings.hostigo.cloud:3003/callback](http://wings.hostigo.cloud:3003/callback)
AUTH_SERVER_PORT=3003
AUTO_JOIN_GUILD=false   # 🔄 Set to 'true' to auto-join verified members (reuses your existing DISCORD_TOKEN)

```
## 🚀 4. Deploy & Run
 1. 📦 Run npm install in the root directory (this will now also install express).
 2. 🔄 **Restart** the server from your Pterodactyl panel.
 3. 🖥️ Check your console! It should display the bot's normal ready log alongside these new lines:
   ```log
   [auth-server] 🟢 listening on port 3003
   [auth-server] 🔗 callback endpoint: [http://wings.hostigo.cloud:3003/callback](http://wings.hostigo.cloud:3003/callback)
   
   ```
## ✅ 5. Test It Out!
 1. 💬 Type /authlink in your Discord server and click the **Authenticate** button.
 2. 👍 Approve the connection on Discord's consent screen.
 3. 🌍 You will be redirected to your second allocation's URL, where you should see the **"Verification Complete"** success page.
 4. 📂 Check your database at database/system/auth-links.json — you should see a newly saved record!
## 📌 Important Notes
 * ❌ **Errors?** If startAuthServer logs Skipped — missing DISCORD_CLIENT_ID / ..., double-check that your .env file has both DISCORD_CLIENT_SECRET and REDIRECT_URI correctly filled in.
> [!WARNING]
> **Auto-Join Limits:** Setting AUTO_JOIN_GUILD=true requires the bot to *already* be a member of the target guild. (The guilds.join scope cannot make the bot join a brand-new guild on your behalf).
> 
