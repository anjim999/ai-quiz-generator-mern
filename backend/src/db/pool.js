// backend/src/db/pool.js
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;


function makePoolConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  const cfg = {
    connectionString,
    max: Number(process.env.PG_MAX_CLIENTS) || 6,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  const urlLower = connectionString.toLowerCase();
  const forceSsl = process.env.PG_FORCE_SSL === "true" || urlLower.includes("sslmode=require") || urlLower.includes("neon");
  if (forceSsl) {
    cfg.ssl = { rejectUnauthorized: false }; 
  }

  return cfg;
}

export const pool = new Pool(makePoolConfig());


pool.on("error", (err, client) => {
  console.error("Unexpected error on idle pg client:", err && err.stack ? err.stack : err);
});


pool.on("connect", (client) => {
  console.log("pg: new client connected");
});


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


export async function queryWithRetry(text, params = [], retries = 2, backoff = 200) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await query(text, params);
    } catch (err) {
      if (attempt === retries) throw err;

      const transient = /terminat|connection (reset|terminated)|ECONNRESET|ETIMEDOUT/i.test(err.message);
      if (!transient) throw err;

      console.warn(`pg: transient query error, retrying (${attempt + 1}/${retries}) in ${backoff}ms: ${err.message}`);
      await new Promise((r) => setTimeout(r, backoff));
      backoff *= 2;
    }
  }
}
