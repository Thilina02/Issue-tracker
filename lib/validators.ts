import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120),
});

export const createIssueSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(5).max(5000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  severity: z.enum(["MINOR", "MAJOR", "BLOCKER"]).optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(5).max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  severity: z.enum(["MINOR", "MAJOR", "BLOCKER"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
});
