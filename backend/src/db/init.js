import { queryWithRetry } from "./pool.js";

export async function initDb() {
  const schema = `
  CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    url VARCHAR(2048) NOT NULL,
    title VARCHAR(512) NOT NULL,
    date_generated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scraped_html TEXT,
    scraped_text TEXT,
    full_quiz_data TEXT NOT NULL
  );

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE indexname = 'uq_quizzes_url'
    ) THEN
      CREATE UNIQUE INDEX uq_quizzes_url ON quizzes (url);
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    total_time INT,
    total_questions INT,
    time_taken_seconds INT,
    score INT,
    answers_json TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts (quiz_id);
  `;

  try {
    console.log("🛠️ Applying DB schema...");
    // Use retry wrapper for init since cloud DBs sometimes drop connections during cold starts
    await queryWithRetry(schema, [], 3, 200);
    console.log("✅ Database ready");
  } catch (err) {
    // Re-throw after logging so callers (startup) can decide whether to exit
    console.error("❌ DB init error:", err && err.stack ? err.stack : err);
    throw err;
  }
}
