// Synora 乂 𝙳evelopment
// Returns the HTML shown in the member's browser right after a successful
// /authlink verification. Distinct visual identity: deep graphite base,
// a single drawn "verification seal" ring as the signature moment, Space
// Grotesk for display + IBM Plex Mono for meta/data fields.

export function renderSuccessPage({ username, guildName, brand, brandLink }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verified · ${escapeHtml(guildName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0b0d10;
    --panel: #12151a;
    --line: #22262d;
    --text: #eef0f2;
    --muted: #7c848d;
    --accent: #3ddc84;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
  }
  html, body { height: 100%; background: var(--bg); color: var(--text); }
  body {
    font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background-image:
      radial-gradient(circle at 20% 15%, #1a2620 0%, transparent 45%),
      radial-gradient(circle at 100% 100%, #101418 0%, transparent 60%);
  }

  .card {
    position: relative;
    width: 100%;
    max-width: 440px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 48px 40px 36px;
    text-align: center;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
  }

  .seal {
    width: 88px;
    height: 88px;
    margin: 0 auto 28px;
    position: relative;
  }
  .seal svg { width: 100%; height: 100%; overflow: visible; }
  .seal-ring {
    fill: none;
    stroke: var(--accent);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 264;
    stroke-dashoffset: 264;
    animation: draw 0.9s cubic-bezier(0.65, 0, 0.35, 1) 0.15s forwards;
  }
  .seal-check {
    stroke: var(--accent);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    stroke-dasharray: 40;
    stroke-dashoffset: 40;
    animation: draw 0.4s ease-out 1.0s forwards;
  }
  @keyframes draw {
    to { stroke-dashoffset: 0; }
  }


  .eyebrow {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 10px;
    opacity: 0;
    animation: fadeUp 0.5s ease-out 1.15s forwards;
  }

  h1 {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 10px;
    opacity: 0;
    animation: fadeUp 0.5s ease-out 1.25s forwards;
  }
  h1 b { color: var(--accent); font-weight: 600; }

  p.sub {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.6;
    max-width: 320px;
    margin: 0 auto;
    opacity: 0;
    animation: fadeUp 0.5s ease-out 1.35s forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .meta {
    margin-top: 28px;
    border-top: 1px solid var(--line);
    padding-top: 20px;
    display: flex;
    justify-content: space-between;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    opacity: 0;
    animation: fadeUp 0.5s ease-out 1.45s forwards;
  }
  .meta span b { color: var(--text); font-weight: 500; }

  .footer {
    margin-top: 22px;
    font-size: 11px;
    color: #4a4f57;
    opacity: 0;
    animation: fadeUp 0.5s ease-out 1.5s forwards;
  }
  .footer a { color: #5c636b; text-decoration: none; }
</style>
</head>
<body>
  <div class="card">
    <div class="seal">
      <svg viewBox="0 0 100 100">
        <circle class="seal-ring" cx="50" cy="50" r="42"/>
        <polyline class="seal-check" points="32,52 45,65 70,36"/>
      </svg>
    </div>

    <div class="eyebrow">Verification Complete</div>
    <h1>Welcome, <b>${escapeHtml(username)}</b></h1>
    <p class="sub">Your account is verified for <b style="color:var(--text)">${escapeHtml(guildName)}</b>. You can close this tab and return to Discord.</p>

    <div class="meta">
      <span>STATUS <b>&nbsp;VERIFIED</b></span>
      <span>SESSION <b>&nbsp;SECURED</b></span>
    </div>

    <div class="footer">${escapeHtml(brand)} · <a href="${escapeHtml(brandLink)}">${escapeHtml(brandLink.replace(/^https?:\/\//, ''))}</a></div>
  </div>
</body>
</html>`;
}

export function renderErrorPage(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verification Failed</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0b0d10;
    --panel: #12151a;
    --line: #22262d;
    --text: #eef0f2;
    --muted: #7c848d;
    --accent: #f2545b;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
  }
  html, body { height: 100%; background: var(--bg); color: var(--text); }
  body {
    font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background-image: radial-gradient(circle at 80% 20%, #241417 0%, transparent 50%);
  }
  .card {
    position: relative;
    width: 100%;
    max-width: 440px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 48px 40px 36px;
    text-align: center;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
  }
  .seal {
    width: 76px;
    height: 76px;
    margin: 0 auto 26px;
  }
  .seal svg { width: 100%; height: 100%; overflow: visible; }
  .seal-ring {
    fill: none;
    stroke: var(--accent);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 264;
    stroke-dashoffset: 264;
    animation: draw 0.8s cubic-bezier(0.65, 0, 0.35, 1) 0.1s forwards;
  }
  .seal-x {
    stroke: var(--accent);
    stroke-width: 4;
    stroke-linecap: round;
    fill: none;
    stroke-dasharray: 30;
    stroke-dashoffset: 30;
    animation: draw 0.35s ease-out 0.85s forwards;
  }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  .eyebrow {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 10px;
  }
  h1 { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 10px; }
  p.sub { font-size: 14px; color: var(--muted); line-height: 1.6; max-width: 320px; margin: 0 auto; }
  .footer { margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--line); font-size: 11px; color: #4a4f57; }
</style>
</head>
<body>
  <div class="card">
    <div class="seal">
      <svg viewBox="0 0 100 100">
        <circle class="seal-ring" cx="50" cy="50" r="42"/>
        <line class="seal-x" x1="38" y1="38" x2="62" y2="62"/>
        <line class="seal-x" x1="62" y1="38" x2="38" y2="62"/>
      </svg>
    </div>
    <div class="eyebrow">Verification Failed</div>
    <h1>Something didn't check out</h1>
    <p class="sub">${escapeHtml(message)}</p>
    <div class="footer">Run <b style="color:var(--muted)">/authlink</b> again in Discord to request a fresh link.</div>
  </div>
</body>
</html>`;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
