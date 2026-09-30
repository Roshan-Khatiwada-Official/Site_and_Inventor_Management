// Loads a backup JSON file (the same shape saved to the repo's `backups/`
// folder, or read straight from the old Google Sheets bridge) into
// Postgres, via the same writeAppData() the API's POST /api/data uses.
//
// Usage: npm run db:import-backup -- ../backups/sheet_backup_<...>.json

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { writeAppData } from '../lib/sync.js';
import { prisma } from '../lib/prisma.js';
import type { AppData } from '../types.js';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: npm run db:import-backup -- <path-to-backup.json>');
    process.exit(1);
  }
  const path = resolve(process.cwd(), file);
  const raw = readFileSync(path, 'utf-8');
  const data = JSON.parse(raw) as AppData;

  console.log(`Importing from ${path}`);
  console.log({
    sites: data.sites?.length ?? 0,
    inventory: data.inventory?.length ?? 0,
    assignments: data.assignments?.length ?? 0,
    requests: data.requests?.length ?? 0,
    users: data.users?.length ?? 0,
  });

  await writeAppData(data);
  console.log('Import complete.');
}

main()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
