export function fallbackQuiz(url, title, article_text, sections) {
  const baseOptions = ["Yes", "No", "Not stated", "Irrelevant"];

  const quiz = [];
  for (let i = 0; i < 5; i++) {
    quiz.push({
      question: `Is this article about '${title}'?`,
      options: baseOptions,
      answer: "Yes",
      difficulty: "easy",
      explanation: "Fallback used because Gemini API quota was exceeded or key missing."
    });
  }

  return {
    url,
    title,
    summary: `Placeholder summary for ${title}. Configure GEMINI_API_KEY for real AI output.`,
    key_entities: { people: [], organizations: [], locations: [] },
    sections: sections?.slice(0, 8) || [],
    quiz,
    related_topics: ["Wikipedia", "Article", "Reference"]
  };
}
