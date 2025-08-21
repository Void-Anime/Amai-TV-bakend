import express from "express";
import cors from "cors";
import { animeRouter } from "./routes/anime";

export function createApp() {
  const app = express();

  // CORS: allow configured origins or default to * for simplicity
  const corsOrigins = (process.env.CORS_ORIGINS || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: corsOrigins.length === 0 || corsOrigins.includes("*") ? true : corsOrigins,
      credentials: true,
    })
  );

  app.use(express.json());

  // Mount API under /api (keeps compatibility with frontend rewrites)
  app.use("/api", animeRouter);

  return app;
}


