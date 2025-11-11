import { useState } from "react";
import { generateQuiz } from "../services/api";
import QuizDisplay from "../components/QuizDisplay";
import { useNavigate } from "react-router-dom";

const COUNTS = [5,10, 20, 30, 40, 50];

export default function GenerateQuizTab() {
  const [url, setUrl] = useState("");
  const [count, setCount] = useState(10);
  const [hideAnswers, setHideAnswers] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

async function handleGenerate() {
  if (!url.trim()) {
    alert("Please enter a Wikipedia URL");
    return;
  }

  const wikiPattern = /^https?:\/\/(en\.)?wikipedia\.org\/wiki\/[^ ]+$/i;
  if (!wikiPattern.test(url.trim())) {
    alert("* Enter a valid Wikipedia URL");
    return;
  }

  try {
    const title = url.split("/wiki/")[1];
    const check = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
    if (!check.ok) {
      alert("* Wikipedia article not found. Enter a valid URL.");
      return;
    }
    const info = await check.json();
    if (info.type === "https://mediawiki.org/wiki/HyperSwitch/errors/not_found") {
      alert("* Wikipedia article does not exist. Try another URL.");
      return;
    }
  } catch {
    alert("* Unable to validate Wikipedia page. Check your internet.");
    return;
  }

  setLoading(true);
  setData(null);

  try {
    const res = await generateQuiz(url, false, count);
    setData(res);
    localStorage.setItem("activeQuiz", JSON.stringify(res));
  } catch {
    alert("Quiz generation failed");
  }

  setLoading(false);
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
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        

        <button 
          className="btn btn-primary cursor-pointer hover:opacity-90" 
          onClick={handleGenerate} 
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Quiz"}
        </button>

        {data && (
  <button 
    className="btn bg-green-600 hover:bg-green-700 text-white cursor-pointer"
    onClick={() => navigate("/exam")}
  >
    Start Quiz
  </button>
)}

      </div>

      {data && <QuizDisplay data={data} hideAnswers={hideAnswers} />}
    </div>
  );
}
