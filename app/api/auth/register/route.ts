import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { hashPassword, setAuthCookie, signToken } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { registerSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid registration data", 422);

    await connectDB();
    const existing = await User.findOne({ email: parsed.data.email }).lean();
    if (existing) return jsonError("Email already registered", 409);

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    });

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });
    await setAuthCookie(token);

    return NextResponse.json(
      {
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register API error:", error);
    return jsonError("Registration failed", 500);
  }
}
