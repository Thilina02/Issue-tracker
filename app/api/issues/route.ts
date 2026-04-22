import { NextResponse } from "next/server";
import { Types } from "mongoose";
import Issue from "@/models/Issue";
import { connectDB } from "@/lib/db";
import { createIssueSchema } from "@/lib/validators";
import { jsonError, requireAuth } from "@/lib/api";

const STATUS_VALUES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export async function GET(req: Request) {
  const session = await requireAuth();
  if (!session) return jsonError("Unauthorized", 401);

  await connectDB();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(25, Math.max(1, Number(searchParams.get("limit") || 8)));

  const createdBy = new Types.ObjectId(session.userId);
  const query: Record<string, unknown> = { createdBy };

  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (status && STATUS_VALUES.includes(status)) query.status = status;
  if (priority && PRIORITY_VALUES.includes(priority)) query.priority = priority;

  const [issues, total, statusCountsRaw] = await Promise.all([
    Issue.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Issue.countDocuments(query),
    Issue.aggregate([
      { $match: { createdBy } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const statusCounts = {
    OPEN: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
  };

  for (const row of statusCountsRaw) {
    if (row?._id && row._id in statusCounts) {
      statusCounts[row._id as keyof typeof statusCounts] = row.count;
    }
  }

  return NextResponse.json({
    issues,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    statusCounts,
  });
}

export async function POST(req: Request) {
  const session = await requireAuth();
  if (!session) return jsonError("Unauthorized", 401);

  const body = await req.json();
  const parsed = createIssueSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid issue payload", 422);

  await connectDB();
  const issue = await Issue.create({
    ...parsed.data,
    createdBy: session.userId,
  });

  return NextResponse.json(issue, { status: 201 });
}
