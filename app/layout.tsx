import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
<script src="https://cdnjs.cloudflare.com/ajax/libs/face-api.js/0.22.2/face-api.min.js" integrity="sha512-Q2A7/2z5LwrnB7Q305U5L+rT2sR983vD2j4wM/Emm2L433+F0vI3u3r2I0002vSAc2d011yQ2z2/tQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>

export const metadata: Metadata = {
  title: 'Face Memory Vault',
  description: 'Face search and password protected personal photo vault',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <nav className="bg-gray-800 p-4">
          <div className="container mx-auto flex justify-between">
            <Link href="/" className="text-white font-bold">
              Memory Match
            </Link>
            <div className="space-x-4">
              <Link href="/find-me" className="text-gray-300 hover:text-white">
                Face Search
              </Link>
              <Link href="/access-all" className="text-gray-300 hover:text-white">
                Access All
              </Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
