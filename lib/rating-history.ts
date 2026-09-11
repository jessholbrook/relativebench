export type Score = 'fails' | 'partially_meets' | 'meets';
export type Assessment = {
  left: Score | null; right: Score | null;
  final_left: Score | null; final_right: Score | null;
  revisions: { side: 'left' | 'right'; from: Score; to: Score; exposure: 'right_seen' | 'pair_seen' }[];
};

export function recordAssessment(previous: Assessment | undefined, side: 'left' | 'right', value: Score): Assessment {
  const row: Assessment = previous ?? { left: null, right: null, final_left: null, final_right: null, revisions: [] };
  const from = row[`final_${side}`];
  return { ...row, [side]: row[side] ?? value, [`final_${side}`]: value,
    revisions: from === null || from === value ? row.revisions : [...row.revisions,
      { side, from, to: value, exposure: row.right === null ? 'right_seen' : 'pair_seen' }],
  };
}

export function validAssessment(value: unknown, complete = false): value is Assessment {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Assessment;
  const score = (v: unknown) => ['fails', 'partially_meets', 'meets'].includes(v as string);
  if (!Array.isArray(row.revisions)) return false;
  for (const side of ['left', 'right'] as const) if (!score(row[side]) && (complete || row[side] !== null)) return false;
  if (row.right !== null && row.left === null) return false;
  const final = { left: row.left, right: row.right };
  for (const revision of row.revisions) {
    if (!revision || !['left', 'right'].includes(revision.side)) return false;
    if (revision.from !== final[revision.side] || revision.from === null || !score(revision.to)) return false;
    if (!['right_seen', 'pair_seen'].includes(revision.exposure)) return false;
    final[revision.side] = revision.to;
  }
  return row.final_left === final.left && row.final_right === final.right;
}
