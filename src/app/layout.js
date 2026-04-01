import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Memory Match",
  description: "Find your photos by face search or secure password access.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className="siteHeader">
          <div className="container navWrap">
            <Link href="/" className="brand">
              Memory Match
            </Link>
            <nav className="siteNav" aria-label="Main navigation">
              <Link href="/find-me">Face Search</Link>
              <Link href="/access-all">Password Access</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="siteFooter">
          <div className="container">
            <p>Private photo retrieval with face or password based access.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
