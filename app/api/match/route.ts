import { NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as faceapi from 'face-api.js';
import { canvas } from 'canvas';

// Make face-api.js use canvas
faceapi.env.monkeyPatch({ Canvas: canvas.Canvas, Image: canvas.Image, ImageData: canvas.ImageData });

const modelsPath = path.join(process.cwd(), 'public', 'models');
const datasetPath = path.join(process.cwd(), 'public', 'dataset');

let labeledFaceDescriptors;

async function loadModelsAndDescriptors() {
  if (labeledFaceDescriptors) {
    return;
  }

  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath),
  ]);

  const dataset = await fs.readFile(path.join(datasetPath, 'index.json'), 'utf-8');
  const { labeledImages } = JSON.parse(dataset);

  labeledFaceDescriptors = await Promise.all(
    labeledImages.map(async ({ label, images }) => {
      const descriptions = [];
      for (const imageName of images) {
        const imgPath = path.join(datasetPath, imageName);
        try {
          const img = await canvas.loadImage(imgPath);
          const detections = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
          if (detections) {
            descriptions.push(detections.descriptor);
          }
        } catch (error) {
          console.error(`Error processing image ${imageName}:`, error);
        }
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

export async function POST(req) {
  await loadModelsAndDescriptors();

  const { descriptor } = await req.json();
  if (!descriptor) {
    return NextResponse.json({ message: 'Descriptor not provided' }, { status: 400 });
  }

  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
  const bestMatch = faceMatcher.findBestMatch(descriptor);

  if (bestMatch.label === 'unknown') {
    return NextResponse.json({ matches: [] });
  }

  const dataset = await fs.readFile(path.join(datasetPath, 'index.json'), 'utf-8');
  const { labeledImages } = JSON.parse(dataset);
  const matchedLabel = labeledImages.find(item => item.label === bestMatch.label);

  return NextResponse.json({ matches: matchedLabel ? matchedLabel.images : [] });
}
