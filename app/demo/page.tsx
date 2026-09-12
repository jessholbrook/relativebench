import {
  ArrowLeft,
  ArrowRight,
  CircleDot,
  FlaskConical,
  GitCompareArrows,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ExperienceDelta } from '@/components/experience-delta';
import { BenchmarkDeltas } from '@/components/benchmark-deltas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import exampleSnapshot from '@/data/snapshots/example-transition.json';
import { pageMetadata } from '@/lib/site-metadata';

export const metadata = pageMetadata('/demo', 'Example report | RelativeBench',
  'Explore an example model-transition report with benchmark changes, task flips, and perceived differences.');

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

const counts = compatibility.counts;
const previousPasses = counts.stable_successes + counts.negative_flips;
const previousFailures = counts.positive_flips + counts.stable_failures;

export default function DemoReport() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-amber-300/60 bg-amber-100 px-5 py-2.5 text-center text-xs font-semibold text-amber-950">
        Example — the model names, scores, ratings, and runs below are made up to show how a report works.
      </div>

      <header className="border-b border-border/80 bg-background/95">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-5 sm:px-8">
          <a className="flex items-center gap-2.5" href="/" aria-label="RelativeBench home">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <GitCompareArrows className="size-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">RelativeBench</span>
          </a>
          <Badge className="hidden sm:inline-flex" variant="outline">Example report</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-12">
        <section className="border-b border-border pb-10">
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
              A RelativeBench report combines conventional benchmark movement with task flips and the changes incumbent users actually perceive.
            </p>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          <ExperienceDelta experience={experience} />

          <div className="space-y-4">
            <Card className="border-0 bg-card ring-1 ring-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CircleDot className="size-4 text-teal-600" /> Compatibility flips</CardTitle>
                <CardDescription>Changes an overall score can hide. These example tasks show what started working and what stopped.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-8 md:grid-cols-2">
                <section aria-labelledby="improved-heading">
                  <div className="rounded-lg bg-teal-50 p-4 dark:bg-teal-950/30">
                    <span className="font-mono text-2xl font-semibold text-teal-700 dark:text-teal-300">{(compatibility.positive_flip_rate * 100).toFixed(1)}%</span>
                    <p className="mt-1 text-sm text-teal-900 dark:text-teal-100">previously failed → passed</p>
                    <p className="mt-2 text-sm text-teal-900">{counts.positive_flips} of {previousFailures.toLocaleString('en-US')} previously failed items</p>
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
                    <p className="mt-2 text-sm text-rose-900">{counts.negative_flips} of {previousPasses.toLocaleString('en-US')} previously passed items</p>
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

        <section className="mt-10 flex flex-col items-start justify-between gap-5 py-6 sm:flex-row sm:items-center sm:py-8" aria-labelledby="rater-heading">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">Try it</p>
            <h2 id="rater-heading" className="mt-1 text-2xl font-semibold">Try the rater experience</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">Score each response against a shared rubric, compare the pair only after both scores are locked, and move through the packet without touching the mouse.</p>
          </div>
          <a className="group inline-flex shrink-0 items-center gap-8 bg-[#e34c3b] px-5 py-4 text-sm font-medium text-[#171715] transition-colors hover:bg-[#171715] hover:text-white" href="/rate">
            Rate <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
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
