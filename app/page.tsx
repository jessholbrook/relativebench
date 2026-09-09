import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  GitCompareArrows,
} from 'lucide-react';

import exampleSnapshot from '@/data/snapshots/example-transition.json';
import { HomeSectionNav } from '@/components/home-section-nav';

const { experience, compatibility, benchmark_deltas: benchmarkDeltas } = exampleSnapshot;

const navigation = [
  ['What it is', '#what'],
  ["Why it's needed", '#why'],
  ['How it works', '#how'],
  ['Example', '#example'],
  ['Try it', '#rate'],
] as const;

const steps = [
  {
    title: 'Freeze the transition',
    copy: 'Name the incumbent and candidate, lock the task set, and keep the evaluation conditions identical.',
  },
  {
    title: 'Compare blind pairs',
    copy: 'Raters score both responses against the same rubric before seeing the pair or either model identity.',
  },
  {
    title: 'Publish the delta',
    copy: 'Combine benchmark movement, response flips, preference, uncertainty, and protocol provenance in one report.',
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f3f1ec] text-[#171715]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#cbc8c1] bg-[#f3f1ec]/95 px-5 backdrop-blur lg:hidden">
        <a className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em]" href="#what">
          <GitCompareArrows className="size-4 text-brand-coral" />
          RelativeBench
        </a>
        <a className="font-mono text-[10px] uppercase tracking-[0.14em]" href="/rate">
          Try it ↗
        </a>
      </header>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col justify-between border-r border-[#cbc8c1] bg-[#f3f1ec] px-6 py-7 lg:flex">
        <div>
          <a className="flex items-center gap-2.5 font-semibold tracking-[-0.03em]" href="#what">
            <GitCompareArrows className="size-[18px] text-brand-coral" />
            RelativeBench
          </a>
          <p className="mt-3 max-w-[170px] text-xs leading-5 text-[#6e6b66]">
            Measure the relative, perceived difference between models.
          </p>
        </div>

        <HomeSectionNav items={navigation} />

        <div className="space-y-3 font-mono text-[9px] uppercase tracking-[0.13em] text-[#77736d]">
          <a className="flex items-center justify-between border-t border-[#cbc8c1] pt-4 hover:text-[#171715]" href="/demo">
            Full example <ArrowUpRight className="size-3" />
          </a>
          <a
            className="flex items-center justify-between hover:text-[#171715]"
            href="https://github.com/jessholbrook/relativebench"
          >
            GitHub <ArrowUpRight className="size-3" />
          </a>
        </div>
      </aside>

      <div className="lg:ml-60">
        <section id="what" className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16 xl:px-28">
          <div className="mx-auto max-w-[1080px]">
            <div className="pb-8">
              <h1 className="max-w-[1050px] text-balance font-serif text-[clamp(2.25rem,4.5vw,4.5rem)] leading-[1.02] tracking-[-0.045em]">
                Benchmarking the differences people feel.
              </h1>
            </div>

            <div>
              <p className="max-w-[65ch] text-pretty text-lg leading-7 sm:text-xl sm:leading-8">
                RelativeBench compares a new model with the model it replaces. It joins standard
                benchmark deltas with blinded, paired judgments from people who know the incumbent—so
                a release can be understood as a transition, not just a point on a leaderboard.
              </p>
            </div>
          </div>
        </section>

        <section id="why" className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16 xl:px-28">
          <div className="mx-auto max-w-[1080px]">
            <div className="grid gap-8 lg:grid-cols-[180px_1fr]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#77736d]">
                Why it&apos;s needed
              </div>
              <div>
                <h2 className="max-w-5xl text-balance font-serif text-2xl leading-[1.15] tracking-[-0.035em] sm:text-3xl lg:text-4xl">
                  People do not experience a model at a point in time. They experience the move from one model to the next.
                </h2>
                <div className="mt-8 max-w-[65ch] space-y-5 text-lg leading-8 text-[#514e49]">
                  <p>
                    <strong className="bg-brand-coral/20 px-1 font-semibold text-[#171715] [box-decoration-break:clone]">Scores miss direction.</strong>{' '}
                      A stronger average can still conceal task-level regressions that break established workflows.
                  </p>
                  <p>
                    <strong className="bg-brand-coral/20 px-1 font-semibold text-[#171715] [box-decoration-break:clone]">Users have memory.</strong>{' '}
                      People compare every response with habits, expectations, and recovery strategies learned on the incumbent.
                  </p>
                  <p>
                    <strong className="bg-brand-coral/20 px-1 font-semibold text-[#171715] [box-decoration-break:clone]">Change has a shape.</strong>{' '}
                      Better, same, and worse outcomes can coexist. A useful report makes that distribution visible.
                  </p>
                  <p className="text-base">
                    Benchmarks remain useful—but every score depends on what was tested and how.
                    {' '}<a className="underline decoration-brand-coral/50 underline-offset-4 hover:decoration-brand-coral" href="/guide">How benchmarks work, and where they fall short →</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16 xl:px-28">
          <div className="mx-auto max-w-[1080px]">
            <div className="grid gap-8 lg:grid-cols-[180px_1fr]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#77736d]">
                How it works
              </div>
              <div>
                <h2 className="max-w-4xl font-serif text-2xl leading-[1.15] tracking-[-0.035em] sm:text-4xl">
                  Blinded, paired, and reproducible
                </h2>
                <div className="mt-8 max-w-[65ch] space-y-5 text-lg leading-8 text-[#514e49]">
                  {steps.map((step) => (
                    <p key={step.title}>
                      <strong className="bg-brand-coral/20 px-1 font-semibold text-[#171715] [box-decoration-break:clone]">{step.title}.</strong>{' '}
                      {step.copy}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="example" className="bg-[#171715] px-6 py-12 text-white sm:px-12 sm:py-16 lg:px-16 xl:px-28">
          <div className="mx-auto max-w-[1080px]">
            <div className="grid gap-8 lg:grid-cols-[180px_1fr]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#aaa69f]">
                Example
              </div>
              <div>
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aaa69f]">Model A → Model B</p>
                    <h2 className="mt-2 font-serif text-2xl tracking-[-0.035em] sm:text-4xl">Relative changes</h2>
                  </div>
                  <a className="group flex items-center gap-6 text-sm" href="/demo">
                    See the full example <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>

                <p className="mt-5 max-w-3xl font-serif text-xl leading-8 text-[#d1cec8] sm:text-2xl">
                  A transition report reads capability movement alongside the outcomes users actually notice: improvement, continuity, and regression.
                </p>

                <div className="grid gap-8 py-7 2xl:grid-cols-[.8fr_1.2fr] 2xl:gap-10">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aaa69f]">Experience delta</p>
                    <div className="mt-3 flex items-start gap-3">
                      <span className="font-serif text-[7.5rem] leading-none tracking-[-0.08em] text-brand-coral">+{experience.delta}</span>
                      <span className="mt-5 font-mono text-[10px] text-[#aaa69f]">ΔE₀</span>
                    </div>
                    <p className="mt-3 text-sm text-[#aaa69f]">
                      {experience.confidence_interval.level * 100}% interval +{experience.confidence_interval.lower} to +{experience.confidence_interval.upper}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
                      {Object.entries(experience.distribution_percent).map(([label, value]) => (
                        <div key={label}>
                          <strong className="mr-2 text-xl font-medium">{value}%</strong>
                          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#89857e]">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aaa69f]">Benchmark delta</p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#77736d]">percentage points</p>
                    </div>
                    <div className="mt-5 space-y-4">
                      {benchmarkDeltas.map((metric) => (
                        <div key={metric.label} className="grid grid-cols-[116px_1fr_42px] items-center gap-3 text-xs sm:grid-cols-[150px_1fr_44px]">
                          <span className="text-[#d1cec8]">{metric.label}</span>
                          <div className="relative h-px bg-white/20">
                            <span className="absolute left-1/2 top-[-4px] h-[9px] w-px bg-white/35" />
                            <span
                              className={`absolute top-[-2px] h-[5px] ${metric.value >= 0 ? 'left-1/2 bg-brand-coral' : 'right-1/2 bg-[#ef5b48]'}`}
                              style={{ width: `${Math.abs(metric.value) * 5.5}%` }}
                            />
                          </div>
                          <span className={`text-right font-mono ${metric.value >= 0 ? 'text-brand-coral' : 'text-[#ef7a6b]'}`}>
                            {metric.value > 0 ? '+' : ''}{metric.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-7 flex gap-10">
                      <div>
                        <strong className="font-serif text-3xl">{(compatibility.negative_flip_rate * 100).toFixed(1)}%</strong>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#89857e]">negative flips</p>
                      </div>
                      <div>
                        <strong className="font-serif text-3xl">{(compatibility.positive_flip_rate * 100).toFixed(1)}%</strong>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#89857e]">positive flips</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-5 text-[#89857e]">
                  Example report format—not a published benchmark result.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="rate" className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16 xl:px-28">
          <div className="mx-auto max-w-[1080px]">
            <div className="grid gap-8 lg:grid-cols-[180px_1fr]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#77736d]">
                Try it
              </div>
              <div className="grid gap-8 2xl:grid-cols-[.7fr_1.3fr] 2xl:items-center">
                <div>
                  <h2 className="font-serif text-2xl leading-[1.15] tracking-[-0.035em] sm:text-4xl">Try the rater experience</h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-[#5e5b55]">
                    Score each response against a shared rubric, compare the pair only after both scores are locked, and move through the packet without touching the mouse.
                  </p>
                  <a
                    className="group mt-6 inline-flex items-center gap-8 bg-brand-coral px-5 py-4 text-sm font-medium text-white transition-colors hover:bg-[#171715]"
                    href="/rate"
                  >
                    Rate
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
                <a
                  className="group block"
                  href="/rate"
                  aria-label="Open the RelativeBench rater"
                >
                  <Image
                    className="h-auto w-full"
                    src="/rater-preview.gif?v=20260907"
                    alt="Animated preview of the RelativeBench blinded rating workflow"
                    width={960}
                    height={600}
                    unoptimized
                  />
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className="mx-auto flex max-w-[1304px] flex-col justify-between gap-5 px-6 py-5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#77736d] sm:flex-row sm:px-12 lg:px-16 xl:px-28">
          <span>RelativeBench</span>
        </footer>
      </div>
    </main>
  );
}
