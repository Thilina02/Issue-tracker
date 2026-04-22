import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

export function signToken(payload: SessionPayload) {
  const { JWT_SECRET } = getEnv();
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const { JWT_SECRET } = getEnv();
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

