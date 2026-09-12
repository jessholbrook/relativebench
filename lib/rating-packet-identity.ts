/** Mirrors evals/relativebench/packet_identity.py; collection approval is separate. */
export function stimulusPayload(packet: Record<string, unknown>) {
  return Object.fromEntries([
    'packet_version', 'packet_id', 'protocol_version', 'session_type', 'condition',
    'form_selector', 'assigned_reviewer_sha256', 'pointwise_scale', 'paired_scale',
    'source_run_commitments', 'key_commitment_sha256', 'pairs', 'forms',
  ].map((key) => [key, packet[key] ?? null]));
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    return `{${Object.keys(row).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(row[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function stimulusDigest(packet: Record<string, unknown>) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(stimulusPayload(packet))));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
