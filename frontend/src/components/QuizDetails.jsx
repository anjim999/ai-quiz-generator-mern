import React, { useMemo, useState, useEffect } from "react";

export default function QuizDetails({ data, takeMode = false }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Load saved answers from lastResult in history mode
  useEffect(() => {
    if (!takeMode) {
      const result = JSON.parse(localStorage.getItem("lastResult")) || {};
      setAnswers(result.answers || {});
      setSubmitted(true);
    }
  }, [takeMode]);

  const score = useMemo(() => {
    if (!submitted) return 0;
    return data.quiz.reduce((acc, q, idx) => acc + (answers[idx] === q.answer ? 1 : 0), 0);
  }, [submitted, answers, data]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">{data.title}</h2>
          <p className="text-sm text-gray-600">{data.url}</p>
          <p className="mt-3">{data.summary}</p>
          <div className="mt-3 space-x-2">
            {data.sections?.slice(0, 6).map((s, i) => (
              <span key={i} className="badge">{s}</span>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-2">Key Entities</h3>
          <div className="text-sm">
            <p><span className="font-medium">People:</span> {data.key_entities?.people?.join(", ") || "—"}</p>
            <p><span className="font-medium">Organizations:</span> {data.key_entities?.organizations?.join(", ") || "—"}</p>
            <p><span className="font-medium">Locations:</span> {data.key_entities?.locations?.join(", ") || "—"}</p>
          </div>

          <h3 className="font-semibold mt-4 mb-2">Related Topics</h3>
          <div className="flex flex-wrap gap-2">
            {data.related_topics?.map((t, i) => <span key={i} className="badge">{t}</span>)}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Quiz</h3>

        <div className="space-y-5">
          {data.quiz?.map((q, idx) => (
            <div key={idx} className="border-b pb-4">
              <div className="flex items-center gap-2">
                <span className="badge">{q.difficulty}</span>
                <p className="font-medium">{idx + 1}. {q.question}</p>
              </div>

              {/* Options */}
              <div className="mt-2 grid gap-2">
                {q.options.map((opt, i) => {
                  const id = `q${idx}-opt${i}`;
                  const checked = answers[idx] === opt;

                  // Apply green or red only to user's chosen option
                  const colorClass = !takeMode
  ? checked
    ? opt === q.answer
      ? "text-green-700 font-semibold border-green-600"
      : "text-red-700 font-semibold border-red-600"
    : "text-gray-800"
  : "";


                  return (
                    <label key={id} htmlFor={id} className="flex items-center gap-2 cursor-pointer">

                      {takeMode && (
                        <input
                          id={id}
                          type="radio"
                          name={`q-${idx}`}
                          checked={checked}
                          onChange={() => setAnswers(a => ({ ...a, [idx]: opt }))}
                        />
                      )}

                      {!takeMode && (
                        <input type="radio" checked={checked} disabled />
                      )}

<span className={`px-3 py-2 rounded-lg border ${colorClass}`}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Always show correct + explanation when submitted or viewing history */}
              {submitted && (
                <div className="mt-3 bg-gray-50 p-3 rounded border text-sm">
                  <p><b>Ans:</b> {q.answer}</p>
                  <p className="mt-1"><b>Why:</b> {q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
