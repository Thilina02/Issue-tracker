import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";

export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user: {
      _id: session.userId,
      name: session.name,
      email: session.email,
    },
  });
}
