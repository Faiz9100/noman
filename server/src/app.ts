import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { env, isAllowedOrigin } from "./config/env";
import { notFound, errorHandler } from "./middleware/errorMiddleware";

import authRoutes from "./routes/authRoutes";
import teamRoutes from "./routes/teamRoutes";
import playerRoutes from "./routes/playerRoutes";
import auctionRoutes from "./routes/auctionRoutes";
import bidRoutes from "./routes/bidRoutes";
import historyRoutes from "./routes/historyRoutes";

const app: Application = express();

// Trust Render/Vercel-style reverse proxies so req.ip and secure cookies behave correctly.
app.set("trust proxy", 1);

// Security & parsing middleware
// crossOriginResourcePolicy defaults to "same-origin", which blocks the
// frontend (a different origin — even localhost:5173 vs localhost:5000
// count as different origins) from loading anything served here,
// including /uploads/* player photos, in CORP-enforcing browsers (Chrome,
// Edge, Firefox). This API is designed to be consumed by a cross-origin
// SPA, so resources must be cross-origin readable; auth/mutation
// endpoints are still protected separately by CORS + cookies.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser clients (curl, server-to-server, health checks) send no Origin header.
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (!env.isProduction) {
  app.use(morgan("dev"));
}

// Generous ceiling on the whole API — a real backstop against runaway clients, not a tight budget.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// A much tighter limit on login specifically, to slow down credential-guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again in a few minutes." },
});

// Static file serving for uploaded player photos / team logos
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "API is healthy", env: env.nodeEnv });
});

// API routes
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/history", historyRoutes);

// 404 + error handling (must be registered last)
app.use(notFound);
app.use(errorHandler);

export default app;
