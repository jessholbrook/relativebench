import assert from 'node:assert/strict';
import test from 'node:test';
import { ignoreRatingShortcut, isRestorableSession } from './rating-session-guards.ts';

const expected = { packetId: 'packet', reviewerCodeSha256: 'hash', formId: 'form-a', assignments: [{ assignment_id: 'one', pair_id: 'pair' }] };
const initial = { ...expected, startedAt: '2026-09-09T12:00:00Z', currentIndex: 0, stage: 'left', assignmentStartedAt: 100,
  pointwiseLeft: null, pointwiseRight: null, sidePreference: null, reasonTags: [], judgments: [] };

void test('restores initial, partial, reopened, and complete local sessions', () => {
  assert.equal(isRestorableSession(initial, expected), true);
  assert.equal(isRestorableSession({ ...initial, stage: 'right', pointwiseLeft: 'meets' }, expected), true);
  assert.equal(isRestorableSession({ ...initial, stage: 'pair', pointwiseLeft: 'meets', pointwiseRight: 'fails', sidePreference: -1 }, expected), true);
  const judgment = { assignment_id: 'one', pair_id: 'pair', scenario_id: 's', category: 'c', pointwise_left: 'meets', pointwise_right: 'fails', side_preference: -1, reason_tags: [], duration_ms: 1000 };
  assert.equal(isRestorableSession({ ...initial, currentIndex: 1, judgments: [judgment] }, expected), true);
  assert.equal(isRestorableSession({ ...initial, currentIndex: 1, judgments: [{ ...judgment, assignment_id: 'wrong' }] }, expected), false);
});

void test('malformed or mismatched storage is rejected rather than silently restarted', () => {
  for (const value of [null, [], {}, { ...initial, formId: 'form-b' }, { ...initial, packetId: 'old' },
    { ...initial, reviewerCodeSha256: 'other' }, { ...initial, currentIndex: 999 },
    { ...initial, currentIndex: -1 }, { ...initial, stage: 'pair' }, { ...initial, judgments: 'bad' },
    { ...initial, reasonTags: [42] }, { ...initial, pointwiseLeft: 'unknown' },
    { ...initial, startedAt: 'never' }, { ...initial, assignmentStartedAt: Infinity }]) {
    assert.equal(isRestorableSession(value, expected), false);
  }
});

void test('held, browser-modified, and IME keystrokes cannot record judgments', () => {
  const event = { repeat: false, ctrlKey: false, metaKey: false, altKey: false, isComposing: false };
  assert.equal(ignoreRatingShortcut(event), false);
  for (const key of Object.keys(event)) assert.equal(ignoreRatingShortcut({ ...event, [key]: true }), true);
});
