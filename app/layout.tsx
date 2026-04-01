import type { Metadata } from 'next';
import './globals.css';

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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
