import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Timer from "../components/Timer";
import AntiTabSwitch from "../components/AntiTabSwitch";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function QuizMode() {
  const nav = useNavigate();

  const active = useMemo(() => {
    const raw = localStorage.getItem("activeQuiz");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const [submitted, setSubmitted] = useState(false);
  const [fsExitCount, setFsExitCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFsModal, setIsFsModal] = useState(false);
  const [answers, setAnswers] = useState({});
  const answersRef = useRef(answers);
  const startTimeRef = useRef(Date.now());
  const camRef = useRef(null);

  if (!active) return <div className="h-[60vh] grid place-items-center text-xl">No active quiz!</div>;

  const count = active.quiz.length;
  const totalSeconds = count * 60;

  // ✅ Score calculator
  function scoreNow() {
    let s = 0;
    active.quiz.forEach((q, i) => {
      if (answersRef.current[i] !== undefined && q.options[answersRef.current[i]] === q.answer) s++;
    });
    return s;
  }

  // ✅ Stop camera safely
  function stopCamera() {
    try {
      camRef.current?.getTracks().forEach(t => t.stop());
    } catch {}
  }

  // ✅ Submit exam
  async function submitExam(auto = false) {
    if (submitted) return;
    setSubmitted(true);

    stopCamera();
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch {}

    const usedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const score = scoreNow();

    await fetch(`${import.meta.env.VITE_API_URL}/submit_attempt/${active.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: answersRef.current,
        score,
        time_taken_seconds: usedTime,
        total_time: totalSeconds,
        total_questions: count,
        auto_submitted: auto
      })
    }).catch(() => toast.error("Server save failed, but exam ended"));

    toast.success(`Submitted! Score: ${score}/${count}`);
setTimeout(() => {
  localStorage.setItem("lastResult", JSON.stringify({
    quizId: active.id,
    score,
    usedTime,
    totalSeconds,
    count
  }));
  nav("/result");
}, 900);
  }

  // ✅ Handle violation counting
  function addStrike(type) {
    if (submitted) return;

    const newFs = type === "fs" ? fsExitCount + 1 : fsExitCount;
    const newTab = type === "tab" ? tabSwitchCount + 1 : tabSwitchCount;

    setFsExitCount(newFs);
    setTabSwitchCount(newTab);

    const total = newFs + newTab;

    toast.warn(`Violation ${total}/3`);

    // ✅ RULES:
    if (newFs >= 3 || newTab >= 3 || (newFs >= 1 && newTab >= 1) || total >= 3) {
      toast.error("Security violated. Auto-submitting.");
      setTimeout(() => submitExam(true), 400);
    }
  }

  // ✅ Mount only once: start webcam + fullscreen + block keys
  useEffect(() => {
    const start = async () => {
      try {
        if (!document.fullscreenElement)
          await document.documentElement.requestFullscreen();
      } catch {}

      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        camRef.current = s;
      } catch {
        toast.error("Webcam required. Auto submit.");
        return submitExam(true);
      }
    };

    // Block refresh + devtools
    const keyBlock = (e) => {
      const k = e.key.toLowerCase();
      if (k === "f5" || (e.ctrlKey && k === "r")) { e.preventDefault(); toast.warn("Refresh disabled"); }
      if (k === "f12" || (e.ctrlKey && e.shiftKey && ["i","j","c"].includes(k))) {
        e.preventDefault(); toast.warn("Devtools disabled");
      }
    };

    const noContext = e => e.preventDefault();

    document.addEventListener("keydown", keyBlock);
    window.addEventListener("contextmenu", noContext);

    start();

    return () => {
      document.removeEventListener("keydown", keyBlock);
      window.removeEventListener("contextmenu", noContext);
      stopCamera();
    };
  }, []);

  // ✅ Detect exit fullscreen
  useEffect(() => {
    const handleFS = () => {
      if (!document.fullscreenElement && !submitted) {
        setIsFsModal(true);
        addStrike("fs");
      }
    };
    document.addEventListener("fullscreenchange", handleFS);
    return () => document.removeEventListener("fullscreenchange", handleFS);
  }, [submitted, fsExitCount, tabSwitchCount]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <ToastContainer position="top-center" />

      <div className="flex justify-between mb-4">
        <div>
          <h2 className="font-semibold">{active.title}</h2>
          <p className="text-sm text-red-600">Violations: {fsExitCount + tabSwitchCount}/3</p>
        </div>
        <Timer totalSeconds={totalSeconds} onEnd={() => submitExam(true)} />
      </div>

      {/* ✅ Tab switch detector */}
      <AntiTabSwitch onStrike={() => addStrike("tab")} maxStrikes={3} />

      <ol className="space-y-4">
        {active.quiz.map((q, i) => (
          <li key={i} className="border p-4 rounded">
            <p className="font-medium mb-2">{i + 1}. {q.question}</p>
            {q.options.map((opt, j) => (
              <label key={j} className={`block border p-2 rounded cursor-pointer ${
                answers[i] === j ? "border-blue-600" : "border-gray-300"
              }`}>
                <input
                  type="radio"
                  name={`q${i}`}
                  checked={answers[i] === j}
                  onChange={() => {
                    const newAnswers = { ...answers, [i]: j };
                    setAnswers(newAnswers);
                    answersRef.current = newAnswers;
                  }}
                />
                {opt}
              </label>
            ))}
          </li>
        ))}
      </ol>

      <button className="btn btn-primary mt-4 cursor-pointer" onClick={() => submitExam(false)} disabled={submitted}>
        Submit Exam
      </button>

      {/* ✅ Fullscreen Exit Modal */}
      {isFsModal && !submitted && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow text-center space-y-4">
            <h2 className="text-lg font-bold">Fullscreen Required</h2>
            <p>You exited fullscreen.</p>
            <button
              className="btn btn-primary cursor-pointer"
              onClick={async () => {
                setIsFsModal(false);
                await document.documentElement.requestFullscreen();
              }}
            >
              Resume Exam in Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}