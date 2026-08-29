import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleDot,
  GitCompareArrows,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import exampleSnapshot from '@/data/snapshots/example-transition.json';

const benchmarkDeltas = exampleSnapshot.benchmark_deltas;
const { experience, compatibility } = exampleSnapshot;

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/90">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <a className="flex items-center gap-2.5" href="#top" aria-label="RelativeBench home">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <GitCompareArrows className="size-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">RelativeBench</span>
            <Badge className="ml-1 bg-lime-200 text-lime-950" variant="secondary">
              Corpus rehearsal
            </Badge>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex" aria-label="Primary">
            <a className="transition-colors hover:text-foreground" href="#transition">Transitions</a>
            <a className="transition-colors hover:text-foreground" href="#method">Method</a>
            <a className="transition-colors hover:text-foreground" href="#about">About</a>
          </nav>
        </div>
      </header>

      <section id="top" className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-border pb-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground">
              Model transition intelligence
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl">
              Benchmarks say what changed.
              <span className="block text-muted-foreground">We measure how it feels.</span>
            </h1>
          </div>
          <p className="max-w-md text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
            Compare a new model with the one people already use—across capabilities, regressions,
            and perceived experience.
          </p>
        </div>

        <section id="transition" aria-labelledby="transition-heading">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Featured transition</p>
              <h2 id="transition-heading" className="mt-1 text-lg font-semibold tracking-tight">Qwen2.5 7B → Qwen3 8B</h2>
            </div>
            <button className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted sm:flex" type="button">
              All transitions <ChevronDown className="size-3.5" />
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
            <Card className="relative border-0 bg-ink text-white ring-0">
              <div className="absolute right-0 top-0 h-full w-2/5 bg-[radial-gradient(circle_at_70%_20%,rgba(190,242,100,.22),transparent_58%)]" />
              <CardHeader className="relative border-b border-white/10 py-5 sm:grid-cols-[1fr_auto]">
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-3 text-xl sm:text-2xl">
                    Qwen2.5 7B <ArrowRight className="size-5 text-lime-300" /> Qwen3 8B
                  </CardTitle>
                  <CardDescription className="mt-1 text-zinc-400">
                    Candidate transition · frozen workflow · illustrative result layout
                  </CardDescription>
                </div>
                <CardAction>
                  <Badge className="border-lime-300/30 bg-lime-300/10 text-lime-200" variant="outline">
                    Illustrative result
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="relative grid gap-8 py-7 sm:grid-cols-[.72fr_1.28fr] sm:py-9">
                <div className="border-b border-white/10 pb-7 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-8">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400">Experience Delta</p>
                  <div className="mt-2 flex items-start gap-2">
                    <span className="text-7xl font-semibold tracking-[-0.08em] text-lime-300">+{experience.delta}</span>
                    <span className="mt-3 font-mono text-xs text-zinc-400">ΔE₀</span>
                  </div>
                  <p className="mt-3 text-sm leading-5 text-zinc-400">
                    {experience.confidence_interval.level * 100}% CI +{experience.confidence_interval.lower} to +{experience.confidence_interval.upper}
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                    <div><strong className="block text-white">{experience.distribution_percent.better}%</strong><span className="text-zinc-500">better</span></div>
                    <div><strong className="block text-white">{experience.distribution_percent.same}%</strong><span className="text-zinc-500">same</span></div>
                    <div><strong className="block text-white">{experience.distribution_percent.worse}%</strong><span className="text-zinc-500">worse</span></div>
                  </div>
                </div>
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-sm font-medium">Standard benchmark deltas</p>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">percentage points</span>
                  </div>
                  <div className="space-y-4">
                    {benchmarkDeltas.map((metric) => (
                      <div key={metric.label} className="grid grid-cols-[132px_1fr_42px] items-center gap-3 text-xs sm:grid-cols-[150px_1fr_42px]">
                        <span className="text-zinc-300">{metric.label}</span>
                        <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
                          <span className="absolute left-1/2 top-0 h-full w-px bg-white/25" />
                          <span
                            className={`absolute top-0 h-full rounded-full ${metric.value >= 0 ? 'left-1/2 bg-lime-300' : 'right-1/2 bg-rose-400'}`}
                            style={{ width: `${Math.abs(metric.value) * 4}%` }}
                          />
                        </div>
                        <span className={`text-right font-mono ${metric.value >= 0 ? 'text-lime-300' : 'text-rose-300'}`}>
                          {metric.value > 0 ? '+' : ''}{metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Card className="border-0 bg-card ring-1 ring-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CircleDot className="size-4 text-teal-600" /> Compatibility</CardTitle>
                  <CardDescription>What aggregate scores hide</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-rose-50 p-4 dark:bg-rose-950/30">
                    <span className="font-mono text-2xl font-semibold text-rose-700 dark:text-rose-300">{(compatibility.negative_flip_rate * 100).toFixed(1)}%</span>
                    <p className="mt-1 text-xs leading-4 text-rose-900/60 dark:text-rose-100/60">negative flip rate</p>
                  </div>
                  <div className="rounded-lg bg-teal-50 p-4 dark:bg-teal-950/30">
                    <span className="font-mono text-2xl font-semibold text-teal-700 dark:text-teal-300">{(compatibility.positive_flip_rate * 100).toFixed(1)}%</span>
                    <p className="mt-1 text-xs leading-4 text-teal-900/60 dark:text-teal-100/60">positive flip rate</p>
                  </div>
                </CardContent>
              </Card>
              <Card id="method" className="border-0 bg-lime-200 text-lime-950 ring-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4" /> Read the protocol</CardTitle>
                  <CardDescription className="text-lime-950/65">Every transition is blind, paired, and reproducible.</CardDescription>
                </CardHeader>
                <CardContent>
                  <a className="inline-flex items-center gap-2 text-sm font-semibold underline decoration-lime-950/30 underline-offset-4" href="#about">
                    Methodology preview <ArrowRight className="size-3.5" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="about" className="mt-10 grid gap-4 border-t border-border pt-7 text-sm text-muted-foreground md:grid-cols-3">
          <p className="flex gap-3"><BookOpen className="mt-0.5 size-4 shrink-0 text-foreground" /> Standard scores remain visible as a capability delta vector.</p>
          <p className="flex gap-3"><CircleDot className="mt-0.5 size-4 shrink-0 text-foreground" /> Paired items expose positive and negative flips between releases.</p>
          <p className="flex gap-3"><GitCompareArrows className="mt-0.5 size-4 shrink-0 text-foreground" /> Incumbent users reveal migration friction and learned recovery.</p>
        </section>
      </section>
    </main>
  );
}
