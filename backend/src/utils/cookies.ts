import type { CookieOptions } from "express";

export const TOKEN_COOKIE = "issue_tracker_token";

export function getAuthCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    // Cross-site requests (frontend on a different Vercel domain) require SameSite=None.
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24 * 7 * 1000,
  };
}

export function getClearCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
    maxAge: 0,
  };
}

