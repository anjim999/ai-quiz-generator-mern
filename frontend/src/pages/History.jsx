import { useEffect, useState } from "react";
import HistoryTable from "../components/HistoryTable";
import Modal from "../components/Modal";
import ScoreCard from "../components/ScoreCard";
import QuizDetails from "../components/QuizDetails";
import QuizDisplay from "../components/QuizDisplay";

export default function History() {
  const [items, setItems] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/history`)
      .then(r => r.json())
      .then(d => setItems(d.items || []));
  }, []);

  async function openDetails(id) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/quiz/${id}`);
    const quiz = await res.json();
    setSelectedQuiz(quiz);

    const r = JSON.parse(localStorage.getItem("lastResult"));
    setLastResult(r && r.quizId === id ? r : null);
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 cursor-pointer">Quiz History</h2>

      <HistoryTable items={items} onDetails={openDetails} />

      {selectedQuiz && (
        <Modal
          open={true}
          onClose={() => setSelectedQuiz(null)}
          title="Quiz Summary"
          scoreCard={<ScoreCard data={lastResult} />}
          assignmentDetails={<QuizDetails data={selectedQuiz} />}
        />
      )}
    </div>
  );
}
