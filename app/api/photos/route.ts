import { readdir } from "node:fs/promises";
import { NextResponse } from "next/server";
import path from "node:path";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export async function GET() {
  try {
    const datasetDir = path.join(process.cwd(), "public", "dataset");
    const files = await readdir(datasetDir, { withFileTypes: true });

    const photos = files
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => ALLOWED_EXT.has(path.extname(fileName).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `/dataset/${name}`);

    return NextResponse.json({ photos });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}
