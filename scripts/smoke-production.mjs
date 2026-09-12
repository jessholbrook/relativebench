import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as pause } from 'node:timers/promises';

// Test the actual Worker build, not only the development server. The child owns
// its process group so cleanup cannot stop an unrelated preview or user process.
const origin = 'http://localhost:3101';
const server = spawn('npm', ['run', 'start', '--', '--port', '3101'], {
  detached: process.platform !== 'win32',
  env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
let spawnError;
server.on('error', error => { spawnError = error; });
for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => { logs = (logs + chunk).slice(-12000); });

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (spawnError) throw spawnError;
    if (server.exitCode !== null) throw new Error('Production server exited before readiness.');
    // Do not silently test a different service that already occupies this port.
    if (logs.includes('Ready on http://localhost:3101')) { ready = true; break; }
    await pause(500);
  }
  assert.ok(ready, 'Production server did not become ready on its assigned port.');
  for (const path of ['/', '/guide', '/methodology', '/demo', '/rate', '/privacy', '/robots.txt', '/sitemap.xml', '/not-a-real-page']) {
    const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, path === '/not-a-real-page' ? 404 : 200, path);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff', `${path}: MIME protection`);
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin', `${path}: referrer policy`);
    assert.equal(response.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()', `${path}: device permissions`);
    const body = await response.text();
    if (path === '/robots.txt') assert.equal(body, 'User-agent: *\nDisallow: /\n');
    if (path === '/sitemap.xml') { assert.match(body, /<urlset/); assert.doesNotMatch(body, /<loc>/); }
    console.log(`${response.status} ${path}`);
  }
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  if (server.pid) {
    try {
      if (process.platform === 'win32') server.kill('SIGTERM');
      else process.kill(-server.pid, 'SIGTERM');
    } catch (error) {
      if (error.code !== 'ESRCH') { console.error('Production server cleanup failed:', error); process.exitCode = 1; }
    }
  }
}
