import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  classifyTransition,
  summarizeExperience,
  summarizeFlips,
} from './metrics.ts';

interface MetricFixtures {
  experience: Array<{
    name: string;
    judgments: Array<{ rating: -2 | -1 | 0 | 1 | 2; weight?: number }>;
    expected_delta: number;
    expected_preference_lift: number;
  }>;
  flips: Array<{
    name: string;
    pairs: Array<{ previous_passed: boolean; new_passed: boolean }>;
    expected_negative_flip_rate: number;
    expected_positive_flip_rate: number;
  }>;
}

const fixtures = JSON.parse(
  readFileSync(new URL('../data/fixtures/metric-cases.json', import.meta.url), 'utf8'),
) as MetricFixtures;

void test('Experience Delta spans the documented range', () => {
  assert.equal(summarizeExperience([{ rating: 2 }]).experienceDelta, 100);
  assert.equal(summarizeExperience([{ rating: -2 }]).experienceDelta, -100);
});

void test('experience summary preserves ties and direction', () => {
  const result = summarizeExperience([
    { rating: -2 },
    { rating: 0 },
    { rating: 2 },
  ]);

  assert.equal(result.experienceDelta, 0);
  assert.equal(result.preferenceLift, 0);
  assert.equal(result.noticeability, 2 / 3);
  assert.equal(result.strongRegressionRate, 1 / 3);
  assert.deepEqual(result.distribution, { '-2': 1, '-1': 0, '0': 1, '1': 0, '2': 1 });
});

void test('experience summary applies preregistered weights', () => {
  const result = summarizeExperience([
    { rating: 2, weight: 1 },
    { rating: -1, weight: 2 },
  ]);

  assert.equal(result.experienceDelta, 0);
  assert.equal(result.preferenceLift, -100 / 3);
  assert.equal(result.totalWeight, 3);
});

void test('invalid judgments fail closed', () => {
  assert.throws(() => summarizeExperience([]), /At least one/);
  assert.throws(
    () => summarizeExperience([{ rating: 1, weight: 0 }]),
    /greater than zero/,
  );
});

void test('flip summary exposes the complete transition matrix', () => {
  const result = summarizeFlips([
    { previousPassed: true, newPassed: true },
    { previousPassed: true, newPassed: false },
    { previousPassed: false, newPassed: true },
    { previousPassed: false, newPassed: false },
  ]);

  assert.deepEqual(result, {
    stableSuccesses: 1,
    negativeFlips: 1,
    positiveFlips: 1,
    stableFailures: 1,
    negativeFlipRate: 0.5,
    positiveFlipRate: 0.5,
  });
});

void test('undefined conditional flip rates remain null', () => {
  assert.equal(
    summarizeFlips([{ previousPassed: false, newPassed: true }]).negativeFlipRate,
    null,
  );
  assert.equal(
    summarizeFlips([{ previousPassed: true, newPassed: true }]).positiveFlipRate,
    null,
  );
});

void test('transition classifications follow the preregistered bounds', () => {
  assert.equal(classifyTransition(6, 16), 'upgrade');
  assert.equal(classifyTransition(-16, -6), 'regression');
  assert.equal(classifyTransition(-4, 4), 'sidegrade');
  assert.equal(classifyTransition(2, 9), 'inconclusive');
});

void test('TypeScript calculations match the shared cross-language fixtures', () => {
  for (const fixture of fixtures.experience) {
    const summary = summarizeExperience(fixture.judgments);
    assert.equal(summary.experienceDelta, fixture.expected_delta, fixture.name);
    assert.equal(
      summary.preferenceLift,
      fixture.expected_preference_lift,
      fixture.name,
    );
  }
  for (const fixture of fixtures.flips) {
    const summary = summarizeFlips(
      fixture.pairs.map((pair) => ({
        previousPassed: pair.previous_passed,
        newPassed: pair.new_passed,
      })),
    );
    assert.equal(
      summary.negativeFlipRate,
      fixture.expected_negative_flip_rate,
      fixture.name,
    );
    assert.equal(
      summary.positiveFlipRate,
      fixture.expected_positive_flip_rate,
      fixture.name,
    );
  }
});
