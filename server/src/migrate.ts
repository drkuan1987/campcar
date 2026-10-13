import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

const sql = await readFile(fileURLToPath(new URL('../migrations/001_init.sql', import.meta.url)), 'utf8');
try {
  await db.query(sql);
  console.log('Database migration applied.');
} finally {
  await db.end();
}
