'use client';

import { useState, useRef, useEffect } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { FaDownload } from 'react-icons/fa';

const MODEL_URL = '/models';

export default function FindMePage() {
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [matchingImages, setMatchingImages] = useState([]);
  const [message, setMessage] = useState('Load the face models and upload a selfie.');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      const faceapi = window.faceapi;
      if (faceapi && !modelsLoaded) {
        setLoading(true);
        setMessage('Loading face models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        setLoading(false);
        setMessage('Models loaded. Upload a selfie.');
      }
    };
    loadModels();
  }, [modelsLoaded]);

  const handleFileChange = async (event) => {
    if (!modelsLoaded) {
      setMessage('Please load the models first.');
      return;
    }

    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setLoading(true);
    setMessage('Detecting face...');

    const faceapi = window.faceapi;
    const image = await faceapi.bufferToImage(file);
    const detection = await faceapi
      .detectSingleFace(image)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setMessage('No face detected in the uploaded image.');
      setLoading(false);
      return;
    }

    setMessage('Matching face...');
    const res = await fetch('/api/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ descriptor: detection.descriptor }),
    });

    const data = await res.json();
    setMatchingImages(data.matches);
    setMessage(data.matches.length > 0 ? 'Matching photos found.' : 'No matching photos found.');
    setLoading(false);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const imagePromises = matchingImages.map(async (imageName) => {
      const response = await fetch(`/dataset/${imageName}`);
      const blob = await response.blob();
      zip.file(imageName, blob);
    });
    await Promise.all(imagePromises);
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'matching_images.zip');
    });
  };

  const handleDownloadSingle = (imageName) => {
    saveAs(`/dataset/${imageName}`, imageName);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Private Photo Finder</h1>
      <p className="mb-4">
        Upload one selfie and show only matching group photos. If face search is unavailable, use password mode.
      </p>
      <div className="mb-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={loading || !modelsLoaded}
        >
          Upload Selfie
        </button>
        <span className="ml-4">{message}</span>
      </div>

      {matchingImages.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Results</h2>
            <button
              onClick={handleDownloadAll}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <FaDownload className="mr-2" /> Download All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {matchingImages.map((image) => (
              <div key={image} className="relative border rounded-lg overflow-hidden">
                <img src={`/dataset/${image}`} alt={image} className="w-full h-auto" />
                <button
                  onClick={() => handleDownloadSingle(image)}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                >
                  <FaDownload />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
