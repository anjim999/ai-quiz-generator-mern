import express from "express";
import cors from "cors";
import morgan from "morgan";

import quizRoutes from "./routes/quiz.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";

import { initDb } from "./db/init.js";
import { PORT } from "./config/env.js";

const app = express();

const whitelist = ['http://localhost:5173', 'https://ai-quiz-generator-mern.vercel.app'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);

app.use("/api/quiz", quizRoutes);

app.use("/api/admin", adminRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "AI Quiz Generator backend" });
});

async function startServer() {
  try {
    await initDb();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
