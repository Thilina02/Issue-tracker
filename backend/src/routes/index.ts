import { Router } from "express";
import { healthRouter } from "./health.routes";
import { authRouter } from "./auth.routes";
import { issuesRouter } from "./issues.routes";
import { assetsRouter } from "./assets.routes";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(issuesRouter);
apiRouter.use(assetsRouter);

