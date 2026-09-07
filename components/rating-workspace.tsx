'use client';

import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import {
  ArrowLeft,
  Check,
  Download,
  EyeOff,
  Keyboard,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type PointwiseScore = 'fails' | 'partially_meets' | 'meets';
type SidePreference = -2 | -1 | 0 | 1 | 2;
type Stage = 'left' | 'right' | 'pair';

type Response = { response_id: string; text: string };
type Pair = {
  pair_id: string;
  scenario_id: string;
  category: string;
  difficulty: string;
  scoring_mode: string;
  prompt: string;
  rubric: string;
  responses: [Response, Response];
};
type Assignment = {
  assignment_id: string;
  position: number;
  pair_id: string;
  left_response_id: string;
  right_response_id: string;
};
type PacketForm = { form_id: 'form-a' | 'form-b'; assignments: Assignment[] };

export type RatingPacket = {
  packet_version: string;
  packet_id: string;
  session_type: 'internal_interface_pilot';
  protocol_version: string;
  condition: 'frozen';
  blinding: string;
  pointwise_scale: PointwiseScore[];
  paired_scale: Record<string, string>;
  form_selector: string;
  source_run_commitments: string[];
  key_commitment_sha256: string;
  pairs: Pair[];
  forms: PacketForm[];
};

type Judgment = {
  assignment_id: string;
  pair_id: string;
  scenario_id: string;
  category: string;
  pointwise_left: PointwiseScore;
  pointwise_right: PointwiseScore;
  side_preference: SidePreference;
  reason_tags: string[];
  duration_ms: number;
};

type SessionState = {
  packetId: string;
  reviewerCodeSha256: string;
  formId: 'form-a' | 'form-b';
  startedAt: string;
  currentIndex: number;
  stage: Stage;
  assignmentStartedAt: number;
  pointwiseLeft: PointwiseScore | null;
  pointwiseRight: PointwiseScore | null;
  sidePreference: SidePreference | null;
  reasonTags: string[];
  judgments: Judgment[];
};

const pointwiseOptions: Array<{ value: PointwiseScore; label: string; description: string }> = [
  { value: 'fails', label: 'Fails criteria', description: 'Major correctness or instruction failure.' },
  { value: 'partially_meets', label: 'Partially meets', description: 'Useful, but has a material issue.' },
  { value: 'meets', label: 'Meets criteria', description: 'Satisfies the stated rubric.' },
];

const preferenceOptions: Array<{ value: SidePreference; label: string }> = [
  { value: -2, label: 'Left much better' },
  { value: -1, label: 'Left slightly better' },
  { value: 0, label: 'Meaningfully indistinguishable' },
  { value: 1, label: 'Right slightly better' },
  { value: 2, label: 'Right much better' },
];

const reasonOptions = ['Correctness', 'Instruction following', 'Clarity', 'Format', 'Safety', 'Length'];

const pointwiseLabels: Record<PointwiseScore, string> = {
  fails: 'Fails',
  partially_meets: 'Partially meets',
  meets: 'Meets',
};

const preferenceLabels: Record<SidePreference, string> = {
  [-2]: 'Left much better',
  [-1]: 'Left slightly better',
  0: 'Indistinguishable',
  1: 'Right slightly better',
  2: 'Right much better',
};

function formatCategory(value: string) {
  return value.replace(/_/g, ' ');
}

function formatDuration(durationMs: number) {
  const seconds = Math.round(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
}

function preferenceTone(value: SidePreference) {
  if (value < 0) return 'bg-sky-100 text-sky-900';
  if (value > 0) return 'bg-amber-100 text-amber-950';
  return 'bg-muted text-foreground';
}

function SessionJudgmentTable({ judgments }: { judgments: Judgment[] }) {
  return (
    <div className="max-h-[38rem] overflow-auto">
      <Table aria-label="Blinded session judgments">
        <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_var(--border)]">
          <TableRow>
            <TableHead className="w-14">#</TableHead>
            <TableHead>Scenario</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Left score</TableHead>
            <TableHead>Right score</TableHead>
            <TableHead>Paired preference</TableHead>
            <TableHead>Reason tags</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {judgments.map((judgment, index) => (
            <TableRow key={judgment.assignment_id}>
              <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">{index + 1}</TableCell>
              <TableCell className="font-mono text-xs">{judgment.scenario_id}</TableCell>
              <TableCell className="capitalize">{formatCategory(judgment.category)}</TableCell>
              <TableCell><span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">{pointwiseLabels[judgment.pointwise_left]}</span></TableCell>
              <TableCell><span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">{pointwiseLabels[judgment.pointwise_right]}</span></TableCell>
              <TableCell><span className={`rounded-md px-2 py-1 text-xs font-medium ${preferenceTone(judgment.side_preference)}`}>{preferenceLabels[judgment.side_preference]}</span></TableCell>
              <TableCell className="min-w-52 whitespace-normal text-xs text-muted-foreground">{judgment.reason_tags.length > 0 ? judgment.reason_tags.join(', ') : '—'}</TableCell>
              <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">{formatDuration(judgment.duration_ms)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ShortcutKey({ children }: { children: string }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground shadow-sm">
      {children}
    </kbd>
  );
}

function ShortcutGuide({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    ['1–3', 'Score the visible response'],
    ['1–5', 'Choose the paired preference'],
    ['B / ←', 'Go back one step or task'],
    ['⇧1–6', 'Tag the previous judgment'],
    ['E', 'Export the blinded session'],
    ['⇧R', 'Reset the local session'],
    ['?', 'Toggle this guide'],
  ];
  return (
    <dialog open className="fixed inset-x-4 bottom-4 top-auto z-50 ml-auto max-w-sm rounded-xl border border-border bg-card p-4 text-foreground shadow-xl sm:inset-x-auto sm:right-6 sm:bottom-6" aria-label="Keyboard shortcuts">
      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm font-semibold"><Keyboard className="size-4" /> Keyboard shortcuts</p>
        <ActionButton variant="ghost" size="sm" aria-label="Close keyboard shortcuts" onClick={onClose}><X className="size-4" /></ActionButton>
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
        {shortcuts.map(([keys, action]) => (
          <div className="contents" key={keys}>
            <dt><ShortcutKey>{keys}</ShortcutKey></dt>
            <dd className="self-center text-muted-foreground">{action}</dd>
          </div>
        ))}
      </dl>
    </dialog>
  );
}

function LastJudgmentTags({ judgment, onToggle }: { judgment: Judgment; onToggle: (reason: string) => void }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-xs font-medium">Previous judgment saved</p>
        <p className="text-xs text-muted-foreground">Optional reason tags</p>
        <div className="flex flex-wrap gap-1.5 sm:ml-auto">
          {reasonOptions.map((reason, index) => {
            const selected = judgment.reason_tags.includes(reason);
            return (
              <button
                key={reason}
                type="button"
                aria-pressed={selected}
                aria-keyshortcuts={`Shift+${index + 1}`}
                onClick={() => onToggle(reason)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted'}`}
              >
                {reason} <ShortcutKey>{`⇧${index + 1}`}</ShortcutKey>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: ComponentProps<'button'> & {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}) {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    outline: 'border-border bg-background hover:bg-muted',
    ghost: 'border-transparent bg-transparent hover:bg-muted',
  };
  const sizes = { default: 'h-8 px-2.5', sm: 'h-7 px-2.5 text-xs', lg: 'h-9 px-3' };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function responseFor(pair: Pair, responseId: string) {
  const response = pair.responses.find((item) => item.response_id === responseId);
  if (!response) throw new Error('Rating packet references a missing response.');
  return response;
}

function storageKey(packetId: string, reviewerCodeSha256: string) {
  return `relativebench:rating:${packetId}:${reviewerCodeSha256}`;
}

function nowMilliseconds() {
  return Date.now();
}

export function RatingWorkspace({ packetUrl }: { packetUrl: string }) {
  const [packet, setPacket] = useState<RatingPacket | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(packetUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Packet request failed with ${response.status}.`);
        return response.json() as Promise<RatingPacket>;
      })
      .then((value) => { if (active) setPacket(value); })
      .catch(() => { if (active) setError('The blinded rating packet could not be loaded.'); });
    return () => { active = false; };
  }, [packetUrl]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
        <Card className="max-w-md border-0 ring-1 ring-border">
          <CardHeader><CardTitle>Rating packet unavailable</CardTitle><CardDescription>{error}</CardDescription></CardHeader>
          <CardContent><ActionButton variant="outline" onClick={() => window.location.reload()}>Try again</ActionButton></CardContent>
        </Card>
      </main>
    );
  }
  if (!packet) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
        <p className="text-sm text-muted-foreground">Loading blinded rating packet…</p>
      </main>
    );
  }
  return <RatingSession packet={packet} />;
}

function RatingSession({ packet }: { packet: RatingPacket }) {
  const [reviewerCode, setReviewerCode] = useState('');
  const [session, setSession] = useState<SessionState | null>(null);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const pairById = useMemo(
    () => new Map(packet.pairs.map((pair) => [pair.pair_id, pair])),
    [packet.pairs],
  );
  const activeForm = session
    ? packet.forms.find((form) => form.form_id === session.formId) ?? null
    : null;
  const assignment = activeForm?.assignments[session?.currentIndex ?? 0] ?? null;
  const pair = assignment ? pairById.get(assignment.pair_id) ?? null : null;

  useEffect(() => {
    if (!session) return;
    localStorage.setItem(
      storageKey(packet.packet_id, session.reviewerCodeSha256),
      JSON.stringify(session),
    );
  }, [packet.packet_id, session]);

  async function beginSession() {
    const normalized = reviewerCode.trim();
    if (!normalized) {
      setNotice('Enter a reviewer code to start or resume.');
      return;
    }
    setStarting(true);
    const reviewerCodeSha256 = await sha256(normalized);
    const key = storageKey(packet.packet_id, reviewerCodeSha256);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as SessionState;
      if (parsed.packetId === packet.packet_id && parsed.reviewerCodeSha256 === reviewerCodeSha256) {
        setSession(parsed);
        setNotice('Resumed the locally saved session.');
        setStarting(false);
        return;
      }
    }
    const firstByte = Number.parseInt(reviewerCodeSha256.slice(0, 2), 16);
    const formId = firstByte % 2 === 0 ? 'form-a' : 'form-b';
    setSession({
      packetId: packet.packet_id,
      reviewerCodeSha256,
      formId,
      startedAt: new Date().toISOString(),
      currentIndex: 0,
      stage: 'left',
      assignmentStartedAt: nowMilliseconds(),
      pointwiseLeft: null,
      pointwiseRight: null,
      sidePreference: null,
      reasonTags: [],
      judgments: [],
    });
    setNotice(null);
    setStarting(false);
  }

  function choosePointwise(value: PointwiseScore) {
    setSession((current) => {
      if (!current || current.stage === 'pair') return current;
      if (current.stage === 'left') {
        return { ...current, pointwiseLeft: value, stage: 'right' };
      }
      return { ...current, pointwiseRight: value, stage: 'pair' };
    });
    setNotice(null);
  }

  function goBack() {
    if (!session) return;
    if (session.stage === 'right') {
      setSession({ ...session, stage: 'left' });
      return;
    }
    if (session.stage === 'pair') {
      setSession({ ...session, stage: 'right' });
      return;
    }
    if (session.currentIndex === 0 || session.judgments.length === 0) return;
    const previousJudgment = session.judgments.at(-1);
    if (!previousJudgment) return;
    setSession({
      ...session,
      currentIndex: session.currentIndex - 1,
      stage: 'pair',
      assignmentStartedAt: nowMilliseconds(),
      pointwiseLeft: previousJudgment.pointwise_left,
      pointwiseRight: previousJudgment.pointwise_right,
      sidePreference: previousJudgment.side_preference,
      reasonTags: previousJudgment.reason_tags,
      judgments: session.judgments.slice(0, -1),
    });
    setNotice('Previous judgment reopened. Choose a preference to save it again.');
  }

  function choosePreference(value: SidePreference) {
    if (!session || !assignment || !pair) return;
    if (!session.pointwiseLeft || !session.pointwiseRight) return;
    const judgment: Judgment = {
      assignment_id: assignment.assignment_id,
      pair_id: pair.pair_id,
      scenario_id: pair.scenario_id,
      category: pair.category,
      pointwise_left: session.pointwiseLeft,
      pointwise_right: session.pointwiseRight,
      side_preference: value,
      reason_tags: session.reasonTags,
      duration_ms: Math.max(0, nowMilliseconds() - session.assignmentStartedAt),
    };
    setSession({
      ...session,
      currentIndex: session.currentIndex + 1,
      stage: 'left',
      assignmentStartedAt: nowMilliseconds(),
      pointwiseLeft: null,
      pointwiseRight: null,
      sidePreference: null,
      reasonTags: [],
      judgments: [...session.judgments, judgment],
    });
    setNotice('Judgment saved locally.');
  }

  function toggleLastReason(reason: string) {
    setSession((current) => {
      if (!current || current.judgments.length === 0) return current;
      const previous = current.judgments.at(-1);
      if (!previous) return current;
      const reasonTags = previous.reason_tags.includes(reason)
        ? previous.reason_tags.filter((item) => item !== reason)
        : [...previous.reason_tags, reason];
      return {
        ...current,
        judgments: [
          ...current.judgments.slice(0, -1),
          { ...previous, reason_tags: reasonTags },
        ],
      };
    });
  }

  function exportSession() {
    if (!session) return;
    const payload = {
      session_version: '0.1.0',
      session_type: packet.session_type,
      packet_id: packet.packet_id,
      form_id: session.formId,
      reviewer_code_sha256: session.reviewerCodeSha256,
      started_at: session.startedAt,
      exported_at: new Date().toISOString(),
      completed_assignment_count: session.judgments.length,
      judgments: session.judgments,
    };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `relativebench-internal-rating-${session.reviewerCodeSha256.slice(0, 12)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function resetSession() {
    if (!session) return;
    if (!window.confirm('Delete this device-local rating session? Export first if you need a copy.')) return;
    localStorage.removeItem(storageKey(packet.packet_id, session.reviewerCodeSha256));
    setSession(null);
    setReviewerCode('');
    setNotice('Local session deleted.');
  }

  useEffect(() => {
    if (!session) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (!session) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) return;
      if (event.repeat) return;

      if (event.key === 'Escape') {
        setShowShortcuts(false);
        return;
      }
      if (event.key === '?') {
        event.preventDefault();
        setShowShortcuts((visible) => !visible);
        return;
      }
      if (event.shiftKey && /^Digit[1-6]$/.test(event.code)) {
        event.preventDefault();
        toggleLastReason(reasonOptions[Number(event.code.slice(-1)) - 1]);
        return;
      }
      if (event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        resetSession();
        return;
      }
      if (!event.shiftKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        exportSession();
        return;
      }
      if (!event.shiftKey && (event.key.toLowerCase() === 'b' || event.key === 'ArrowLeft')) {
        event.preventDefault();
        goBack();
        return;
      }
      if (showShortcuts || event.shiftKey || !assignment || !pair || !/^Digit[1-5]$/.test(event.code)) return;
      const optionIndex = Number(event.code.slice(-1)) - 1;
      if (session.stage === 'pair') {
        const option = preferenceOptions[optionIndex];
        if (option) {
          event.preventDefault();
          choosePreference(option.value);
        }
        return;
      }
      const option = pointwiseOptions[optionIndex];
      if (option) {
        event.preventDefault();
        choosePointwise(option.value);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!session) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <a className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href="/">
            <ArrowLeft className="size-4" /> RelativeBench
          </a>
          <div className="mt-10 grid gap-6 md:grid-cols-[1fr_.72fr]">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Blind rating workspace
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Score each response against the rubric before seeing the pair. Model identity and role are absent from this packet.
              </p>
              <div className="mt-7 grid gap-3 text-sm text-muted-foreground">
                <p className="flex gap-3"><EyeOff className="mt-0.5 size-4 shrink-0 text-foreground" /> Left and right responses are counterbalanced across two forms.</p>
                <p className="flex gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" /> Progress stays on this device until you export it.</p>
                <p className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-foreground" /> No aggregate preference is calculated or displayed.</p>
                <p className="flex gap-3"><Keyboard className="mt-0.5 size-4 shrink-0 text-foreground" /> Every selection advances automatically; keyboard shortcuts cover the full workflow.</p>
              </div>
            </div>
            <Card className="border-0 bg-card ring-1 ring-border">
              <CardHeader>
                <CardTitle>Start or resume</CardTitle>
                <CardDescription>Use the same private code on this device to resume.</CardDescription>
              </CardHeader>
              <CardContent>
                <label className="text-sm font-medium" htmlFor="reviewer-code">Reviewer code</label>
                <input
                  id="reviewer-code"
                  className="mt-2 h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={reviewerCode}
                  onChange={(event) => setReviewerCode(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void beginSession(); }}
                  placeholder="e.g. internal-reviewer-01"
                  autoComplete="off"
                />
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Only a SHA-256 hash of this code appears in exports.
                </p>
                {notice && <p className="mt-3 text-sm text-rose-700">{notice}</p>}
                <ActionButton className="mt-5 w-full" size="lg" aria-keyshortcuts="Enter" onClick={() => void beginSession()} disabled={starting}>
                  {starting ? 'Preparing…' : 'Enter rating workspace'} <ShortcutKey>Enter</ShortcutKey>
                </ActionButton>
              </CardContent>
            </Card>
          </div>
          <p className="mt-10 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
            These are 4-bit infrastructure-rehearsal outputs. This session tests collection mechanics and is not eligible for a published model result.
          </p>
        </div>
      </main>
    );
  }

  const complete = !assignment || !pair || !activeForm;
  const completed = session.judgments.length;
  const total = activeForm?.assignments.length ?? packet.pairs.length;

  if (complete) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 sm:py-12">
        <div className="mx-auto max-w-[1400px] space-y-4">
          {session.judgments.at(-1) && <LastJudgmentTags judgment={session.judgments.at(-1)!} onToggle={toggleLastReason} />}
          <Card className="border-0 bg-card ring-1 ring-border">
            <CardHeader>
              <div className="flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:text-left">
                <div className="mx-auto grid size-12 shrink-0 place-items-center rounded-full bg-lime-200 text-lime-950 sm:mx-0"><Check /></div>
                <div>
                  <CardTitle className="text-2xl">Rating session complete</CardTitle>
                  <CardDescription className="mt-1">All {completed} judgments are saved locally. No preference summary has been calculated.</CardDescription>
                </div>
                <Badge className="mx-auto sm:ml-auto sm:mr-0" variant="outline">{session.formId}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:flex-wrap">
              <ActionButton size="lg" variant="outline" aria-keyshortcuts="B ArrowLeft" onClick={goBack}><ArrowLeft /> Reopen last <ShortcutKey>B</ShortcutKey></ActionButton>
              <ActionButton size="lg" aria-keyshortcuts="E" onClick={exportSession}><Download /> Export <ShortcutKey>E</ShortcutKey></ActionButton>
              <ActionButton size="lg" variant="outline" aria-keyshortcuts="Shift+R" onClick={resetSession}><RotateCcw /> Delete local copy <ShortcutKey>⇧R</ShortcutKey></ActionButton>
              <ActionButton size="lg" variant="ghost" aria-keyshortcuts="?" onClick={() => setShowShortcuts(true)}><Keyboard /> Shortcuts <ShortcutKey>?</ShortcutKey></ActionButton>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 bg-card ring-1 ring-border">
            <CardHeader className="border-b border-border sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>Blinded response record</CardTitle>
                <CardDescription className="mt-1">Your task-level ratings, shown exactly as they will be exported. Model identities and aggregate preference remain hidden.</CardDescription>
              </div>
              <Badge variant="secondary">{completed} rows</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <SessionJudgmentTable judgments={session.judgments} />
            </CardContent>
          </Card>
        </div>
        {showShortcuts && <ShortcutGuide onClose={() => setShowShortcuts(false)} />}
      </main>
    );
  }

  const left = responseFor(pair, assignment.left_response_id);
  const right = responseFor(pair, assignment.right_response_id);
  const progress = (completed / total) * 100;
  const visibleResponse = session.stage === 'left' ? left : right;
  const visibleSide = session.stage === 'left' ? 'Left' : 'Right';

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-5 py-4 sm:px-8">
          <a className="flex items-center gap-2 text-sm font-semibold" href="/"><EyeOff className="size-4" /> Blind rating</a>
          <Badge variant="outline">{session.formId}</Badge>
          <div className="ml-auto flex items-center gap-2">
            <ActionButton variant="ghost" size="sm" aria-keyshortcuts="B ArrowLeft" onClick={goBack} disabled={session.stage === 'left' && session.currentIndex === 0}><ArrowLeft /> Back <ShortcutKey>B</ShortcutKey></ActionButton>
            <ActionButton variant="outline" size="sm" aria-keyshortcuts="E" onClick={exportSession}><Download /> Export <ShortcutKey>E</ShortcutKey></ActionButton>
            <ActionButton variant="ghost" size="sm" aria-keyshortcuts="?" onClick={() => setShowShortcuts(true)}><Keyboard /> <ShortcutKey>?</ShortcutKey></ActionButton>
            <ActionButton variant="ghost" size="sm" aria-keyshortcuts="Shift+R" onClick={resetSession}><RotateCcw /> Reset <ShortcutKey>⇧R</ShortcutKey></ActionButton>
          </div>
          <div className="flex basis-full flex-wrap items-center gap-3" aria-label={`Progress ${completed} of ${total}`}>
            <span className="text-sm font-medium">Progress</span>
            <span className="ml-auto text-sm tabular-nums text-muted-foreground">{completed} / {total}</span>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[.72fr_1.28fr]">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Task {completed + 1} of {total}</Badge>
            <Badge variant="outline">{pair.category.replace('_', ' ')}</Badge>
            <Badge variant="outline">{pair.difficulty}</Badge>
          </div>
          <Card className="border-0 bg-card ring-1 ring-border">
            <CardHeader>
              <CardTitle>Task</CardTitle>
              <CardDescription>Use the same task and rubric for both responses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Prompt</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{pair.prompt}</p>
              </div>
              <div className="rounded-lg bg-lime-100/70 p-4 text-lime-950">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-lime-900/60">Rubric</p>
                <p className="mt-2 text-sm leading-6">{pair.rubric}</p>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs leading-5 text-muted-foreground">
            Do not inspect repository artifacts or try to infer model identity while rating.
          </p>
        </aside>

        <section className="space-y-4">
          {session.judgments.at(-1) && <LastJudgmentTags judgment={session.judgments.at(-1)!} onToggle={toggleLastReason} />}
          {session.stage !== 'pair' ? (
            <Card className="border-0 bg-card ring-1 ring-border">
              <CardHeader>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Pointwise assessment · {session.stage === 'left' ? 'step 1 of 3' : 'step 2 of 3'}
                </p>
                <CardTitle className="text-2xl">Score the {visibleSide.toLowerCase()} response</CardTitle>
                <CardDescription>The other response remains hidden until both pointwise scores are locked in.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[32rem] overflow-auto rounded-lg bg-ink p-5 text-sm leading-6 text-zinc-100 sm:p-6">
                  <pre className="whitespace-pre-wrap font-sans">{visibleResponse.text}</pre>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {pointwiseOptions.map((option, index) => {
                    const selected = session.stage === 'left'
                      ? session.pointwiseLeft === option.value
                      : session.pointwiseRight === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        aria-keyshortcuts={`${index + 1}`}
                        onClick={() => choosePointwise(option.value)}
                        className={`rounded-lg border p-4 text-left transition-colors ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted'}`}
                      >
                        <strong className="flex items-center justify-between gap-2 text-sm">{option.label} <ShortcutKey>{`${index + 1}`}</ShortcutKey></strong>
                        <span className={`mt-1 block text-xs leading-4 ${selected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{option.description}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <ActionButton variant="ghost" aria-keyshortcuts="B ArrowLeft" onClick={goBack} disabled={session.stage === 'left' && session.currentIndex === 0}><ArrowLeft /> Back <ShortcutKey>B</ShortcutKey></ActionButton>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">Select or press <ShortcutKey>1–3</ShortcutKey> to advance</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Paired judgment · step 3 of 3</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">Compare the responses</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your pointwise scores are retained. Choosing a preference saves it and opens the next task.</p>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {([['Left', left], ['Right', right]] as const).map(([side, response]) => (
                  <Card key={side} className="border-0 bg-card ring-1 ring-border">
                    <CardHeader><CardTitle>{side}</CardTitle></CardHeader>
                    <CardContent>
                      <div className="max-h-[28rem] overflow-auto rounded-lg bg-ink p-5 text-sm leading-6 text-zinc-100">
                        <pre className="whitespace-pre-wrap font-sans">{response.text}</pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-0 bg-card ring-1 ring-border">
                <CardContent className="py-6">
                  <p className="text-sm font-medium">Overall difference</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-5">
                    {preferenceOptions.map((option, index) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={session.sidePreference === option.value}
                        aria-keyshortcuts={`${index + 1}`}
                        onClick={() => choosePreference(option.value)}
                        className={`rounded-lg border px-3 py-3 text-sm transition-colors ${session.sidePreference === option.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted'}`}
                      >
                        <span className="flex items-center justify-center gap-2">{option.label} <ShortcutKey>{`${index + 1}`}</ShortcutKey></span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <ActionButton variant="ghost" aria-keyshortcuts="B ArrowLeft" onClick={goBack}><ArrowLeft /> Back <ShortcutKey>B</ShortcutKey></ActionButton>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">Select or press <ShortcutKey>1–5</ShortcutKey> to save and advance</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {notice && <p className="mt-4 text-center text-xs text-muted-foreground">{notice}</p>}
        </section>
      </div>
      {showShortcuts && <ShortcutGuide onClose={() => setShowShortcuts(false)} />}
    </main>
  );
}
