export default function ScoreCard({ data }) {
  if (!data) return <p>No attempt recorded for this quiz</p>;

  const { quizId, score, count, usedTime, totalSeconds } = data;

  const percent = ((score / count) * 100).toFixed(1);
  const timeUsed = `${Math.floor(usedTime / 60)}m ${usedTime % 60}s`;
  const totalTime = `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;

  async function downloadPDF() {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/export_pdf/${quizId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: "Student",
        count,
        duration_str: timeUsed,
      }),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz_${quizId}_result.pdf`;
    a.click();
  }

  return (
    <div className="space-y-4">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="border p-3 rounded">
          <p className="text-gray-500 text-xs">Score</p>
          <p className="font-bold text-lg">{score}/{count}</p>
        </div>
        <div className="border p-3 rounded">
          <p className="text-gray-500 text-xs">Accuracy</p>
          <p className="font-bold text-lg">{percent}%</p>
        </div>
        <div className="border p-3 rounded">
          <p className="text-gray-500 text-xs">Time Used</p>
          <p className="font-bold">{timeUsed}</p>
        </div>
        <div className="border p-3 rounded">
          <p className="text-gray-500 text-xs">Total Time Allowed</p>
          <p className="font-bold">{totalTime}</p>
        </div>
      </div>

      {/* PDF Button */}
      <button className="cursor-pointer btn btn-primary w-full" onClick={downloadPDF}>
        Download PDF
      </button>
    </div>
  );
}
