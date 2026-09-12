import assert from 'node:assert/strict';
import test from 'node:test';
import { recordAssessment, validAssessment } from './rating-history.ts';
import { stimulusDigest } from './rating-packet-identity.ts';
import { isRestorableSession } from './rating-session-guards.ts';

void test('Back retains first-pass scores and records separate corrections', () => {
  let row = recordAssessment(undefined, 'left', 'fails');
  row = recordAssessment(row, 'right', 'meets');
  row = recordAssessment(row, 'left', 'partially_meets');
  row = recordAssessment(row, 'right', 'fails');
  assert.equal(row.left, 'fails');
  assert.equal(row.right, 'meets');
  assert.equal(row.final_left, 'partially_meets');
  assert.equal(row.final_right, 'fails');
  assert.equal(row.revisions.length, 2);
  assert.equal(row.revisions[0].exposure, 'pair_seen');
  assert.equal(validAssessment(row, true), true);
  assert.equal(validAssessment({ ...row, left: 'meets' }, true), false);
});

void test('exact Unicode stimuli, newlines and presentation order are committed', async () => {
  const packet = { pairs: [{ prompt: 'Café — task', rubric: 'one\ntwo', responses: [{ response_id: 'a', text: 'α' }, { response_id: 'b', text: 'β' }] }], forms: [{ assignments: [{ left_response_id: 'a', right_response_id: 'b' }] }] };
  const digest = await stimulusDigest(packet);
  assert.equal(await stimulusDigest({ ...packet, collection_authorized: true }), digest);
  assert.notEqual(await stimulusDigest({ ...packet, pairs: [{ ...packet.pairs[0], rubric: 'one two' }] }), digest);
  assert.notEqual(await stimulusDigest({ ...packet, forms: [{ assignments: [{ left_response_id: 'b', right_response_id: 'a' }] }] }), digest);
});

void test('saved sessions cannot restore into changed stimuli or presentation', () => {
  const expected = { packetId: 'p', stimulusSha256: 'digest', reviewerCodeSha256: 'r', formId: 'form-a', assignments: [{ assignment_id: 'a', pair_id: 'pair', left_response_id: 'l', right_response_id: 'r' }] };
  let history = recordAssessment(undefined, 'left', 'fails');
  history = recordAssessment(history, 'right', 'meets');
  const judgment = { assignment_id: 'a', pair_id: 'pair', left_response_id: 'l', right_response_id: 'r', scenario_id: 's', category: 'c', pointwise_left: 'fails', pointwise_right: 'meets', side_preference: 1, reason_tags: [], duration_ms: 100, assessment_history: history };
  const session = { ...expected, startedAt: '2026-09-11T12:00:00Z', assignmentStartedAt: 100, currentIndex: 1, stage: 'left', pointwiseLeft: null, pointwiseRight: null, sidePreference: null, reasonTags: [], assessmentHistory: { a: history }, judgments: [judgment] };
  assert.equal(isRestorableSession(session, expected), true);
  assert.equal(isRestorableSession(session, { ...expected, stimulusSha256: 'changed' }), false);
  assert.equal(isRestorableSession({ ...session, judgments: [{ ...judgment, left_response_id: 'r', right_response_id: 'l' }] }, expected), false);
  assert.equal(isRestorableSession({ ...session, assessmentHistory: {} }, expected), false);
});
