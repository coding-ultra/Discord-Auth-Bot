// ─────────────────────────────────────────────────────────────────────────────
//  Synora 乂 𝙳evelopment  ·  Atomic JSON File I/O
// ─────────────────────────────────────────────────────────────────────────────
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
//
// writeJsonAtomic() writes to a temporary file in the same directory and then
// renames it over the target. rename() on the same filesystem is atomic, so a
// crash mid-write can never leave a half-written / corrupted JSON file behind.

import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { dirname } from 'path';

/**
 * Ensure the parent directory of `filePath` exists, creating it (and any
 * missing parents) if necessary.
 */
export function ensureFileDir(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Read and parse a JSON file. If the file doesn't exist, create it with
 * `fallback` first. If it exists but is corrupt/unreadable, returns `fallback`
 * without touching the file (so a manual recovery is possible).
 */
export function readJson(filePath, fallback = {}) {
  ensureFileDir(filePath);
  if (!existsSync(filePath)) {
    writeJsonAtomic(filePath, fallback);
    return structuredClone(fallback);
  }
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return structuredClone(fallback);
  }
}

/**
 * Atomically write `data` as pretty-printed JSON to `filePath`.
 *
 * Writes to `${filePath}.tmp-<pid>-<rand>` first, then renames it into place.
 * The rename is atomic on POSIX and Windows filesystems, so readers will
 * always see either the old file or the fully-written new file — never a
 * half-written / truncated one.
 */
export function writeJsonAtomic(filePath, data, indent = 4) {
  ensureFileDir(filePath);

  const tmpPath = `${filePath}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`;

  try {
    writeFileSync(tmpPath, JSON.stringify(data, null, indent), 'utf8');
    renameSync(tmpPath, filePath);
  } catch (err) {
    // Best-effort cleanup of the temp file if the rename failed.
    try { if (existsSync(tmpPath)) unlinkSync(tmpPath); } catch { /* ignore */ }
    throw err;
  }
}
