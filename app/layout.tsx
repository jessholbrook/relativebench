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
  title: 'RelativeBench — How will the next model feel?',
  description:
    'A model transition benchmark measuring capability change, compatibility, and perceived experience.',
  openGraph: {
    title: 'RelativeBench — How will the next model feel?',
    description:
      'Measure capability change, compatibility, and the experience of moving to a new model.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'RelativeBench model transition visualization' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RelativeBench — How will the next model feel?',
    description:
      'Measure capability change, compatibility, and the experience of moving to a new model.',
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
