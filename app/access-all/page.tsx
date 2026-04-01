'use client';

import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { FaDownload } from 'react-icons/fa';

export default function AccessAllPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/access-all')
        .then((res) => res.json())
        .then((data) => setImages(data.images));
    }
  }, [isAuthenticated]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'Arshad') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const imagePromises = images.map(async (imageName) => {
      const response = await fetch(`/dataset/${imageName}`);
      const blob = await response.blob();
      zip.file(imageName, blob);
    });
    await Promise.all(imagePromises);
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'images.zip');
    });
  };

  const handleDownloadSingle = (imageName) => {
    saveAs(`/dataset/${imageName}`, imageName);
  };

  if (isAuthenticated) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">All Photos</h1>
          <button
            onClick={handleDownloadAll}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <FaDownload className="mr-2" /> Download All
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
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
    );
  }

  return (
    <div className="flex justify-center items-center h-full">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">Enter Password</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 mb-4 w-full"
        />
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
          Access
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </form>
    </div>
  );
}
