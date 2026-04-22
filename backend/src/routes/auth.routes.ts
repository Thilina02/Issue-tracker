import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { auth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/auth/register", asyncHandler(AuthController.register));
authRouter.post("/auth/login", asyncHandler(AuthController.login));
authRouter.post("/auth/logout", asyncHandler(AuthController.logout));
authRouter.get("/auth/me", auth, asyncHandler(AuthController.me));

