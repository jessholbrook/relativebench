export function proxy() {
  // Equivalent to NextResponse.next() in Vinext's shim, without requiring a
  // runtime Next.js package in this Vinext-only project or preview tooling.
  const response = new Response(null, { headers: { 'x-middleware-next': '1' } });
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export const config = { matcher: '/:path*' };
