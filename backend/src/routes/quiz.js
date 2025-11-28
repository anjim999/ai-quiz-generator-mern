import { Router } from "express";
import {
  health,
  generateQuiz,
  history,
  getQuiz,
  submitAttempt,
  exportPdf,
} from "../controllers/quiz.controller.js";
import auth from "../middleware/auth.js";

const router = Router();

router.get("/health", health);

router.use(auth);

router.post("/generate_quiz", generateQuiz);
router.get("/history", history);
router.get("/quiz/:quiz_id", getQuiz);
router.post("/submit_attempt/:quiz_id",submitAttempt);
router.post("/export_pdf/:quiz_id", exportPdf);

export default router;
