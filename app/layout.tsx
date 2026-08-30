import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_ORIGIN ?? 'http://localhost:3000'),
  title: 'RelativeBench — Measure the model transition',
  description:
    'Compare a new model with the one it replaces through standard benchmark deltas and blinded, paired judgments.',
  openGraph: {
    title: 'RelativeBench — Measure the model transition',
    description:
      'Measure benchmark movement, compatibility, and the difference people feel when a model changes.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'RelativeBench model transition visualization' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RelativeBench — Measure the model transition',
    description:
      'Measure benchmark movement, compatibility, and the difference people feel when a model changes.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
