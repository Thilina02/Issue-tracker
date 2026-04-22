import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof HttpError ? err.status : 500;
  const rawMessage = err instanceof Error ? err.message : "Server error";
  const message =
    rawMessage.includes("querySrv") || rawMessage.includes("ECONNREFUSED")
      ? "Database connection failed. Check your internet/DNS access and MongoDB URI."
      : rawMessage;
  res.status(status).json({ error: message || "Server error" });
}

