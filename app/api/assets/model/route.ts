import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const modelPath = path.join(
      process.cwd(),
      "app",
      "Meshy_AI_The_image_provided_il_0420193924_texture.glb",
    );
    const data = await fs.readFile(modelPath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Model file not found" }, { status: 404 });
  }
}
