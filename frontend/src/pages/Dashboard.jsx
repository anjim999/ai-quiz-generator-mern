import { useState } from "react";
import GenerateQuizTab from "../tabs/GenerateQuizTab";
import HistoryTab from "../tabs/HistoryTab";
import { Link } from "react-router-dom";

const Dashboard=()=> {
  const [tab, setTab] = useState("generate");

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">AI Wiki Quiz Dashboard</h1>
        {/* <Link to="/" className="btn btn-ghost focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500">
          Home
        </Link> */}
      </div>

      <div className="flex gap-3 mb-6">
        <button
          className={`btn ${tab === "generate" ? "btn-primary" : "btn-outline"} cursor-pointer hover:opacity-90`}
          onClick={() => setTab("generate")}
        >
          Generate Quiz
        </button>
        <button
          className={`btn ${tab === "history" ? "btn-primary" : "btn-outline"} cursor-pointer hover:opacity-90`}
          onClick={() => setTab("history")}
        >
          Past Quizzes
        </button>
        
      </div>

      {tab === "generate" ? <GenerateQuizTab /> : <HistoryTab />}

      {/* <footer className="pt-10 text-center text-xs opacity-60">
        DeepKlarity Assignment • FastAPI + React
      </footer> */}

    </div>
  );
}

export default Dashboard;