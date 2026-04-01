import { readdir } from "node:fs/promises";
import path from "node:path";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export async function listDatasetImages() {
  const datasetPath = path.join(process.cwd(), "public", "dataset");
  const allFiles = await readdir(datasetPath);

  return allFiles
    .filter((name) => ALLOWED_EXT.has(path.extname(name).toLowerCase()))
    .map((name) => ({
      fileName: name,
      absolutePath: path.join(datasetPath, name),
      publicPath: `/dataset/${name}`,
    }));
}
