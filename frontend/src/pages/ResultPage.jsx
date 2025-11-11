// src/pages/ResultPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResultPage() {
  const nav = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("lastResult"));
    if (!data) return nav("/dashboard");
    setResult(data);
  }, []);

  if (!result) return null;

  const mins = Math.floor(result.usedTime / 60);
  const secs = result.usedTime % 60;

  const retakeQuiz = () => {
    let active = JSON.parse(localStorage.getItem("activeQuiz"));
    if (active) {
      active.answers = {};
      localStorage.setItem("activeQuiz", JSON.stringify(active));
    }
    nav("/exam");
  };

  const downloadPDF = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/export_pdf/${result.quizId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  user: "Candidate",
  count: result.count,
  duration_str: `${mins}m ${secs}s`,
  user_answers: result.answers,     
  score: result.score,            
  total: result.count               
}),

      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz_result_${result.quizId}.pdf`;
      a.click();
    } catch (err) {
      alert("Failed to download PDF");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-xl border shadow">
      <h2 className="text-2xl font-bold text-center mb-4">Quiz Completed</h2>

      <div className="space-y-2 text-lg">
        <p><b>Total Questions:</b> {result.count}</p>
        <p><b>Total Duration:</b> {result.count} mins</p>
        <p><b>Time Taken:</b> {mins}m {secs}s</p>
        <p><b>Score:</b> {result.score}/{result.count}</p>
      </div>

      <div className="flex flex-col gap-3 mt-6">
        <button className="cursor-pointer btn btn-primary w-full" onClick={downloadPDF}>
          Download PDF
        </button>

        <button className="cursor-pointer btn btn-success w-full" onClick={retakeQuiz}>
          Retake Quiz
        </button>

        <button className="cursor-pointer btn btn-error w-full" onClick={() => nav("/dashboard")}>
          Close
        </button>
      </div>
    </div>
  );
}
