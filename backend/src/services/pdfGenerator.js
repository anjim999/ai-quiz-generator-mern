import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

/**
 * Streams a PDF (Content-Disposition as attachment set by controller).
 * TC: O(Q) | SC: O(1) (streaming)
 */
export function buildExamPdf({ orgTitle, user, quizTitle, quiz, durationStr }) {
  const doc = new PDFDocument({ size: "A4", margin: 56 });
  const stream = new PassThrough();
  doc.pipe(stream);

  const score = quiz?.score ?? 0;
  const total = quiz?.total ?? (quiz?.quiz?.length || 0);
  const userAnswers = quiz?.user_answers || {};
  const letters = ["A", "B", "C", "D"];

  doc.fontSize(20).text(orgTitle);
  doc.moveDown(0.5);
  doc.fontSize(16).text(quizTitle);
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Candidate: ${user || "Anonymous"}`);
  doc.text(`Score: ${score}/${total}`);
  doc.text(`Time Taken: ${durationStr || "—"}`);
  doc.moveDown();

  (quiz?.quiz || []).forEach((q, idx) => {
    const i = idx + 1;
    const userAns = userAnswers[String(idx)];
    const isCorrect = userAns === q.answer;

    doc.fontSize(12).text(`Q${i}. ${q.question}`);
    (q.options || []).forEach((opt, j) => {
      const mark = opt === userAns ? (isCorrect ? " ✓" : " ✗") : "";
      doc.text(`${letters[j]}) ${opt}${mark}`);
    });
    doc.text(`Correct Answer: ${q.answer}`);
    if (q.explanation) doc.text(`Why: ${q.explanation}`);
    doc.moveDown(0.5);
  });

  doc.end();
  return stream;
}
