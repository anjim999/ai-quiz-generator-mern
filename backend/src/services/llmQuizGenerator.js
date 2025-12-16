import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { fallbackQuiz } from "./fallback.js";

dotenv.config();


const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;


function extractJson(text) {
  if (typeof text !== "string") {
    throw new Error("LLM returned non-string output");
  }

  let t = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  const firstBrace = t.indexOf("{");
  if (firstBrace === -1) {
    throw new Error("LLM returned unexpected format (no JSON object found)");
  }

  let stack = 0;
  let endIndex = -1;

  for (let i = firstBrace; i < t.length; i++) {
    if (t[i] === "{") stack++;
    else if (t[i] === "}") {
      stack--;
      if (stack === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) {
    const match = t.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("LLM returned unexpected format (no closing brace)");
    }
    t = match[0];
  } else {
    t = t.slice(firstBrace, endIndex + 1);
  }

  t = t.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(t);
  } catch {
    const cleaned = t.replace(/[\u0000-\u001F]+/g, "");
    try {
      return JSON.parse(cleaned);
    } catch {
      const err = new Error("LLM returned invalid JSON");
      err.raw = text;
      throw err;
    }
  }
}


function getGeminiModel() {
  try {
    return genAI.getGenerativeModel(
      {
        model: "gemini-2.5-flash",
        apiVersion: "v1",
      },
      { retry: false }
    );
  } catch {
    return genAI.getGenerativeModel(
      {
        model: "gemini-2.5-flash-lite",
        apiVersion: "v1",
      },
      { retry: false }
    );
  }
}

async function generateWithRetry(model, prompt, maxRetries = 3) {
  let delay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      const msg = err?.message || "";

      if (!msg.includes("503") || attempt === maxRetries) {
        throw err;
      }

      console.warn(
        `Gemini overloaded (attempt ${attempt}/${maxRetries}), retrying in ${delay / 1000}s`
      );
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

export async function generateQuizPayload({
  url,
  title,
  article_text,
  sections,
  count = 10,
}) {
  if (!genAI) {
    console.log("Gemini key missing — using fallback quiz");
    return fallbackQuiz(url, title, article_text, sections);
  }

  const basePrompt = (qCount, extra = article_text) => `
You will generate a quiz and metadata in strict JSON.

URL: ${url}
TITLE: ${title}

ARTICLE_TEXT:
${extra}

Generate exactly ${qCount} high-quality multiple-choice questions (4 options each).

Schema:
{
  "url": "string",
  "title": "string",
  "summary": "string",
  "key_entities": { "people": [], "organizations": [], "locations": [] },
  "sections": [],
  "quiz": [
    {
      "question": "string",
      "options": ["string","string","string","string"],
      "answer": "string",
      "difficulty": "easy|medium|hard",
      "explanation": "string"
    }
  ],
  "related_topics": []
}

Rules:
- Only output valid JSON
- No markdown
- No explanation outside JSON
`;

  try {
    const model = getGeminiModel();

    const first = await generateWithRetry(model, basePrompt(count));
    const firstText = await first.response.text();

    let parsed = extractJson(firstText);

    let quiz = (parsed.quiz || [])
      .map((q) => ({
        question: q.question,
        options: (q.options || []).slice(0, 4),
        answer: q.answer,
        difficulty: q.difficulty,
        explanation: q.explanation,
      }))
      .slice(0, count);

    let attempts = 0;
    const maxAttempts = 3;

    while (quiz.length < count && attempts < maxAttempts) {
      attempts++;
      const remaining = count - quiz.length;

      const prevQuestions =
        quiz.map((q, i) => `- ${i + 1}. ${q.question}`).join("\n") || "None";

      const more = await generateWithRetry(
        model,
        basePrompt(
          remaining,
          `${article_text}\n\nPreviously generated questions:\n${prevQuestions}`
        )
      );

      const moreText = await more.response.text();

      let moreParsed;
      try {
        moreParsed = extractJson(moreText);
      } catch {
        break;
      }

      const seen = new Set(quiz.map((q) => q.question));
      for (const q of moreParsed.quiz || []) {
        if (q.question && !seen.has(q.question)) {
          quiz.push({
            question: q.question,
            options: (q.options || []).slice(0, 4),
            answer: q.answer,
            difficulty: q.difficulty,
            explanation: q.explanation,
          });
          seen.add(q.question);
        }
        if (quiz.length >= count) break;
      }
    }

    quiz = quiz.slice(0, count);

    return {
      url,
      title,
      summary: parsed.summary || "",
      key_entities:
        parsed.key_entities || { people: [], organizations: [], locations: [] },
      sections: parsed.sections || sections,
      quiz,
      related_topics: parsed.related_topics || [],
    };
  } catch (err) {
    console.error("Gemini error — using fallback", err?.message || err);
    if (err?.raw) {
      console.error("Raw LLM output:", String(err.raw).slice(0, 2000));
    }
    return fallbackQuiz(url, title, article_text, sections);
  }
}
