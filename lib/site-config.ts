export const DEFAULT_SITE_ORIGIN = 'https://relativebench.jessh.chatgpt.site';
export const PUBLIC_PAGES = ['/', '/guide', '/methodology', '/demo', '/privacy'] as const;

// Only an explicit operator setting enables indexing. This is not access control.
export function siteConfig(env: Record<string, string | undefined> = process.env) {
  const url = new URL(env.SITE_ORIGIN || DEFAULT_SITE_ORIGIN);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_ORIGIN must be an HTTPS origin without credentials, a path, query, or fragment.');
  }
  return { origin: url.origin, indexable: env.SITE_INDEXABLE === 'true' };
}

export function robotsText(config = siteConfig()) {
  if (!config.indexable) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\nDisallow: /rate\nDisallow: /rating/\nSitemap: ${config.origin}/sitemap.xml\n`;
}

export function sitemapXml(config = siteConfig()) {
  const entries = config.indexable ? PUBLIC_PAGES.map(path => `<url><loc>${config.origin}${path}</loc></url>`).join('') : '';
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}
