// src/tabs/HistoryTab.jsx
import React, { useEffect, useState } from "react";
import { fetchHistory, fetchQuizById } from "../services/api";
import HistoryTable from "../components/HistoryTable";
import Modal from "../components/Modal";
import ScoreCard from "../components/ScoreCard";
import QuizDetails from "../components/QuizDetails";

export default function HistoryTab() {
  const [rows, setRows] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [open, setOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  async function load() {
    const res = await fetchHistory();
    setRows(res.items || []);
  }

  useEffect(() => { load(); }, []);

  async function handleDetails(id) {
    const data = await fetchQuizById(id);
    setSelectedQuiz(data);
    setOpen(true);

    // fetch only if last result belongs to same quiz
    const saved = JSON.parse(localStorage.getItem("lastResult"));
    setLastResult(saved && saved.quizId === id ? saved : null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Past Quizzes</h3>
        <button className="btn btn-ghost border cursor-pointer" onClick={load}>Refresh</button>
      </div>

      <HistoryTable items={rows} onDetails={handleDetails} />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={"Quiz Details"}
        scoreCard={<ScoreCard data={lastResult} />}
        assignmentDetails={<QuizDetails data={selectedQuiz} />}
      />
    </div>
  );
}
