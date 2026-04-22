import { Router } from "express";
import { auth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { IssuesController } from "../controllers/issues.controller";

export const issuesRouter = Router();

issuesRouter.get("/issues", auth, asyncHandler(IssuesController.list));
issuesRouter.post("/issues", auth, asyncHandler(IssuesController.create));
issuesRouter.get("/issues/export", auth, asyncHandler(IssuesController.export));
issuesRouter.get("/issues/:id", auth, asyncHandler(IssuesController.detail));
issuesRouter.put("/issues/:id", auth, asyncHandler(IssuesController.update));
issuesRouter.delete("/issues/:id", auth, asyncHandler(IssuesController.remove));

