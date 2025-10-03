// lib/db/client.ts
import "dotenv/config";
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../drizzle/schema";

// Choose connection string (pooled for runtime; direct is fine in dev)
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error(
    "Missing DATABASE_URL (or DIRECT_URL) for database connection."
  );
}

const isLocal =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

const debugEnabled = process.env.NODE_ENV === "development";

const sqlClient = (() => {
  // Reuse the same client across hot reloads in dev
  if (globalThis.__postgres) return globalThis.__postgres;

  const client = postgres(connectionString, {
    ssl: isLocal ? false : "require",
    max: 10, // max connections in pool
    idle_timeout: 20, // seconds
    connect_timeout: 30, // seconds
    prepare: false, // better compatibility with pgbouncer
    onnotice: () => {}, // silence NOTICE logs
    debug: debugEnabled
      ? (connInfo, query, params) => {
          // Lightweight debug log in dev; comment out if too noisy
          console.log("[SQL]", query, params);
        }
      : undefined,
  });

  globalThis.__postgres = client;
  return client;
})();

export const db: PostgresJsDatabase<typeof schema> =
  globalThis.__drizzle ?? drizzle(sqlClient, { schema });

if (!globalThis.__drizzle) {
  globalThis.__drizzle = db;
}

// Optional: expose the raw sql client (e.g., for COPY or manual queries)
export const sql = sqlClient;

// Graceful shutdown helper (optional; not usually needed in serverless)
export const closeDb = async () => {
  try {
    await sqlClient.end({ timeout: 5 });
  } catch {
    // ignore
  } finally {
    globalThis.__postgres = undefined;

    globalThis.__drizzle = undefined;
  }
};

// Types
export type DB = typeof db;

// Extend the global type to avoid TS complaints
declare global {
  var __postgres: ReturnType<typeof postgres> | undefined;

  var __drizzle: PostgresJsDatabase<typeof schema> | undefined;
}
