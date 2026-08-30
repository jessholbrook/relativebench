import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  GitCompareArrows,
  Keyboard,
  ShieldCheck,
} from 'lucide-react';

import exampleSnapshot from '@/data/snapshots/example-transition.json';

const { experience, compatibility, benchmark_deltas: benchmarkDeltas } = exampleSnapshot;

const navigation = [
  ['What it is', '#what'],
  ['Why now', '#why'],
  ['How it works', '#how'],
  ['Example', '#example'],
  ['Rate', '#rate'],
] as const;

const steps = [
  {
    number: '01',
    title: 'Freeze the transition',
    copy: 'Name the incumbent and candidate, lock the task set, and keep the evaluation conditions identical.',
  },
  {
    number: '02',
    title: 'Compare blind pairs',
    copy: 'Raters score both responses against the same rubric before seeing the pair or either model identity.',
  },
  {
    number: '03',
    title: 'Publish the delta',
    copy: 'Combine benchmark movement, response flips, preference, uncertainty, and protocol provenance in one report.',
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f3f1ec] text-[#171715]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#cbc8c1] bg-[#f3f1ec]/95 px-5 backdrop-blur lg:hidden">
        <a className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em]" href="#what">
          <GitCompareArrows className="size-4 text-[#e34c3b]" />
          RelativeBench
        </a>
        <Link className="font-mono text-[10px] uppercase tracking-[0.14em]" href="/rate">
          Start rating ↗
        </Link>
      </header>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col justify-between border-r border-[#cbc8c1] bg-[#f3f1ec] px-6 py-7 lg:flex">
        <div>
          <a className="flex items-center gap-2.5 font-semibold tracking-[-0.03em]" href="#what">
            <GitCompareArrows className="size-[18px] text-[#e34c3b]" />
            RelativeBench
          </a>
          <p className="mt-3 max-w-[170px] text-xs leading-5 text-[#6e6b66]">
            Measure the model transition, not just the model.
          </p>
        </div>

        <nav className="space-y-3" aria-label="On this page">
          {navigation.map(([label, href]) => (
            <a
              key={href}
              className="block text-[13px] text-[#6e6b66] transition-colors hover:text-[#171715]"
              href={href}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="space-y-3 font-mono text-[9px] uppercase tracking-[0.13em] text-[#77736d]">
          <Link className="flex items-center justify-between border-t border-[#cbc8c1] pt-4 hover:text-[#171715]" href="/demo">
            Full example <ArrowUpRight className="size-3" />
          </Link>
          <a
            className="flex items-center justify-between hover:text-[#171715]"
            href="https://github.com/jessholbrook/relativebench"
          >
            GitHub <ArrowUpRight className="size-3" />
          </a>
        </div>
      </aside>

      <div className="lg:ml-60">
        <section id="what" className="min-h-[calc(100vh-3.5rem)] border-b border-[#cbc8c1] px-5 py-16 sm:px-10 sm:py-20 lg:min-h-screen lg:px-14 xl:px-20">
          <div className="flex h-full min-h-[620px] max-w-[1240px] flex-col justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#77736d]">
              Model transition intelligence
            </div>

            <div className="py-16 lg:py-24">
              <h1 className="max-w-[1050px] text-balance font-serif text-[clamp(2.75rem,6.5vw,6.5rem)] leading-[0.92] tracking-[-0.055em]">
                A benchmark for the difference people feel.
              </h1>
            </div>

            <div className="grid gap-8 border-t border-[#cbc8c1] pt-7 md:grid-cols-[1.35fr_.65fr]">
              <p className="max-w-3xl text-pretty text-lg leading-7 sm:text-xl sm:leading-8">
                RelativeBench compares a new model with the model it replaces. It joins standard
                benchmark deltas with blinded, paired judgments from people who know the incumbent—so
                a release can be understood as a transition, not just a point on a leaderboard.
              </p>
              <div className="flex items-end md:justify-end">
                <a
                  className="group inline-flex items-center gap-7 bg-[#171715] px-5 py-4 text-sm font-medium text-white transition-colors hover:bg-[#e34c3b]"
                  href="#why"
                >
                  Why it matters
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="border-b border-[#cbc8c1] px-5 py-16 sm:px-10 sm:py-24 lg:px-14 xl:px-20">
          <div className="max-w-[1240px]">
            <div className="grid gap-10 lg:grid-cols-[180px_1fr]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#77736d]">
                Why it is needed
              </div>
              <div>
                <h2 className="max-w-5xl text-balance font-serif text-4xl leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                  People do not experience a model at a point in time. They experience the move from one model to the next.
                </h2>
                <div className="mt-16 grid gap-px border border-[#cbc8c1] bg-[#cbc8c1] md:grid-cols-3">
                  <article className="bg-[#f3f1ec] p-6 sm:p-8">
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#e34c3b]">Scores miss direction</p>
                    <p className="mt-8 text-base leading-7 text-[#514e49]">
                      A stronger average can still conceal task-level regressions that break established workflows.
                    </p>
                  </article>
                  <article className="bg-[#f3f1ec] p-6 sm:p-8">
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#e34c3b]">Users have memory</p>
                    <p className="mt-8 text-base leading-7 text-[#514e49]">
                      People compare every response with habits, expectations, and recovery strategies learned on the incumbent.
                    </p>
                  </article>
                  <article className="bg-[#f3f1ec] p-6 sm:p-8">
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#e34c3b]">Change has a shape</p>
                    <p className="mt-8 text-base leading-7 text-[#514e49]">
                      Better, same, and worse outcomes can coexist. A useful report makes that distribution visible.
                    </p>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="border-b border-[#cbc8c1] px-5 py-16 sm:px-10 sm:py-24 lg:px-14 xl:px-20">
          <div className="max-w-[1240px]">
            <div className="grid gap-10 lg:grid-cols-[180px_1fr]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#77736d]">
                How it works
              </div>
              <div>
                <h2 className="max-w-4xl font-serif text-4xl leading-none tracking-[-0.045em] sm:text-6xl">
                  One protocol. Three views of change.
                </h2>
                <div className="mt-14 grid border-t border-[#171715] md:grid-cols-3">
                  {steps.map((step) => (
                    <article key={step.number} className="border-b border-[#cbc8c1] py-7 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
                      <span className="font-mono text-[10px] text-[#e34c3b]">{step.number}</span>
                      <h3 className="mt-10 text-xl font-medium tracking-[-0.03em]">{step.title}</h3>
                      <p className="mt-4 text-sm leading-6 text-[#625f59]">{step.copy}</p>
                    </article>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[9px] uppercase tracking-[0.13em] text-[#77736d]">
                  <span className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-[#171715]" /> blinded</span>
                  <span className="flex items-center gap-2"><GitCompareArrows className="size-3.5 text-[#171715]" /> paired</span>
                  <span className="flex items-center gap-2"><Keyboard className="size-3.5 text-[#171715]" /> reproducible</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="example" className="border-b border-[#cbc8c1] bg-[#171715] px-5 py-16 text-white sm:px-10 sm:py-24 lg:px-14 xl:px-20">
          <div className="max-w-[1240px]">
            <div className="grid gap-10 lg:grid-cols-[180px_1fr]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#aaa69f]">
                Example
              </div>
              <div>
                <div className="flex flex-col justify-between gap-7 border-b border-white/25 pb-8 md:flex-row md:items-end">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aaa69f]">Model A → Model B</p>
                    <h2 className="mt-3 font-serif text-4xl tracking-[-0.045em] sm:text-6xl">Read the transition.</h2>
                  </div>
                  <Link className="group flex items-center gap-6 text-sm" href="/demo">
                    See the full example <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>

                <div className="grid gap-10 py-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#aaa69f]">Experience delta</p>
                    <div className="mt-3 flex items-start gap-3">
                      <span className="font-serif text-[7.5rem] leading-none tracking-[-0.08em] text-[#d9ff72]">+{experience.delta}</span>
                      <span className="mt-5 font-mono text-[10px] text-[#aaa69f]">ΔE₀</span>
                    </div>
                    <p className="mt-3 text-sm text-[#aaa69f]">
                      {experience.confidence_interval.level * 100}% interval +{experience.confidence_interval.lower} to +{experience.confidence_interval.upper}
                    </p>
                    <div className="mt-10 grid grid-cols-3 border-y border-white/20 py-5">
                      {Object.entries(experience.distribution_percent).map(([label, value]) => (
                        <div key={label}>
                          <strong className="block text-2xl font-medium">{value}%</strong>
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
                    <div className="mt-7 space-y-5">
                      {benchmarkDeltas.map((metric) => (
                        <div key={metric.label} className="grid grid-cols-[116px_1fr_42px] items-center gap-3 text-xs sm:grid-cols-[150px_1fr_44px]">
                          <span className="text-[#d1cec8]">{metric.label}</span>
                          <div className="relative h-px bg-white/20">
                            <span className="absolute left-1/2 top-[-4px] h-[9px] w-px bg-white/35" />
                            <span
                              className={`absolute top-[-2px] h-[5px] ${metric.value >= 0 ? 'left-1/2 bg-[#d9ff72]' : 'right-1/2 bg-[#ef5b48]'}`}
                              style={{ width: `${Math.abs(metric.value) * 5.5}%` }}
                            />
                          </div>
                          <span className={`text-right font-mono ${metric.value >= 0 ? 'text-[#d9ff72]' : 'text-[#ef7a6b]'}`}>
                            {metric.value > 0 ? '+' : ''}{metric.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-10 grid grid-cols-2 gap-px bg-white/20">
                      <div className="bg-[#171715] py-5 pr-5">
                        <strong className="font-serif text-3xl">{(compatibility.negative_flip_rate * 100).toFixed(1)}%</strong>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#89857e]">negative flips</p>
                      </div>
                      <div className="bg-[#171715] py-5 pl-5">
                        <strong className="font-serif text-3xl">{(compatibility.positive_flip_rate * 100).toFixed(1)}%</strong>
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#89857e]">positive flips</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="border-t border-white/20 pt-5 text-xs leading-5 text-[#89857e]">
                  Example report format—not a published benchmark result.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="rate" className="px-5 py-16 sm:px-10 sm:py-24 lg:px-14 xl:px-20">
          <div className="max-w-[1240px]">
            <div className="grid gap-10 lg:grid-cols-[180px_1fr]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#77736d]">
                Rater experience
              </div>
              <div className="grid gap-10 xl:grid-cols-[.7fr_1.3fr] xl:items-center">
                <div>
                  <h2 className="font-serif text-4xl leading-none tracking-[-0.045em] sm:text-6xl">Try the blind workflow.</h2>
                  <p className="mt-6 max-w-xl text-base leading-7 text-[#5e5b55]">
                    Score each response against a shared rubric, compare the pair only after both scores are locked, and move through the packet without touching the mouse.
                  </p>
                  <Link
                    className="group mt-9 inline-flex items-center gap-8 bg-[#e34c3b] px-5 py-4 text-sm font-medium text-white transition-colors hover:bg-[#171715]"
                    href="/rate"
                  >
                    Open the rater
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#77736d]">
                    Keys 1–3 choose · B goes back · E exports
                  </p>
                </div>
                <Link
                  className="group block border border-[#bbb7b0] bg-[#e9e6df] p-2 transition-colors hover:border-[#171715]"
                  href="/rate"
                  aria-label="Open the RelativeBench rater"
                >
                  <Image
                    className="h-auto w-full"
                    src="/rater-preview.gif"
                    alt="Animated preview of the RelativeBench blinded rating workflow"
                    width={640}
                    height={360}
                    unoptimized
                  />
                  <div className="flex items-center justify-between px-2 pb-1 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#77736d]">
                    <span>Actual rater workflow</span>
                    <span className="flex items-center gap-2 text-[#171715]">Open <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-5 border-t border-[#cbc8c1] px-5 py-7 font-mono text-[9px] uppercase tracking-[0.12em] text-[#77736d] sm:flex-row sm:px-10 lg:px-14 xl:px-20">
          <span>RelativeBench · An open protocol for model transitions</span>
          <div className="flex gap-6">
            <Link className="hover:text-[#171715]" href="/demo">Example report</Link>
            <Link className="hover:text-[#171715]" href="/rate">Rater</Link>
            <a className="hover:text-[#171715]" href="https://github.com/jessholbrook/relativebench">GitHub</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
