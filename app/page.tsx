"use client";

import NextImage from "next/image";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

type PhotoResponse = {
  photos: string[];
};

declare global {
  interface Window {
    faceapi?: {
      env: {
        monkeyPatch: (arg: {
          Canvas: typeof HTMLCanvasElement;
          Image: typeof HTMLImageElement;
          ImageData: typeof ImageData;
          Video: typeof HTMLVideoElement;
          createCanvasElement: () => HTMLCanvasElement;
          createImageElement: () => HTMLImageElement;
        }) => void;
      };
      nets: {
        tinyFaceDetector: { loadFromUri: (path: string) => Promise<void> };
        faceLandmark68Net: { loadFromUri: (path: string) => Promise<void> };
        faceRecognitionNet: { loadFromUri: (path: string) => Promise<void> };
      };
      TinyFaceDetectorOptions: new (arg?: { inputSize?: number }) => unknown;
      detectAllFaces: (
        input: HTMLImageElement,
        options: unknown,
      ) => {
        withFaceLandmarks: () => {
          withFaceDescriptors: () => Promise<Array<{ descriptor: Float32Array }>>;
        };
      };
      euclideanDistance: (a: Float32Array, b: Float32Array) => number;
    };
    tf?: unknown;
  }
}

const MATCH_THRESHOLD = 0.55;
const FULL_ACCESS_PASSWORDS = ["Arshad_team", "arshad_team"];

function addScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src=\"${src}\"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function fetchDataset() {
  const response = await fetch("/api/photos");
  if (!response.ok) {
    throw new Error("Could not load dataset photo list.");
  }
  return (await response.json()) as PhotoResponse;
}

function dist(a: Float32Array, b: Float32Array) {
  const faceapi = window.faceapi;
  if (faceapi?.euclideanDistance) {
    return faceapi.euclideanDistance(a, b);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export default function Home() {
  const [photoList, setPhotoList] = useState<string[]>([]);
  const [matchingPhotos, setMatchingPhotos] = useState<string[]>([]);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isModelsReady, setIsModelsReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>(
    "Upload one selfie/photo to start face search.",
  );

  useEffect(() => {
    async function bootstrap() {
      try {
        setMessage("Loading face engine and dataset...");
        await addScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
        await addScript(
          "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.js",
        );

        if (!window.faceapi) {
          throw new Error("Face API did not initialize.");
        }

        window.faceapi.env.monkeyPatch({
          Canvas: HTMLCanvasElement,
          Image: HTMLImageElement,
          ImageData,
          Video: HTMLVideoElement,
          createCanvasElement: () => document.createElement("canvas"),
          createImageElement: () => document.createElement("img"),
        });

        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          window.faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          window.faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);

        const dataset = await fetchDataset();
        setPhotoList(dataset.photos);
        setIsModelsReady(true);
        setMessage(
          "Face engine ready. Upload a selfie and we will show matching photos only.",
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown loading error.";
        setMessage(
          `Setup failed: ${msg}. Add face model files to /public/models and retry.`,
        );
      }
    }

    bootstrap();
  }, []);

  const canSearch = useMemo(() => isModelsReady && photoList.length > 0 && !busy, [
    busy,
    isModelsReady,
    photoList.length,
  ]);

  async function getDescriptors(imagePath: string | ArrayBuffer | null) {
    if (!window.faceapi) {
      return [] as Array<{ descriptor: Float32Array }>;
    }

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not open image for processing."));
      if (typeof imagePath === "string") {
        img.src = imagePath;
      } else if (imagePath instanceof ArrayBuffer) {
        const blob = new Blob([imagePath]);
        img.src = URL.createObjectURL(blob);
      } else {
        reject(new Error("Image data is empty."));
      }
    });

    return window.faceapi
      .detectAllFaces(image, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
      .withFaceLandmarks()
      .withFaceDescriptors();
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !canSearch) {
      return;
    }

    setBusy(true);
    setMatchingPhotos([]);
    setSelectedPhoto(null);

    try {
      const inputBuffer = await file.arrayBuffer();
      const inputDescriptors = await getDescriptors(inputBuffer);

      if (inputDescriptors.length === 0) {
        setMessage("No face detected in uploaded image. Try a clearer selfie.");
        return;
      }

      const matches = new Set<string>();

      for (const datasetPhoto of photoList) {
        const datasetFaces = await getDescriptors(datasetPhoto);

        for (const dFace of datasetFaces) {
          const matched = inputDescriptors.some((uFace) => {
            const distance = dist(uFace.descriptor, dFace.descriptor);
            return distance <= MATCH_THRESHOLD;
          });

          if (matched) {
            matches.add(datasetPhoto);
            break;
          }
        }
      }

      const sortedMatches = Array.from(matches);
      setMatchingPhotos(sortedMatches);
      setMessage(
        sortedMatches.length > 0
          ? `Found ${sortedMatches.length} matching photo(s).`
          : "No matches found.",
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown search error.";
      setMessage(`Face search failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  async function openWithPassword() {
    if (!FULL_ACCESS_PASSWORDS.includes(password.trim())) {
      setMessage("Wrong password.");
      setAllPhotos([]);
      return;
    }

    setAllPhotos(photoList);
    setMessage("Full access granted. All photos are now visible.");
  }

  return (
    <div className="site-shell">
      <header className="top-nav">
        <div className="brand">Arshad Team Gallery</div>
        <nav>
          <a href="#home">Home</a>
          <a href="#face-search">Open Face Search</a>
          <a href="#password">Password Access</a>
        </nav>
      </header>

      <main id="home" className="container">
        <section className="hero">
          <h1>Secure Face Photo Finder</h1>
          <p>
            Upload one selfie to find matching group photos. If face search is not needed,
            use password access to open the full gallery.
          </p>
        </section>

        <section id="face-search" className="card">
          <h2>Open Face Search</h2>
          <p className="hint">
            Dataset folder: <code>public/dataset</code> (put your photos there). Model folder:
            <code> public/models</code>.
          </p>
          <input type="file" accept="image/*" onChange={handleUpload} disabled={!canSearch} />
          <p className="status">{busy ? "Scanning images..." : message}</p>

          <div className="grid">
            {matchingPhotos.map((photo) => (
              <button
                className="photo-btn"
                key={photo}
                onClick={() => setSelectedPhoto(photo)}
              >
                <NextImage src={photo} alt="Match" width={400} height={300} />
              </button>
            ))}
          </div>
        </section>

        <section id="password" className="card">
          <h2>Password Access</h2>
          <p className="hint">Password: Arshad_team or arshad_team</p>
          <div className="row">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter password"
            />
            <button onClick={openWithPassword}>Open All Photos</button>
          </div>

          <div className="grid">
            {allPhotos.map((photo) => (
              <button
                className="photo-btn"
                key={photo}
                onClick={() => setSelectedPhoto(photo)}
              >
                <NextImage src={photo} alt="Gallery" width={400} height={300} />
              </button>
            ))}
          </div>
        </section>
      </main>

      {selectedPhoto ? (
        <div className="modal" onClick={() => setSelectedPhoto(null)}>
          <NextImage src={selectedPhoto} alt="Selected" className="modal-image" width={1200} height={900} />
        </div>
      ) : null}
    </div>
  );
}
