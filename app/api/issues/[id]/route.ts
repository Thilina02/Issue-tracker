import { NextResponse } from "next/server";
import Issue from "@/models/Issue";
import { connectDB } from "@/lib/db";
import { updateIssueSchema } from "@/lib/validators";
import { jsonError, requireAuth } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, { params }: Params) {
  const session = await requireAuth();
  if (!session) return jsonError("Unauthorized", 401);

  const { id } = await params;
  await connectDB();
  const issue = await Issue.findOne({ _id: id, createdBy: session.userId }).lean();
  if (!issue) return jsonError("Issue not found", 404);

  return NextResponse.json(issue);
}

export async function PUT(req: Request, { params }: Params) {
  const session = await requireAuth();
  if (!session) return jsonError("Unauthorized", 401);

  const body = await req.json();
  const parsed = updateIssueSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid update payload", 422);

  const { id } = await params;
  await connectDB();
  const issue = await Issue.findOneAndUpdate(
    { _id: id, createdBy: session.userId },
    parsed.data,
    { new: true },
  ).lean();

  if (!issue) return jsonError("Issue not found", 404);
  return NextResponse.json(issue);
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await requireAuth();
  if (!session) return jsonError("Unauthorized", 401);

  const { id } = await params;
  await connectDB();
  const deleted = await Issue.findOneAndDelete({ _id: id, createdBy: session.userId }).lean();
  if (!deleted) return jsonError("Issue not found", 404);

  return NextResponse.json({ ok: true });
}
