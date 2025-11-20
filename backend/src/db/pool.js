import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

/**
 * Build Pool options from DATABASE_URL with optional SSL for Neon/managed Postgres.
 */
function makePoolConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  const cfg = {
    connectionString,
    // reduce number of sockets if DB has low connection limit
    max: Number(process.env.PG_MAX_CLIENTS) || 6,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  // Some hosts (Neon, Heroku, etc.) require SSL even for local connections.
  // If the URL has sslmode=require or the user sets PG_FORCE_SSL, enable ssl with relaxed verification.
  const urlLower = connectionString.toLowerCase();
  const forceSsl = process.env.PG_FORCE_SSL === "true" || urlLower.includes("sslmode=require") || urlLower.includes("neon");
  if (forceSsl) {
    cfg.ssl = { rejectUnauthorized: false }; // common and practical for managed providers
  }

  return cfg;
}

export const pool = new Pool(makePoolConfig());

/**
 * Important: handle unexpected errors on idle clients to get useful diagnostics
 * and prevent silent pool termination.
 */
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle pg client:", err && err.stack ? err.stack : err);
  // Note: do NOT exit automatically here in all environments; choose per your app needs.
});

/**
 * Optionally log when client connects (helpful for debugging connection churn)
 */
pool.on("connect", (client) => {
  console.log("pg: new client connected");
});

/**
 * Simple query wrapper that logs and throws. Use queryWithRetry for transient resilience.
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`pg: query OK (${duration}ms) rows=${res.rowCount}`);
    return res;
  } catch (err) {
    console.error("pg: query error", { message: err.message, text: (text || "").slice(0, 200) });
    throw err;
  }
}

/**
 * Retry wrapper for transient errors (e.g. connection reset/terminated). Use sparingly.
 */
export async function queryWithRetry(text, params = [], retries = 2, backoff = 200) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await query(text, params);
    } catch (err) {
      // If no more retries, rethrow
      if (attempt === retries) throw err;

      // For some errors it's pointless to retry (auth errors, syntax errors). Check basic heuristics:
      const transient = /terminat|connection (reset|terminated)|ECONNRESET|ETIMEDOUT/i.test(err.message);
      if (!transient) throw err;

      console.warn(`pg: transient query error, retrying (${attempt + 1}/${retries}) in ${backoff}ms: ${err.message}`);
      await new Promise((r) => setTimeout(r, backoff));
      backoff *= 2;
    }
  }
}
