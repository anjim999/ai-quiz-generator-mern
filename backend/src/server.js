import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { parseOrigins } from "./utils/utils.js";
import quizRoutes from "./routes/quiz.routes.js";
import { errorHandler } from "./middlewares/error.js";
import "./db/pool.js"; 
import { initDb } from "./db/init.js";

const app = express();

// CORS (mirrors FastAPI config)
const allowed = parseOrigins(process.env.CORS_ORIGINS);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes("*") || allowed.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/", quizRoutes);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 8000);

async function startServer() {
  await initDb(); // Create tables if missing (like FastAPI)

  app.listen(PORT, () => {
    console.log(`✅ Node API running at http://localhost:${PORT}`);
  });
}

startServer();
