import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AssetsController } from "../controllers/assets.controller";

export const assetsRouter = Router();

assetsRouter.get("/assets/model", asyncHandler(AssetsController.model));

