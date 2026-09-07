import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const snapshot = JSON.parse(readFileSync(new URL('../data/snapshots/example-transition.json', import.meta.url), 'utf8'));
const details = JSON.parse(readFileSync(new URL('../data/snapshots/example-benchmark-details.json', import.meta.url), 'utf8'));

test('every benchmark has an explicitly illustrative interval enclosing its delta', () => {
  assert.equal(details.status, 'illustrative');
  assert.equal(details.interval_level, 0.95);
  assert.equal(Object.keys(details.benchmarks).length, snapshot.benchmark_deltas.length);
  for (const metric of snapshot.benchmark_deltas) {
    const interval = details.benchmarks[metric.label];
    assert.ok(interval, metric.label);
    assert.ok(Number.isFinite(interval.lower) && Number.isFinite(interval.upper));
    assert.ok(interval.lower <= metric.value && metric.value <= interval.upper);
  }
});

test('each benchmark has identifiable task-level before and after evidence', () => {
  const ids = new Set();
  for (const metric of snapshot.benchmark_deltas) {
    const tasks = details.benchmarks[metric.label].tasks;
    assert.ok(tasks.length > 0);
    for (const task of tasks) {
      assert.ok(!ids.has(task.id));
      ids.add(task.id);
      assert.ok(task.title.length > 0);
      for (const result of [task.before, task.after]) {
        assert.equal(typeof result.pass, 'boolean');
        assert.ok(result.detail.length > 0);
      }
    }
  }
});

test('examples demonstrate uncertainty crossing zero and mixed task directions', () => {
  const interval = details.benchmarks['Instruction following'];
  assert.ok(interval.lower < 0 && interval.upper > 0);
  const tasks = details.benchmarks.Reasoning.tasks;
  assert.ok(tasks.some((task: { before: { pass: boolean }; after: { pass: boolean } }) => !task.before.pass && task.after.pass));
  assert.ok(tasks.some((task: { before: { pass: boolean }; after: { pass: boolean } }) => task.before.pass && !task.after.pass));
});
