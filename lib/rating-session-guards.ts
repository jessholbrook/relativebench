type ExpectedAssignment = { assignment_id: string; pair_id: string };
type ExpectedSession = {
  packetId: string;
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
  if (!Array.isArray(value.judgments) || value.judgments.length !== index) return false;
  return value.judgments.every((row, position) => {
    const assignment = expected.assignments[position];
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
