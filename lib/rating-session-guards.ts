import { validAssessment } from './rating-history.ts';
import { canonicalJson } from './rating-packet-identity.ts';

type ExpectedAssignment = { assignment_id: string; pair_id: string; left_response_id?: string; right_response_id?: string };
type ExpectedSession = {
  packetId: string;
  stimulusSha256?: string;
  reviewerCodeSha256: string;
  formId: string;
  assignments: ExpectedAssignment[];
};

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const score = (value: unknown) => ['fails', 'partially_meets', 'meets'].includes(value as string);
const preference = (value: unknown) => typeof value === 'number' && [-2, -1, 0, 1, 2].includes(value);
const reasons = (value: unknown) => Array.isArray(value) && value.every((item) =>
  ['Correctness', 'Instruction following', 'Clarity', 'Format', 'Safety', 'Length'].includes(item));

/** Restoration guard only; exported judgments still need the offline packet verifier. */
export function isRestorableSession(value: unknown, expected: ExpectedSession): boolean {
  if (!object(value) || value.packetId !== expected.packetId || value.reviewerCodeSha256 !== expected.reviewerCodeSha256 || value.formId !== expected.formId) return false;
  const bound = expected.stimulusSha256 !== undefined;
  if (bound && (value.stimulusSha256 !== expected.stimulusSha256 || !object(value.assessmentHistory))) return false;
  if (bound) {
    const history = value.assessmentHistory as Record<string, unknown>;
    const ids = new Set(expected.assignments.map((row) => row.assignment_id));
    if (!Object.entries(history).every(([id, row]) => ids.has(id) && validAssessment(row))) return false;
  }
  if (typeof value.startedAt !== 'string' || !Number.isFinite(Date.parse(value.startedAt))) return false;
  if (typeof value.assignmentStartedAt !== 'number' || !Number.isFinite(value.assignmentStartedAt) || value.assignmentStartedAt < 0) return false;
  const index = value.currentIndex;
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index > expected.assignments.length) return false;
  if (!['left', 'right', 'pair'].includes(value.stage as string)) return false;
  if (value.pointwiseLeft !== null && !score(value.pointwiseLeft)) return false;
  if (value.pointwiseRight !== null && !score(value.pointwiseRight)) return false;
  if (value.sidePreference !== null && !preference(value.sidePreference)) return false;
  if (!reasons(value.reasonTags)) return false;
  if (value.stage !== 'left' && !score(value.pointwiseLeft)) return false;
  if (value.stage === 'pair' && !score(value.pointwiseRight)) return false;
  if (bound && index < expected.assignments.length) {
    const history = (value.assessmentHistory as Record<string, unknown>)[expected.assignments[index].assignment_id];
    if (value.pointwiseLeft !== null && (!validAssessment(history) || history.final_left !== value.pointwiseLeft)) return false;
    if (value.pointwiseRight !== null && (!validAssessment(history) || history.final_right !== value.pointwiseRight)) return false;
  }
  if (!Array.isArray(value.judgments) || value.judgments.length !== index) return false;
  return value.judgments.every((row, position) => {
    const assignment = expected.assignments[position];
    if (bound) {
      if (!object(row) || row.left_response_id !== assignment.left_response_id || row.right_response_id !== assignment.right_response_id || !validAssessment(row.assessment_history, true)) return false;
      if (row.pointwise_left !== row.assessment_history.left || row.pointwise_right !== row.assessment_history.right) return false;
      if (canonicalJson(row.assessment_history) !== canonicalJson((value.assessmentHistory as Record<string, unknown>)[assignment.assignment_id])) return false;
    }
    return object(row) && row.assignment_id === assignment.assignment_id && row.pair_id === assignment.pair_id
      && typeof row.scenario_id === 'string' && typeof row.category === 'string'
      && score(row.pointwise_left) && score(row.pointwise_right) && preference(row.side_preference)
      && reasons(row.reason_tags) && typeof row.duration_ms === 'number'
      && Number.isFinite(row.duration_ms) && row.duration_ms >= 0;
  });
}

export function ignoreRatingShortcut(event: { repeat: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean; isComposing: boolean }): boolean {
  return event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.isComposing;
}
