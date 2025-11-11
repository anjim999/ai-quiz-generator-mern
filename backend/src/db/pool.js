import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

/**
 * Creates a pg Pool using DATABASE_URL.
 * Neon requires SSL; include `sslmode=require` in your URL.
 *
 * TC: O(1) to create pool handle
 * SC: O(1)
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For Neon, 'sslmode=require' in URL is enough. If needed, you can enforce:
  // ssl: { rejectUnauthorized: false },
});

export async function query(text, params) {
  // TC: O(1) per query dispatch; SC: O(1)
  const res = await pool.query(text, params);
  return res;
}
