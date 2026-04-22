import type { Request, Response } from "express";
import path from "path";
import { promises as fs } from "fs";
import { HttpError } from "../middleware/error";

export class AssetsController {
  static async model(_req: Request, res: Response) {
    // Source asset lives in the frontend app folder.
    const modelPath = path.join(
      process.cwd(),
      "..",
      "frontend",
      "app",
      "Meshy_AI_The_image_provided_il_0420193924_texture.glb",
    );
    try {
      const data = await fs.readFile(modelPath);
      res.setHeader("Content-Type", "model/gltf-binary");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(data);
    } catch {
      throw new HttpError("Model file not found", 404);
    }
  }
}

