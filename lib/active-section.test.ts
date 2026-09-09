import assert from 'node:assert/strict';
import test from 'node:test';
import { activeSection } from './active-section.ts';

const sections = ['what', 'why', 'how', 'example', 'rate'].map((id, index) => ({ id, top: index * 600 }));
const at = (scrollY: number, height = 800, documentHeight = 3000) => activeSection(
  sections.map((section) => ({ ...section, top: section.top - scrollY })),
  height, scrollY, documentHeight,
);

void test('tracks each section in both scroll directions, including a deep-link position', () => {
  for (const [scrollY, id] of [[0, 'what'], [600, 'why'], [1200, 'how'], [1800, 'example'], [2400, 'rate'], [1200, 'how'], [0, 'what']] as const) {
    assert.equal(at(scrollY), id);
  }
});

void test('switches at the reading line, not when the next section first enters the screen', () => {
  assert.equal(at(439), 'what');
  assert.equal(at(440), 'why');
  assert.equal(at(499, 400), 'what');
  assert.equal(at(500, 400), 'why');
});

void test('selects a short final section at the bottom and recovers when scrolling back', () => {
  assert.equal(at(2200), 'rate');
  assert.equal(at(2100), 'example');
});

void test('handles an empty or non-scrollable page', () => {
  assert.equal(activeSection([], 800, 0, 800), undefined);
  assert.equal(at(0, 4000, 3000), 'what');
});
