// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
console.log('🔍 DIRECT_URL:', process.env.DIRECT_URL);
console.log('🔍 Using URL:', url);

if (!url) {
  throw new Error('Missing DIRECT_URL or DATABASE_URL in environment for Drizzle.');
}

export default defineConfig({
  schema: './src/drizzle/schema.ts',
  out: './src/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url,
    ssl: true,
  },
  strict: true,
  verbose: true,
});