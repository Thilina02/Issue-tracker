import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { comparePassword, setAuthCookie, signToken } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { loginSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid login data", 422);

    await connectDB();
    const user = await User.findOne({ email: parsed.data.email });
    if (!user) return jsonError("Invalid credentials", 401);

    const valid = await comparePassword(parsed.data.password, user.passwordHash);
    if (!valid) return jsonError("Invalid credentials", 401);

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return jsonError("Login failed", 500);
  }
}
