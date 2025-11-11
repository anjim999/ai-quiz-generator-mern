import { Router } from "express";
import {
  health,
  generateQuiz,
  history,
  getQuiz,
  submitAttempt,
  exportPdf,
} from "../controllers/quiz.controller.js";

const router = Router();

router.get("/health", health);
router.post("/generate_quiz", generateQuiz);
router.get("/history", history);
router.get("/quiz/:quiz_id", getQuiz);
router.post("/submit_attempt/:quiz_id", submitAttempt);
router.post("/export_pdf/:quiz_id", exportPdf);

// WebSocket proctor endpoints were commented out in your Python; omitted for parity.

export default router;
