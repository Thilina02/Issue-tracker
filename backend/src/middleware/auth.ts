import type { NextFunction, Request, Response } from "express";
import { TOKEN_COOKIE } from "../utils/cookies";
import { verifyToken, type SessionPayload } from "../utils/jwt";

export type AuthedRequest = Request & { user: SessionPayload };

export function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (!token || typeof token !== "string") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  (req as AuthedRequest).user = payload;
  next();
}

