import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { getEnv } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler, notFound } from "./middleware/error";

function buildApp() {
  const env = getEnv();
  const allowedOrigins = env.CORS_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  function isOriginAllowed(origin: string) {
    // Support simple wildcards like "*.vercel.app" (suffix match).
    for (const entry of allowedOrigins) {
      if (entry === origin) return true;
      if (entry.startsWith("*.")) {
        const suffix = entry.slice(1); // ".vercel.app"
        if (origin.endsWith(suffix)) return true;
      }
    }
    return false;
  }

  const app = express();

  app.use(morgan("dev"));
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser or same-origin requests with no Origin header.
        if (!origin) return callback(null, true);
        if (isOriginAllowed(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return { app, env };
}

let cached:
  | {
      app: ReturnType<typeof buildApp>["app"];
      env: ReturnType<typeof buildApp>["env"];
    }
  | undefined;

function getApp() {
  if (!cached) cached = buildApp();
  return cached;
}

// Vercel (@vercel/node) expects a handler: (req, res) => void|Promise<void>
export default function handler(req: express.Request, res: express.Response) {
  const { app } = getApp();
  return app(req, res);
}

// Local development: run as a normal Express server.
if (process.env.NODE_ENV !== "production") {
  const { app, env } = getApp();
  app.listen(env.PORT, () => {
    console.log(`Express API listening on http://localhost:${env.PORT}`);
  });
}