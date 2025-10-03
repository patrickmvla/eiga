// drizzle/migrate.ts
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing DIRECT_URL or DATABASE_URL in environment.');
  process.exit(1);
}

const isLocal =
  databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

// For Supabase/Neon/etc. require SSL; for local dev disable
const sql = postgres(databaseUrl, {
  ssl: isLocal ? false : 'require',
  max: 1, // single connection for migrations
});

const db = drizzle(sql);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, './migrations');

try {
  console.log(`Running migrations from: ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log('✅ Migrations complete');
} catch (err) {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
} finally {
  // Close connection gracefully
  await sql.end({ timeout: 5 });
}