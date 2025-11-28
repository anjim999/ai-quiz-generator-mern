import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

import { fallbackQuiz } from "./fallback.js"; // ensure this exists or remove this line

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;


function extractJson(text) {
  if (typeof text !== "string") {
    throw new Error("LLM returned non-string output");
  }

  let t = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  const firstBrace = t.indexOf("{");
  if (firstBrace === -1) throw new Error("LLM returned unexpected format (no JSON object found)");

  let stack = 0;
  let endIndex = -1;
  for (let i = firstBrace; i < t.length; i++) {
    const ch = t[i];
    if (ch === "{") stack++;
    else if (ch === "}") {
      stack--;
      if (stack === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) {
    const regexMatch = t.match(/\{[\s\S]*\}/);
    if (!regexMatch) {
      throw new Error("LLM returned unexpected format (could not locate closing brace)");
    }
    t = regexMatch[0];
  } else {
    t = t.slice(firstBrace, endIndex + 1);
  }

  t = t.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(t);
  } catch (err) {
    const cleaned = t.replace(/[\u0000-\u001F]+/g, "");
    try {
      return JSON.parse(cleaned);
    } catch (err2) {
      const e = new Error("LLM returned unexpected format (JSON.parse failed)");
      e.raw = text;
      throw e;
    }
  }
}

export async function generateQuizPayload({ url, title, article_text, sections, count = 10 }) {
  if (!genAI || !process.env.GEMINI_API_KEY) {
    console.log("Gemini key missing — using fallback quiz");
    return fallbackQuiz(url, title, article_text, sections);
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
Only output JSON. No commentary. Strictly JSON object only.
`;

  try {
    const first = await model.generateContent(basePrompt(count));
    const firstText = await first.response.text();

    console.log("LLM firstText (trim):", firstText.slice(0, 500));

    let parsed;
    try {
      parsed = extractJson(firstText);
    } catch (parseErr) {
      console.error("Failed to parse first LLM output:", parseErr.message);
      console.error("Raw LLM output (firstText):", firstText.slice(0, 2000));
      throw parseErr;
    }

    let quiz = (parsed.quiz || []).map((q) => ({
      question: q.question,
      options: (q.options || []).slice(0, 4),
      answer: q.answer,
      difficulty: q.difficulty,
      explanation: q.explanation,
    })).slice(0, count);

    let attempts = 0;
    const maxAttempts = 3;

    while (quiz.length < count && attempts < maxAttempts) {
      attempts++;
      const remaining = count - quiz.length;
      const prev = quiz.map((q, i) => `- ${i + 1}. ${q.question}`).join("\n") || "None";

      const more = await model.generateContent(
        basePrompt(remaining, `${article_text}\n\nPreviously generated questions:\n${prev}`)
      );

      const moreText = await more.response.text();
      console.log(`LLM moreText (attempt ${attempts}) trim:`, moreText.slice(0, 500));

      let moreParsed;
      try {
        moreParsed = extractJson(moreText);
      } catch (e) {
        console.warn("Could not parse additional LLM output; stopping attempts.", e.message);
        break;
      }

      const moreQuiz = (moreParsed.quiz || []).map((q) => ({
        question: q.question,
        options: (q.options || []).slice(0, 4),
        answer: q.answer,
        difficulty: q.difficulty,
        explanation: q.explanation,
      }));

      const seen = new Set(quiz.map((q) => q.question));
      for (const mq of moreQuiz) {
        if (mq.question && !seen.has(mq.question)) {
          quiz.push(mq);
          seen.add(mq.question);
          if (quiz.length >= count) break;
        }
      }
    }

    quiz = quiz.slice(0, count);

    return {
      url,
      title,
      summary: parsed.summary || "",
      key_entities: parsed.key_entities || { people: [], organizations: [], locations: [] },
      sections: parsed.sections || sections,
      quiz,
      related_topics: parsed.related_topics || [],
    };

  } catch (err) {
    console.error("Gemini error — using fallback", err && err.message ? err.message : err);
    // If parsing failed, include the raw LLM output for debugging in logs only
    if (err.raw) console.error("Raw LLM output (from extractJson):", String(err.raw).slice(0, 2000));
    return fallbackQuiz(url, title, article_text, sections);
  }
}
