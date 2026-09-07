import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  FlaskConical,
  GitCompareArrows,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ExperienceDelta } from '@/components/experience-delta';
import { BenchmarkDeltas } from '@/components/benchmark-deltas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import exampleSnapshot from '@/data/snapshots/example-transition.json';

const { experience, compatibility, benchmark_deltas: benchmarkDeltas } = exampleSnapshot;

// Illustrative task changes for the example report, not collected results.
const exampleImprovements = [
  { task: 'Scheduling with multiple constraints', change: 'Previously double-booked a meeting; now produces a schedule that satisfies every constraint.' },
  { task: 'Code that handles empty input', change: 'Previously crashed on an empty list; now returns the expected result and passes the edge-case test.' },
  { task: 'Summaries within a word limit', change: 'Previously exceeded the requested length; now keeps the key points within the word limit.' },
];

const exampleRegressions = [
  { task: 'JSON-only responses', change: 'Previously returned parseable JSON alone; now adds commentary that breaks the parser.' },
  { task: 'Required fields with missing values', change: 'Previously included null for missing values; now omits required fields and fails schema validation.' },
  { task: 'Exact category labels', change: 'Previously used the allowed labels; now substitutes synonyms that the downstream system rejects.' },
];

const fakeRuns = [
  { id: 'RB-DEMO-005', stage: 'Final report', scope: '120 scenarios · 48 raters', output: 'Versioned snapshot', status: 'Complete' },
  { id: 'RB-DEMO-004', stage: 'Blind rating', scope: '120 pairs · 2 mirrored forms', output: '5,760 judgments', status: 'Validated' },
  { id: 'RB-DEMO-003', stage: 'Response generation', scope: '2 models · 3 seeds', output: '720 artifacts', status: 'Validated' },
  { id: 'RB-DEMO-002', stage: 'Scenario review', scope: '6 categories · 3 difficulties', output: '120 frozen tasks', status: 'Complete' },
  { id: 'RB-DEMO-001', stage: 'Protocol freeze', scope: 'Primary + guardrails', output: 'Protocol v0.1', status: 'Locked' },
];

export default function DemoReport() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-amber-300/60 bg-amber-100 px-5 py-2.5 text-center text-xs font-semibold text-amber-950">
        Example — every model name, score, rating, and run below is invented to demonstrate the report format.
      </div>

      <header className="border-b border-border/80 bg-background/95">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-5 sm:px-8">
          <a className="flex items-center gap-2.5" href="/" aria-label="RelativeBench home">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <GitCompareArrows className="size-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">RelativeBench</span>
          </a>
          <Badge variant="outline">Example report</Badge>
          <nav className="ml-auto flex items-center gap-3 text-sm" aria-label="Example report navigation">
            <a className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline" href="/">Overview</a>
            <a className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 font-medium shadow-sm transition-colors hover:bg-muted" href="/rate">
              Rater workspace <ArrowRight className="size-3.5" />
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-12">
        <section className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_.55fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-100 text-amber-950" variant="secondary"><FlaskConical className="size-3" /> Example</Badge>
              <Badge variant="outline">Protocol v0.1</Badge>
              <Badge variant="outline">Frozen condition</Badge>
            </div>
            <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Example transition report</p>
            <h1 className="mt-2 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl">
              Model A <span className="text-muted-foreground">→</span> Model B
            </h1>
            <p className="mt-5 max-w-3xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              A finished RelativeBench report combines conventional benchmark movement with task flips and the change incumbent users actually perceive.
            </p>
          </div>
          <Card className="border-0 bg-lime-200 text-lime-950 ring-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="size-4" /> What this page demonstrates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-lime-950/75">
              <p>One transition summary for decision-makers.</p>
              <p>Category-level evidence for model teams.</p>
              <p>A reproducible run ledger for auditors.</p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 space-y-4">
          <ExperienceDelta experience={experience} />

          <div className="space-y-4">
            <Card className="border-0 bg-card ring-1 ring-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CircleDot className="size-4 text-teal-600" /> Compatibility flips</CardTitle>
                <CardDescription>Changes hidden by aggregate accuracy. Example tasks show what started working and what stopped.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-8 md:grid-cols-2">
                <section aria-labelledby="improved-heading">
                  <div className="rounded-lg bg-teal-50 p-4 dark:bg-teal-950/30">
                    <span className="font-mono text-2xl font-semibold text-teal-700 dark:text-teal-300">{(compatibility.positive_flip_rate * 100).toFixed(1)}%</span>
                    <p className="mt-1 text-sm text-teal-900 dark:text-teal-100">previously failed → passed</p>
                  </div>
                  <h3 id="improved-heading" className="mt-5 text-lg font-semibold">What improved</h3>
                  <ul className="mt-3 list-disc space-y-4 pl-5 marker:text-teal-600">
                    {exampleImprovements.map((item) => (
                      <li key={item.task} className="pl-1 text-base leading-7">
                        <strong className="font-semibold">{item.task}.</strong>{' '}
                        <span className="text-muted-foreground">{item.change}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section aria-labelledby="regressed-heading">
                  <div className="rounded-lg bg-rose-50 p-4 dark:bg-rose-950/30">
                    <span className="font-mono text-2xl font-semibold text-rose-700 dark:text-rose-300">{(compatibility.negative_flip_rate * 100).toFixed(1)}%</span>
                    <p className="mt-1 text-sm text-rose-900 dark:text-rose-100">previously passed → failed</p>
                  </div>
                  <h3 id="regressed-heading" className="mt-5 text-lg font-semibold">What got worse</h3>
                  <ul className="mt-3 list-disc space-y-4 pl-5 marker:text-rose-600">
                    {exampleRegressions.map((item) => (
                      <li key={item.task} className="pl-1 text-base leading-7">
                        <strong className="font-semibold">{item.task}.</strong>{' '}
                        <span className="text-muted-foreground">{item.change}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card ring-1 ring-border">
              <CardHeader><CardTitle>Collection snapshot</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center">
                <div><strong className="block text-2xl">120</strong><span className="text-xs text-muted-foreground">scenarios</span></div>
                <div><strong className="block text-2xl">48</strong><span className="text-xs text-muted-foreground">raters</span></div>
                <div><strong className="block text-2xl">3</strong><span className="text-xs text-muted-foreground">seeds</span></div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="capability-heading">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Standard benchmarks</p>
              <h2 id="capability-heading" className="mt-1 text-2xl font-semibold tracking-tight">Capability delta vector</h2>
            </div>
            <p className="text-sm text-muted-foreground">Percentage-point change from Model A</p>
          </div>
          <BenchmarkDeltas metrics={benchmarkDeltas} />
        </section>

        <section className="mt-10" aria-labelledby="runs-heading">
          <div className="mb-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Provenance</p>
            <h2 id="runs-heading" className="mt-1 text-2xl font-semibold tracking-tight">Example run ledger</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Every published number should trace back through frozen tasks, generated artifacts, blinded judgments, and a versioned report. These rows are fake.</p>
          </div>
          <Card className="overflow-hidden border-0 bg-card ring-1 ring-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Output</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fakeRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-mono text-xs">{run.id}</TableCell>
                      <TableCell className="font-medium">{run.stage}</TableCell>
                      <TableCell className="text-muted-foreground">{run.scope}</TableCell>
                      <TableCell>{run.output}</TableCell>
                      <TableCell><Badge className="bg-lime-100 text-lime-950" variant="secondary"><CheckCircle2 className="size-3" /> {run.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 flex flex-col items-start justify-between gap-5 rounded-xl bg-ink p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-lime-300">Separate experience</p>
            <h2 className="mt-1 text-2xl font-semibold">The report is for readers. The workspace is for raters.</h2>
            <p className="mt-2 text-sm text-zinc-400">Ratings remain blind and local; reports publish only after the frozen analysis plan runs.</p>
          </div>
          <a className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-lime-300 px-4 py-2.5 text-sm font-semibold text-lime-950 transition-colors hover:bg-lime-200" href="/rate">
            Open rater workspace <ArrowRight className="size-4" />
          </a>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
          <a className="inline-flex items-center gap-2 hover:text-foreground" href="/"><ArrowLeft className="size-3.5" /> RelativeBench overview</a>
          <p className="flex items-center gap-2"><ShieldCheck className="size-3.5" /> Example · not a model claim</p>
        </footer>
      </div>
    </main>
  );
}
