import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { summarizeExperience, type ExperienceRating } from './metrics.ts';

const snapshot = JSON.parse(readFileSync(new URL('../data/snapshots/example-transition.json', import.meta.url), 'utf8'));

void test('example five-bin percentages reproduce the headline and collapsed bins', () => {
  const bins = snapshot.experience.rating_distribution_percent as Record<string, number>;
  assert.deepEqual(Object.keys(bins).sort(), ['-1', '-2', '0', '1', '2']);
  assert.equal(Object.values(bins).reduce((sum, value) => sum + value, 0), 100);
  const summary = summarizeExperience(Object.entries(bins).filter(([, weight]) => weight > 0).map(([rating, weight]) => ({ rating: Number(rating) as ExperienceRating, weight })));
  assert.ok(Math.abs(summary.experienceDelta - snapshot.experience.delta) < 1e-12);
  assert.equal(bins['-2'] + bins['-1'], snapshot.experience.distribution_percent.worse);
  assert.equal(bins['0'], snapshot.experience.distribution_percent.same);
  assert.equal(bins['1'] + bins['2'], snapshot.experience.distribution_percent.better);
  assert.equal(snapshot.status, 'illustrative');
});

void test('example conditional flip rates reconcile with all four count cells', () => {
  const { counts, positive_flip_rate, negative_flip_rate } = snapshot.compatibility;
  for (const count of Object.values(counts) as number[]) assert.ok(Number.isInteger(count) && count >= 0);
  assert.equal(counts.negative_flips / (counts.negative_flips + counts.stable_successes), negative_flip_rate);
  assert.equal(counts.positive_flips / (counts.positive_flips + counts.stable_failures), positive_flip_rate);
});
