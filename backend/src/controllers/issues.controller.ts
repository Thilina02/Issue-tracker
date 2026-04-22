import type { Request, Response } from "express";
import { Types } from "mongoose";
import { createIssueSchema, updateIssueSchema } from "../validators";
import { HttpError } from "../middleware/error";
import type { AuthedRequest } from "../middleware/auth";
import { IssuesService } from "../services/issues.service";

const STATUS_VALUES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

function escapeCsv(value: unknown) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function getParamString(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

export class IssuesController {
  static async list(req: Request, res: Response) {
    const { user } = req as AuthedRequest;
    const q = String(req.query.q ?? "").trim();
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const priority = typeof req.query.priority === "string" ? req.query.priority : undefined;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(25, Math.max(1, Number(req.query.limit ?? 8)));

    const createdBy = new Types.ObjectId(user.userId);
    const data = await IssuesService.list({
      createdBy,
      q,
      status: status && STATUS_VALUES.includes(status as any) ? (status as any) : undefined,
      priority: priority && PRIORITY_VALUES.includes(priority as any) ? (priority as any) : undefined,
      page,
      limit,
    });

    res.json(data);
  }

  static async create(req: Request, res: Response) {
    const { user } = req as AuthedRequest;
    const parsed = createIssueSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError("Invalid issue payload", 422);

    const issue = await IssuesService.create({ createdBy: user.userId, input: parsed.data });
    res.status(201).json(issue);
  }

  static async detail(req: Request, res: Response) {
    const { user } = req as AuthedRequest;
    const id = getParamString(req.params.id);
    const issue = await IssuesService.detail({ id, createdBy: user.userId });
    if (!issue) throw new HttpError("Issue not found", 404);
    res.json(issue);
  }

  static async update(req: Request, res: Response) {
    const { user } = req as AuthedRequest;
    const parsed = updateIssueSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError("Invalid update payload", 422);

    const id = getParamString(req.params.id);
    const issue = await IssuesService.update({ id, createdBy: user.userId, patch: parsed.data });
    if (!issue) throw new HttpError("Issue not found", 404);
    res.json(issue);
  }

  static async remove(req: Request, res: Response) {
    const { user } = req as AuthedRequest;
    const id = getParamString(req.params.id);
    const ok = await IssuesService.remove({ id, createdBy: user.userId });
    if (!ok) throw new HttpError("Issue not found", 404);
    res.json({ ok: true });
  }

  static async export(req: Request, res: Response) {
    const { user } = req as AuthedRequest;
    const format = String(req.query.format ?? "json").toLowerCase();
    if (format !== "json" && format !== "csv") throw new HttpError("Unsupported export format", 400);

    const issues = await IssuesService.allForUser({ createdBy: user.userId });

    if (format === "json") {
      res.setHeader("Content-Disposition", 'attachment; filename="issues.json"');
      return res.json({ issues });
    }

    const header = ["_id", "title", "description", "status", "priority", "severity", "createdAt", "updatedAt"];
    const lines = [
      header.join(","),
      ...issues.map((i) =>
        [i._id, i.title, i.description, i.status, i.priority, i.severity, i.createdAt, i.updatedAt]
          .map(escapeCsv)
          .join(","),
      ),
    ];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="issues.csv"');
    res.send(lines.join("\n"));
  }
}

