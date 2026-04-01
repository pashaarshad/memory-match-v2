import { NextResponse } from "next/server";

import { listDatasetImages } from "@/lib/face/dataset";

const DEFAULT_PASSWORD = "1234";

export async function POST(request) {
  try {
    const { password } = await request.json();
    const expected = process.env.GALLERY_ACCESS_PASSWORD || DEFAULT_PASSWORD;

    if (password !== expected) {
      return NextResponse.json(
        { error: "Invalid password. Please try again." },
        { status: 401 },
      );
    }

    const photos = await listDatasetImages();

    return NextResponse.json({
      message: "Access granted.",
      count: photos.length,
      photos: photos.map((item) => ({
        fileName: item.fileName,
        path: item.publicPath,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to open gallery." },
      { status: 500 },
    );
  }
}
