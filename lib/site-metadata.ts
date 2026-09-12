import type { Metadata } from 'next';
import { siteConfig } from './site-config';

export function pageMetadata(path: string, title: string, description: string, allowIndex = true): Metadata {
  const { origin, indexable } = siteConfig();
  return {
    metadataBase: new URL(origin),
    title,
    description,
    alternates: { canonical: `${origin}${path}` },
    robots: { index: indexable && allowIndex, follow: true },
    openGraph: { title, description, url: `${origin}${path}`, siteName: 'RelativeBench', type: 'website',
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: 'RelativeBench model transition visualization' }] },
    twitter: { card: 'summary_large_image', title, description, images: [`${origin}/og.png`] },
  };
}
