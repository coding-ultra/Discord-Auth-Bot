// : ! Synora 乂 𝙳evelopment !
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
// + For any queries reach out to our community or DM us.

import { mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const DB_DIR = join(__dirname, '../../database/system');

/**
 * Ensures the database directory exists.
 */
export function ensureDir() {
    if (!existsSync(DB_DIR)) {
        mkdirSync(DB_DIR, { recursive: true });
    }
}

// : ! Synora 乂 𝙳evelopment !
// + Discord: dsc.gg/synoraxdev
// + Community: https://dsc.gg/synoraxdev (Synora 乂 𝙳evelopment)
// + For any queries reach out to our community or DM us.
