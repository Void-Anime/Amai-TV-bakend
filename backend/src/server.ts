import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { animeRouter } from "./routes/anime";

dotenv.config();

const app = express();

// Configure CORS for Vercel deployment
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : true,
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// API routes
app.use("/api", animeRouter);

// Root endpoint
app.get("/", (_req, res) => res.json({ 
  message: "Anime API Server", 
  version: "1.0.0",
  endpoints: ["/api/health", "/api/anime_list", "/api/anime_details", "/api/search", "/api/episode_players", "/api/image", "/api/logo"]
}));

// Export for Vercel serverless functions
export default app;

// Start server if running directly (not on Vercel)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`);
  });
}


