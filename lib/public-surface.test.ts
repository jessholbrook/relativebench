import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

// Fail closed if public assets change. Any new file requires a deliberate review.
void test('showcase assets contain only the reviewed example packet, never primary assignments', async () => {
  const files = await readdir(new URL('../public/', import.meta.url), { recursive: true });
  assert.deepEqual(files.sort(), ['favicon.svg', 'og.png', 'rater-preview.gif', 'rating', 'rating/internal-rating-packet.json'].sort());
  const packet = JSON.parse(await readFile(new URL('../public/rating/internal-rating-packet.json', import.meta.url), 'utf8'));
  assert.equal(packet.session_type, 'internal_interface_pilot');
  assert.notEqual(packet.collection_authorized, true);
  assert.equal(packet.assigned_reviewer_sha256, undefined);
  assert.equal(packet.form_selector, 'sha256-reviewer-code-first-byte-parity-v1');
  const page = await readFile(new URL('../app/rate/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /packetUrl="\/rating\/internal-rating-packet\.json"/);
});
