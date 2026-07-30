// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  Shared Console Colours
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)

export const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  c1: '\x1b[38;5;27m',
  c2: '\x1b[38;5;33m',
  c3: '\x1b[38;5;39m',
  c4: '\x1b[38;5;45m',
  c5: '\x1b[38;5;51m',
  c6: '\x1b[38;5;87m',
  white:  '\x1b[97m',
  muted:  '\x1b[38;5;245m',
  red:    '\x1b[91m',
  green:  '\x1b[38;5;48m',
  yellow: '\x1b[38;5;220m',
};

export const RULE = `${c.muted}${'-'.repeat(52)}${c.reset}`;
