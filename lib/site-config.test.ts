import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SITE_ORIGIN, PUBLIC_PAGES, robotsText, siteConfig, sitemapXml } from './site-config.ts';

void test('showcase has a real canonical origin and indexing is opt-in', () => {
  assert.deepEqual(siteConfig({}), { origin: DEFAULT_SITE_ORIGIN, indexable: false });
  for (const value of ['false', '1', 'TRUE', '']) assert.equal(siteConfig({ SITE_INDEXABLE: value }).indexable, false);
  assert.equal(robotsText(siteConfig({})), 'User-agent: *\nDisallow: /\n');
  assert.doesNotMatch(sitemapXml(siteConfig({})), /<loc>/);
});

void test('launch indexing lists public pages but never rater assignments', () => {
  const config = siteConfig({ SITE_ORIGIN: 'https://example.org', SITE_INDEXABLE: 'true' });
  assert.match(robotsText(config), /Disallow: \/rating\//);
  for (const path of PUBLIC_PAGES) assert.ok(sitemapXml(config).includes(`<loc>https://example.org${path}</loc>`));
  assert.doesNotMatch(sitemapXml(config), /\/rate|\/rating\//);
});

void test('origin configuration rejects unsafe or malformed deployment values', () => {
  for (const origin of ['http://example.org', 'https://user:secret@example.org', 'https://example.org/path', 'https://example.org/?q=1', 'https://example.org/#part', 'not-a-url']) {
    assert.throws(() => siteConfig({ SITE_ORIGIN: origin }));
  }
});
