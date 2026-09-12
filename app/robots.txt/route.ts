import { robotsText } from '@/lib/site-config';

export function GET() {
  return new Response(robotsText(), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
