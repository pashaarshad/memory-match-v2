import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function GET() {
  const datasetPath = path.join(process.cwd(), 'public', 'dataset');
  try {
    const files = await fs.readdir(datasetPath);
    const images = files.filter((file) =>
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error reading dataset directory:', error);
    return NextResponse.json(
      { message: 'Error reading images' },
      { status: 500 }
    );
  }
}
