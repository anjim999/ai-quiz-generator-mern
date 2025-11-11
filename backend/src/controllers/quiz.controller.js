import { query } from "../db/pool.js";
import { isWikipediaUrl } from "../utils/utils.js";
import { scrapeWikipedia } from "../services/scraper.js";
import { generateQuizPayload } from "../services/llmQuizGenerator.js";
import { buildExamPdf } from "../services/pdfGenerator.js";

/** GET /health — TC: O(1), SC: O(1) */
export function health(_req, res) {
  res.json({ status: "ok" });
}

/**
 * POST /generate_quiz?count=10
 * body: { url: string, force_refresh?: boolean }
 * Behavior exactly matches FastAPI:
 *  - Validate Wikipedia URL
 *  - Optional cache by URL if ENABLE_URL_CACHE=true
 *  - Scrape, LLM generate (or fallback), trim to count
 *  - Upsert quizzes row; return payload with id
 *
 * TC: O(S + Q + DB) ≈ O(S + Q)
 * SC: O(S + Q)
 */
export async function generateQuiz(req, res, next) {
  try {
    const { url, force_refresh = false } = req.body || {};
    const count = Math.max(5, Math.min(50, parseInt(req.query.count ?? "10", 10)));

    if (!isWikipediaUrl(String(url))) {
      const e = new Error("Only Wikipedia article URLs are accepted.");
      e.status = 400;
      throw e;
    }

    const useCache = (process.env.ENABLE_URL_CACHE ?? "true").toLowerCase() === "true";
    const ex = await query("SELECT * FROM quizzes WHERE url=$1 LIMIT 1", [url]);
    const existing = ex.rows[0];

    if (useCache && existing && !force_refresh) {
      const stored = JSON.parse(existing.full_quiz_data);
      if ((stored?.quiz || []).length >= count) {
        stored.quiz = stored.quiz.slice(0, count);
        stored.id = existing.id;
        return res.json(stored);
      }
    }

    const [title, cleanedText, sections, rawHtml] = await scrapeWikipedia(url);
    if (!cleanedText || cleanedText.length < 200) {
      const e = new Error("Article content too short or could not be parsed.");
      e.status = 422;
      throw e;
    }

    const payload = await generateQuizPayload({
      url,
      title,
      article_text: cleanedText,
      sections,
      count,
    });

    payload.quiz = (payload.quiz || []).slice(0, count);
    payload.sections = payload.sections?.length ? payload.sections : sections;

    let recordId;
    if (!existing) {
      // Insert; on conflict (unique url), fetch that row
      try {
        const ins = await query(
          `INSERT INTO quizzes (url, title, scraped_html, scraped_text, full_quiz_data)
           VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [url, title, rawHtml, cleanedText, JSON.stringify(payload)]
        );
        recordId = ins.rows[0].id;
      } catch (err) {
        // conflict fallback
        const row = await query("SELECT id FROM quizzes WHERE url=$1 LIMIT 1", [url]);
        recordId = row.rows[0].id;
        await query(
          `UPDATE quizzes
             SET title=$1, scraped_html=$2, scraped_text=$3, full_quiz_data=$4
           WHERE id=$5`,
          [title, rawHtml, cleanedText, JSON.stringify(payload), recordId]
        );
      }
    } else {
      await query(
        `UPDATE quizzes
           SET title=$1, scraped_html=$2, scraped_text=$3, full_quiz_data=$4
         WHERE id=$5`,
        [title, rawHtml, cleanedText, JSON.stringify(payload), existing.id]
      );
      recordId = existing.id;
    }

    payload.id = recordId;
    return res.json(payload);
  } catch (err) {
    next(err);
  }
}

/** GET /history — TC: O(N), SC: O(N) */
export async function history(_req, res, next) {
  try {
    const rows = await query(
      "SELECT id, url, title, date_generated FROM quizzes ORDER BY date_generated DESC",
      []
    );
    const items = rows.rows.map((r) => ({
      id: r.id,
      url: r.url,
      title: r.title,
      date_generated: r.date_generated?.toISOString() ?? "",
    }));
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

/** GET /quiz/:quiz_id — TC: O(1), SC: O(1) */
export async function getQuiz(req, res, next) {
  try {
    const quizId = Number(req.params.quiz_id);
    const rows = await query("SELECT * FROM quizzes WHERE id=$1 LIMIT 1", [quizId]);
    const r = rows.rows[0];
    if (!r) {
      const e = new Error("Quiz not found");
      e.status = 404;
      throw e;
    }
    const data = JSON.parse(r.full_quiz_data);
    data.id = r.id;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /submit_attempt/:quiz_id
 * body: { answers, score, time_taken_seconds, total_time?, total_questions? }
 * TC: O(1), SC: O(1)
 */
export async function submitAttempt(req, res, next) {
  try {
    const quizId = Number(req.params.quiz_id);
    const chk = await query("SELECT id FROM quizzes WHERE id=$1", [quizId]);
    if (!chk.rowCount) {
      const e = new Error("Quiz not found");
      e.status = 404;
      throw e;
    }

    const payload = req.body || {};
    const answers = payload.answers || {};
    const score = Number(payload.score ?? 0);
    const time_taken = Number(payload.time_taken_seconds ?? 0);
    const total_time = payload.total_time != null ? Number(payload.total_time) : null;
    const total_questions =
      payload.total_questions != null ? Number(payload.total_questions) : null;

    const ins = await query(
      `INSERT INTO quiz_attempts
         (quiz_id, submitted_at, total_time, total_questions, time_taken_seconds, score, answers_json)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6)
       RETURNING id`,
      [quizId, total_time, total_questions, time_taken, score, JSON.stringify(answers)]
    );

    res.json({ saved: true, attempt_id: ins.rows[0].id });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /export_pdf/:quiz_id
 * body: { count?: number, user?: string, duration_str?: string }
 * Streams a PDF file (attachment)
 * TC: O(Q), SC: O(1)
 */
export async function exportPdf(req, res, next) {
  try {
    const quizId = Number(req.params.quiz_id);
    const rows = await query("SELECT * FROM quizzes WHERE id=$1 LIMIT 1", [quizId]);
    const r = rows.rows[0];
    if (!r) {
      const e = new Error("Quiz not found");
      e.status = 404;
      throw e;
    }

    const q = JSON.parse(r.full_quiz_data);
    q.id = r.id;

    const count = Number.isFinite(Number(req.body?.count))
      ? Number(req.body.count)
      : (q.quiz?.length || 0);

    q.quiz = (q.quiz || []).slice(0, count);
    const user = req.body?.user || "Anonymous";
    const durationStr = req.body?.duration_str || "—";

    const pdfStream = buildExamPdf({
      orgTitle: "DeepKlarity AI Exam",
      user,
      quizTitle: q.title || "Quiz",
      quiz: q,
      durationStr,
    });

    const filename = `quiz_${quizId}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    pdfStream.pipe(res);
  } catch (err) {
    next(err);
  }
}
