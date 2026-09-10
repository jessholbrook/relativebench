import {
  ArrowLeft,
  ArrowRight,
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

const counts = compatibility.counts;
const previousPasses = counts.stable_successes + counts.negative_flips;
const previousFailures = counts.positive_flips + counts.stable_failures;

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
          <Badge className="hidden sm:inline-flex" variant="outline">Example report</Badge>
          <nav className="ml-auto flex items-center gap-3 text-sm" aria-label="Example report navigation">
            <a className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline" href="/">Overview</a>
            <a className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 font-medium shadow-sm transition-colors hover:bg-muted" href="/rate">
              Try it <ArrowRight className="size-3.5" />
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
          <Card className="border-0 bg-brand-coral/10 text-foreground ring-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="size-4" /> What this page demonstrates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p>One transition summary for decision-makers.</p>
              <p>Category-level evidence for model teams.</p>
              <p>What evidence a real report would need.</p>
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
            <Card className="border-0 bg-card ring-1 ring-border">
              <CardHeader><CardTitle>Different denominators, different questions</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-base leading-7 text-muted-foreground">
                <p>Recovery is measured among earlier failures; regression is measured among earlier successes. Subtracting these two percentages does not give the change in overall accuracy.</p>
                <p>In these example counts, {counts.stable_successes} items stay successful and {counts.stable_failures} stay unsuccessful. Across all {(previousPasses + previousFailures).toLocaleString('en-US')} example items, the net accuracy change is +{((counts.positive_flips - counts.negative_flips) / (previousPasses + previousFailures) * 100).toFixed(2)} percentage points.</p>
                <p className="text-sm">Counts and selected tasks illustrate interpretation only. They do not come from a scored run, and the selected tasks are not the full scoring set.</p>
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
            <h2 id="runs-heading" className="mt-1 text-2xl font-semibold tracking-tight">Behind the results</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">A credible report lets you inspect how its numbers were produced. This page is an example: no human preference results have been collected, and no completed run supports these figures.</p>
          </div>
          <div className="max-w-3xl space-y-4 text-base leading-7 text-muted-foreground">
            <p><strong className="font-semibold text-foreground">What was compared?</strong> A real report needs immutable model revisions, the transition condition, prompts, tool settings, and a versioned task manifest. Those details establish whether the comparison matches your use case.</p>
            <p><strong className="font-semibold text-foreground">Whose experience was measured?</strong> Look for cohort definitions, scenario and evaluator counts, assignment balance, missing responses, and exclusions—not just a total number of clicks.</p>
            <p><strong className="font-semibold text-foreground">Can the analysis be checked?</strong> Look for response hashes, privacy-safe judgments, the analysis version and bootstrap seed, and recorded guardrail outcomes. An overall gain does not overrule a critical failure.</p>
            <p><a className="underline decoration-brand-coral/50 underline-offset-4" href="https://github.com/jessholbrook/relativebench/blob/main/docs/methodology.md">Read the protocol</a>{' · '}<a className="underline decoration-brand-coral/50 underline-offset-4" href="/guide">Understand benchmark limitations</a></p>
          </div>
        </section>

        <section className="mt-10 flex flex-col items-start justify-between gap-5 py-6 sm:flex-row sm:items-center sm:py-8" aria-labelledby="rater-heading">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">Try it</p>
            <h2 id="rater-heading" className="mt-1 text-2xl font-semibold">Try the rater experience</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">Score each response against a shared rubric, compare the pair only after both scores are locked, and move through the packet without touching the mouse.</p>
          </div>
          <a className="group inline-flex shrink-0 items-center gap-8 bg-[#e34c3b] px-5 py-4 text-sm font-medium text-white transition-colors hover:bg-[#171715]" href="/rate">
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
