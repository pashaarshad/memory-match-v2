import FacePortal from './components/face-portal';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Memory Match</h1>
        <p className="text-lg mb-8">
          Find your photos using our face recognition technology or access the complete gallery.
        </p>
        <div className="space-x-4">
          <Link href="/find-me" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Find My Photos
          </Link>
          <Link href="/access-all" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
            Access All Photos
          </Link>
        </div>
      </div>
      <FacePortal />
    </div>
  );
}
