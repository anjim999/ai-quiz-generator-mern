import { useState } from "react";
import { generateQuiz } from "../services/api";
import QuizDisplay from "../components/QuizDisplay";
import { useNavigate } from "react-router-dom";

const COUNTS = [5, 10, 20, 30, 40, 50];

export default function GenerateQuizTab() {
  const [url, setUrl] = useState("");
  const [count, setCount] = useState(10);
  const [hideAnswers, setHideAnswers] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleGenerate() {
    const trimmed = url.trim();
    if (!trimmed) {
      alert("Please enter a Wikipedia URL");
      return;
    }

    // Accept urls like:
    // https://en.wikipedia.org/wiki/Alan_Turing
    // https://en.wikipedia.org/w/index.php?title=Alan_Turing&oldid=...
    const wikiPattern = /^https?:\/\/(en\.)?wikipedia\.org\/(wiki|w)\/?/i;
    if (!wikiPattern.test(trimmed)) {
      alert("* Enter a valid Wikipedia URL");
      return;
    }

    // Extract title robustly using URL API
    let title;
    try {
      const u = new URL(trimmed);
      // Prefer path segment after /wiki/, otherwise fallback to ?title=
      if (u.pathname.startsWith("/wiki/")) {
        title = u.pathname.split("/wiki/")[1];
      } else {
        // fallback for URLs like /w/index.php?title=Foo
        title = u.searchParams.get("title");
      }
      if (!title) throw new Error("no title");
    } catch (err) {
      alert("* Unable to parse Wikipedia URL. Enter a valid URL.");
      return;
    }

    // Validate existence on Wikipedia
    try {
      const encodedTitle = encodeURIComponent(title);
      const check = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`);
      if (!check.ok) {
        alert("* Wikipedia article not found. Enter a valid URL.");
        return;
      }
      const info = await check.json();
      if (info.type === "https://mediawiki.org/wiki/HyperSwitch/errors/not_found") {
        alert("* Wikipedia article does not exist. Try another URL.");
        return;
      }
    } catch (e) {
      alert("* Unable to validate Wikipedia page. Check your internet.");
      return;
    }

    setLoading(true);
    setData(null);

    try {
      // If generateQuiz signature is generateQuiz(url, hideAnswersFlag, count)
      // pass hideAnswers state instead of hardcoded false if that's intended.
      const res = await generateQuiz(trimmed, hideAnswers, count);
      setData(res);
      localStorage.setItem("activeQuiz", JSON.stringify(res));
    } catch (err) {
      console.error("Quiz generation failed:", err);
      alert("Quiz generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <label className="font-medium text-gray-700">Wikipedia Article URL</label>
      <input
        className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="https://en.wikipedia.org/wiki/Alan_Turing"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <div className="flex items-center gap-4">
        <label>Questions:</label>
        <select
          className="select select-bordered cursor-pointer hover:border-gray-400"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        >
          {COUNTS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <button className="btn btn-primary cursor-pointer hover:opacity-90" onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Quiz"}
        </button>

        {data && (
          <button className="btn bg-green-600 hover:bg-green-700 text-white cursor-pointer" onClick={() => navigate("/exam")}>
            Start Quiz
          </button>
        )}
      </div>

      {data && <QuizDisplay data={data} hideAnswers={hideAnswers} />}
    </div>
  );
}
