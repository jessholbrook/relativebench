import { sitemapXml } from '@/lib/site-config';

export function GET() {
  return new Response(sitemapXml(), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' } });
}
