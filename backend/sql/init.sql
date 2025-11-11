-- quizzes table (same fields/constraints)
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  url VARCHAR(2048) NOT NULL,
  title VARCHAR(512) NOT NULL,
  date_generated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scraped_html TEXT NULL,
  scraped_text TEXT NULL,
  full_quiz_data TEXT NOT NULL
);

-- unique URL (uq_quizzes_url)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uq_quizzes_url'
  ) THEN
    CREATE UNIQUE INDEX uq_quizzes_url ON quizzes (url);
  END IF;
END $$;

-- quiz_attempts table (same columns)
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ NULL,
  total_time INT NULL,
  total_questions INT NULL,
  time_taken_seconds INT NULL,
  score INT NULL,
  answers_json TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts (quiz_id);
