import type { Types } from "mongoose";
import Issue from "../models/Issue";
import { connectDB } from "../db/connect";

const emptyCounts = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };

export class IssuesService {
  static async list(opts: {
    createdBy: Types.ObjectId;
    q: string;
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    page: number;
    limit: number;
  }) {
    await connectDB();

    const query: Record<string, unknown> = { createdBy: opts.createdBy };
    if (opts.q) {
      query.$or = [
        { title: { $regex: opts.q, $options: "i" } },
        { description: { $regex: opts.q, $options: "i" } },
      ];
    }
    if (opts.status) query.status = opts.status;
    if (opts.priority) query.priority = opts.priority;

    const [issues, total, statusCountsRaw] = await Promise.all([
      Issue.find(query).sort({ createdAt: -1 }).skip((opts.page - 1) * opts.limit).limit(opts.limit).lean(),
      Issue.countDocuments(query),
      Issue.aggregate([{ $match: { createdBy: opts.createdBy } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const statusCounts = { ...emptyCounts };
    for (const row of statusCountsRaw) {
      if (row?._id && row._id in statusCounts) {
        statusCounts[row._id as keyof typeof statusCounts] = row.count;
      }
    }

    return {
      issues,
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / opts.limit)),
      statusCounts,
    };
  }

  static async create(opts: {
    createdBy: string;
    input: { title: string; description: string; priority?: string; severity?: string };
  }) {
    await connectDB();
    return Issue.create({ ...opts.input, createdBy: opts.createdBy });
  }

  static async detail(opts: { id: string; createdBy: string }) {
    await connectDB();
    return Issue.findOne({ _id: opts.id, createdBy: opts.createdBy }).lean();
  }

  static async update(opts: { id: string; createdBy: string; patch: Record<string, unknown> }) {
    await connectDB();
    return Issue.findOneAndUpdate({ _id: opts.id, createdBy: opts.createdBy }, opts.patch, { new: true }).lean();
  }

  static async remove(opts: { id: string; createdBy: string }) {
    await connectDB();
    const deleted = await Issue.findOneAndDelete({ _id: opts.id, createdBy: opts.createdBy }).lean();
    return Boolean(deleted);
  }

  static async allForUser(opts: { createdBy: string }) {
    await connectDB();
    return Issue.find({ createdBy: opts.createdBy }).sort({ createdAt: -1 }).lean();
  }
}

