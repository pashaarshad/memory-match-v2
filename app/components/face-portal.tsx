'use client';

import Image from 'next/image';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

declare global {
  interface Window {
    faceapi?: {
      nets: {
        ssdMobilenetv1: { loadFromUri: (uri: string) => Promise<void> };
        faceLandmark68Net: { loadFromUri: (uri: string) => Promise<void> };
        faceRecognitionNet: { loadFromUri: (uri: string) => Promise<void> };
      };
      fetchImage: (input: string) => Promise<HTMLImageElement>;
      detectAllFaces: (input: HTMLImageElement | HTMLCanvasElement) => {
        withFaceLandmarks: () => {
          withFaceDescriptors: () => Promise<Array<{ descriptor: Float32Array }>>;
        };
      };
      euclideanDistance: (a: Float32Array, b: Float32Array) => number;
    };
  }
}

type DatasetEntry = {
  id: string;
  src: string;
  label: string;
};

const PASSWORDS = new Set(['Arshad_team', 'arshad_team']);

export default function FacePortal() {
  const [activeTab, setActiveTab] = useState<'face' | 'password'>('face');
  const [status, setStatus] = useState('Load the face models and upload a selfie.');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [dataset, setDataset] = useState<DatasetEntry[]>([]);
  const [matched, setMatched] = useState<DatasetEntry[]>([]);
  const [queryPreview, setQueryPreview] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);

  useEffect(() => {
    fetch('/dataset/index.json')
      .then((res) => res.json())
      .then((data: DatasetEntry[]) => setDataset(data))
      .catch(() => setStatus('Could not load /public/dataset/index.json. Add your dataset manifest.'));
  }, []);

  async function loadScripts() {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
      'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js',
    ];

    for (const src of scripts) {
      if (document.querySelector(`script[src="${src}"]`)) continue;
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Script failed: ${src}`));
        document.body.appendChild(script);
      });
    }
  }

  async function loadModels() {
    setIsLoadingModels(true);
    setStatus('Loading JavaScript face engine and local models...');

    try {
      await loadScripts();
      const faceapi = window.faceapi;
      if (!faceapi) throw new Error('face-api.js not loaded');

      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);

      setModelsLoaded(true);
      setStatus('Models loaded. Upload one selfie to search your photos.');
    } catch {
      setStatus('Model loading failed. Put model files in /public/models and check internet for CDN scripts.');
    } finally {
      setIsLoadingModels(false);
    }
  }

  async function getDescriptorsFromImageUrl(url: string): Promise<Float32Array[]> {
    const faceapi = window.faceapi;
    if (!faceapi) return [];

    const img = await faceapi.fetchImage(url);
    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections.map((d) => d.descriptor);
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!modelsLoaded) {
      setStatus('Load models first.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setQueryPreview(localUrl);
    setStatus('Analyzing uploaded photo and searching dataset...');

    const faceapi = window.faceapi;
    if (!faceapi) {
      setStatus('Face engine is unavailable. Reload and try again.');
      return;
    }

    const queryDescriptors = await getDescriptorsFromImageUrl(localUrl);

    if (!queryDescriptors.length) {
      setStatus('No face found in the uploaded image.');
      setMatched([]);
      return;
    }

    const threshold = 0.48;
    const matches: DatasetEntry[] = [];

    for (const item of dataset) {
      const descriptors = await getDescriptorsFromImageUrl(item.src);
      const hasMatch = descriptors.some((descriptor) =>
        queryDescriptors.some((queryDescriptor) => faceapi.euclideanDistance(queryDescriptor, descriptor) < threshold),
      );

      if (hasMatch) matches.push(item);
    }

    setMatched(matches);
    setStatus(matches.length ? `Found ${matches.length} matching photos.` : 'No matching photos found.');
  }

  const visibleImages = useMemo(() => {
    if (activeTab === 'password' && passwordUnlocked) return dataset;
    if (activeTab === 'face') return matched;
    return [];
  }, [activeTab, dataset, matched, passwordUnlocked]);

  return (
    <>
      <nav className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-bold text-slate-900">Face Memory Vault</h1>
          <div className="space-x-2 text-sm">
            <button
              onClick={() => setActiveTab('face')}
              className={`rounded-full px-4 py-2 ${activeTab === 'face' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
            >
              Open Face Search
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`rounded-full px-4 py-2 ${activeTab === 'password' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
            >
              Password Access
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-semibold">Private Photo Finder</h2>
          <p className="mt-2 text-sm text-slate-600">
            Upload one selfie and show only matching group photos. If face search is unavailable, use password mode.
          </p>
        </section>

        {activeTab === 'face' ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={loadModels}
                disabled={isLoadingModels}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isLoadingModels ? 'Loading models...' : 'Load Face Models'}
              </button>
              <label className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">
                Upload Selfie
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              <span className="text-sm text-slate-500">{status}</span>
            </div>
            {queryPreview ? (
              <Image
                src={queryPreview}
                alt="Query"
                width={112}
                height={112}
                unoptimized
                className="mt-4 h-28 w-28 rounded-xl object-cover"
              />
            ) : null}
          </section>
        ) : (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-semibold">Admin Password Access</h3>
            <p className="mt-1 text-sm text-slate-600">Use Arshad_team or arshad_team to unlock all photos.</p>
            <div className="mt-4 flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
              />
              <button
                onClick={() => setPasswordUnlocked(PASSWORDS.has(password.trim()))}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Unlock
              </button>
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-4 text-lg font-semibold">Results</h3>
          {visibleImages.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {visibleImages.map((img) => (
                <figure key={img.id} className="overflow-hidden rounded-xl border border-slate-200">
                  <Image src={img.src} alt={img.label} width={320} height={160} className="h-40 w-full object-cover" />
                  <figcaption className="px-2 py-1 text-xs text-slate-600">{img.label}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No images to show yet.</p>
          )}
        </section>
      </main>
    </>
  );
}
