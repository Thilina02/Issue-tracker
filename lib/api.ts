import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAuth() {
  const session = await getSessionFromCookie();
  if (!session) return null;
  return session;
}
