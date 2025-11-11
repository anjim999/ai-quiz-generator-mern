import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

import { fallbackQuiz } from "./fallback.js"; // ensure this exists or remove this line

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}$/);
  if (!match) throw new Error("LLM returned unexpected format");
  return JSON.parse(match[0]);
}

/**
 * Generate quiz using Gemini
 */
export async function generateQuizPayload({ url, title, article_text, sections, count = 10 }) {
  // If Gemini key missing → fallback
  if (!genAI || !process.env.GEMINI_API_KEY) {
    console.log("⚠️ Gemini key missing — using fallback quiz");
    return fallbackQuiz(url, title, article_text, sections);
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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
  "key_entities": { "people": string[], "organizations": string[], "locations": string[] },
  "sections": string[],
  "quiz": [
    {
      "question": "string",
      "options": [string, string, string, string],
      "answer": "string",
      "difficulty": "easy" | "medium" | "hard",
      "explanation": "string"
    }
  ],
  "related_topics": string[]
}
Only output JSON. No commentary.`;

  try {
    const first = await model.generateContent(basePrompt(count));
    const firstText = first.response.text();
    const parsed = extractJson(firstText);

    let quiz = (parsed.quiz || []).map(q => ({
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

      let moreParsed;
      try { moreParsed = extractJson(more.response.text()); } catch { break; }

      const moreQuiz = (moreParsed.quiz || []).map(q => ({
        question: q.question,
        options: (q.options || []).slice(0, 4),
        answer: q.answer,
        difficulty: q.difficulty,
        explanation: q.explanation,
      }));

      const seen = new Set(quiz.map(q => q.question));
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
    console.error("❌ Gemini error — using fallback", err);
    return fallbackQuiz(url, title, article_text, sections);
  }
}
