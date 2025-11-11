import React, { useState } from "react";

export default function Modal({ open, onClose, title, scoreCard, assignmentDetails }) {
  const [tab, setTab] = useState("score");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow p-5 w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="cursor-pointer btn btn-sm btn-outline" onClick={onClose}>Close</button>
        </div>

        {/* tabs */}
        <div className="flex gap-3 mb-4">
          <button
            className={`cursor-pointer btn btn-sm ${tab === "score" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setTab("score")}
          >
            Score Card
          </button>
          <button
            className={`cursor-pointer btn btn-sm ${tab === "details" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setTab("details")}
          >
            Quiz Details
          </button>
        </div>

        {tab === "score" ? scoreCard : assignmentDetails}
      </div>
    </div>
  );
}
