import { NextResponse } from "next/server";

import { listDatasetImages } from "@/lib/face/dataset";
import { matchFaceFromDataset } from "@/lib/face/match-face";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const selfie = formData.get("selfie");

    if (!selfie || typeof selfie === "string") {
      return NextResponse.json(
        { error: "Please upload a selfie image." },
        { status: 400 },
      );
    }

    const dataset = await listDatasetImages();
    const matches = await matchFaceFromDataset(selfie, dataset);

    return NextResponse.json({
      message: "Matching completed.",
      totalDatasetImages: dataset.length,
      matches,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Server failed to match faces." },
      { status: 500 },
    );
  }
}
