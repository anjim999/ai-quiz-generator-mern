// src/tabs/HistoryTab.jsx
import React, { useEffect, useState } from "react";
import { fetchHistory, fetchQuizById } from "../services/api";
import HistoryTable from "../components/HistoryTable";
import Modal from "../components/Modal";
import ScoreCard from "../components/ScoreCard";
import QuizDetails from "../components/QuizDetails";
import Navbar from "../components/Navbar";
export default function HistoryTab() {
  const [rows, setRows] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [open, setOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  async function load() {
    try {
      const res = await fetchHistory();
      setRows(res.items || []);
    } catch (err) {
      console.error("Failed to load history:", err);
      alert(`Failed to load history: ${err.message}`);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDetails(id) {
    try {
      const data = await fetchQuizById(id);
      setSelectedQuiz(data);
      setOpen(true);

      const saved = JSON.parse(localStorage.getItem("lastResult"));
      setLastResult(saved && saved.quizId === id ? saved : null);
    } catch (err) {
      console.error("Failed to load quiz details:", err);
      alert(`Failed to load quiz: ${err.message}`);
    }
  }

  return (
    <>
    <Navbar/>
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
      </>
  );
}
