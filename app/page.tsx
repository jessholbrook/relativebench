import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  GitCompareArrows,
} from 'lucide-react';

import exampleSnapshot from '@/data/snapshots/example-transition.json';
import benchmarkDetails from '@/data/snapshots/example-benchmark-details.json';
import { HomeSectionNav } from '@/components/home-section-nav';

const { experience, compatibility, benchmark_deltas: benchmarkDeltas } = exampleSnapshot;
const benchmarkLimit = Math.ceil(Math.max(...Object.values(benchmarkDetails.benchmarks).flatMap(({ lower, upper }) => [Math.abs(lower), Math.abs(upper)])) / 5) * 5;
const benchmarkPosition = (value: number) => ((value + benchmarkLimit) / (2 * benchmarkLimit)) * 300;
const signed = (value: number) => value > 0 ? `+${value}` : String(value);

const navigation = [
  ['What it is', '#what'],
  ["Why it's needed", '#why'],
  ['How it works', '#how'],
  ['Methodology', '/methodology'],
  ['Example', '#example'],
  ['Try it', '#rate'],
] as const;

const steps = [
  {
    title: 'Set the transition',
    copy: 'Choose the incumbent and candidate releases, the task set, and evaluation conditions.',
  },
  {
    title: 'Compare paired responses',
    copy: 'Raters score both responses against the same rubric before seeing the pair or either model identity.',
  },
  {
    title: 'Review the relative changes',
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
        <nav className="flex items-center gap-4" aria-label="Mobile navigation">
        <a className="text-xs" href="/methodology">Methodology</a>
        <a className="font-mono text-[10px] uppercase tracking-[0.14em]" href="/rate">
          Try it ↗
        </a>
        </nav>
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

        <div className="space-y-3 font-mono text-[9px] uppercase tracking-[0.13em] text-[#6b6761]">
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
                RelativeBench is an additional way to evaluate model progress. It specifically compares a new model with the model it replaces. It joins standard benchmark deltas with paired ratings from people who know the incumbent, with model names hidden—so a release can be understood as a relative transition to the model that came before it, not only as two scores on a benchmark.
              </p>
            </div>
          </div>
        </section>

        <section id="why" className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16 xl:px-28">
          <div className="mx-auto max-w-[1080px]">
            <div className="grid gap-8 lg:grid-cols-[180px_1fr]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b6761]">
                Why it&apos;s needed
              </div>
              <div>
                <h2 className="max-w-5xl text-balance font-serif text-2xl leading-[1.15] tracking-[-0.035em] sm:text-3xl lg:text-4xl">
                  People don&apos;t experience a model as a decontextualized point in time. They experience the move from one model to the next.
                </h2>
                <div className="mt-8 max-w-[65ch] space-y-5 text-lg leading-8 text-[#514e49]">
                  <p>
                    <strong className="bg-brand-coral/20 px-1 font-semibold text-[#171715] [box-decoration-break:clone]">Single scores miss direction.</strong>{' '}
                      A better average score can still hide tasks that got worse and break workflows people rely on.
                  </p>
                  <p>
                    <strong className="bg-brand-coral/20 px-1 font-semibold text-[#171715] [box-decoration-break:clone]">Users have memory.</strong>{' '}
                      People bring habits, expectations, and workarounds they’ve learned from the model they already use.
                  </p>
                  <p>
                    <strong className="bg-brand-coral/20 px-1 font-semibold text-[#171715] [box-decoration-break:clone]">Change has a shape.</strong>{' '}
                      Some things get better, some stay the same, and others get worse. A useful report shows the whole mix.
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
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b6761]">
                How it works
              </div>
              <div>
                <h2 className="max-w-4xl font-serif text-2xl leading-[1.15] tracking-[-0.035em] sm:text-4xl">
                  Model names hidden. Responses paired. Results reproducible.
                </h2>
                <div className="mt-8 max-w-[65ch] space-y-5 text-lg leading-8 text-[#514e49]">
                  {steps.map((step) => (
                    <p key={step.title}>
                      <strong className="bg-brand-coral/20 px-1 font-semibold text-[#171715] [box-decoration-break:clone]">{step.title}.</strong>{' '}
                      {step.copy}
                    </p>
                  ))}
                  <p className="text-base"><a className="underline decoration-brand-coral/50 underline-offset-4 hover:decoration-brand-coral" href="/methodology">Read the full methodology →</a></p>
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
                </div>

                <p className="mt-5 max-w-3xl font-serif text-xl leading-8 text-[#d1cec8] sm:text-2xl">
                  A transition report shows the capability improvements, continuities, and regressions people notice and feel the most from one release to the next.
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
                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#aaa59f]">percentage points</p>
                    </div>
                    <div className="mt-5 space-y-4">
                      {benchmarkDeltas.map((metric) => {
                        const interval = benchmarkDetails.benchmarks[metric.label as keyof typeof benchmarkDetails.benchmarks];
                        const intervalLabel = `${benchmarkDetails.interval_level * 100}% confidence interval: ${signed(interval.lower)} to ${signed(interval.upper)} percentage points`;
                        return (
                        <div key={metric.label} className="grid grid-cols-[116px_1fr_42px] items-center gap-3 text-xs sm:grid-cols-[150px_1fr_44px]">
                          <span className="text-[#d1cec8]">{metric.label}</span>
                          {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- Inline SVG needs a named image role; an img cannot contain chart geometry. */}
                          <svg viewBox="0 0 300 24" preserveAspectRatio="none" className="h-6 w-full overflow-visible" role="img" aria-label={`${metric.label}: ${signed(metric.value)} percentage points. Example ${intervalLabel}.`}>
                            <title>{`Example ${intervalLabel}`}</title>
                            <path d="M0 12H300 M150 3V21" stroke="white" strokeOpacity="0.3" vectorEffect="non-scaling-stroke" />
                            <rect x={benchmarkPosition(Math.min(0, metric.value))} y="9" width={Math.abs(metric.value) / (2 * benchmarkLimit) * 300} height="6" className={metric.value >= 0 ? 'fill-brand-coral' : 'fill-[#ef5b48]'} />
                            <path d={`M${benchmarkPosition(interval.lower)} 12H${benchmarkPosition(interval.upper)} M${benchmarkPosition(interval.lower)} 6V18 M${benchmarkPosition(interval.upper)} 6V18`} stroke="#f3f1ec" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                            <circle cx={benchmarkPosition(metric.value)} cy="12" r="3" fill="#f3f1ec" />
                          </svg>
                          <span className={`text-right font-mono ${metric.value >= 0 ? 'text-brand-coral' : 'text-[#ef7a6b]'}`}>
                            {metric.value > 0 ? '+' : ''}{metric.value}
                          </span>
                        </div>
                      );})}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[#aaa69f]">Whiskers show example {benchmarkDetails.interval_level * 100}% confidence intervals. Shared scale: −{benchmarkLimit} to +{benchmarkLimit} percentage points.</p>
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
                <a
                  className="group mt-6 inline-flex items-center gap-8 bg-brand-coral px-5 py-4 text-sm font-medium text-[#171715] transition-colors hover:bg-[#f3f1ec] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  href="/demo"
                >
                  See the full example
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="rate" className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16 xl:px-28">
          <div className="mx-auto max-w-[1080px]">
            <div className="grid gap-8 lg:grid-cols-[180px_1fr]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b6761]">
                Try it
              </div>
              <div className="grid gap-8 2xl:grid-cols-[.7fr_1.3fr] 2xl:items-center">
                <div>
                  <h2 className="font-serif text-2xl leading-[1.15] tracking-[-0.035em] sm:text-4xl">Try the rater experience</h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-[#5e5b55]">
                    Score each response against a shared rubric, compare the pair only after both scores are locked, and move through the packet without touching the mouse.
                  </p>
                  <a
                    className="group mt-6 inline-flex items-center gap-8 bg-brand-coral px-5 py-4 text-sm font-medium text-[#171715] transition-colors hover:bg-[#171715] hover:text-white"
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
                    alt="Animated preview of the RelativeBench rating workflow with model names hidden"
                    width={960}
                    height={600}
                    unoptimized
                  />
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className="mx-auto flex max-w-[1304px] flex-col justify-between gap-5 px-6 py-5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b6761] sm:flex-row sm:px-12 lg:px-16 xl:px-28">
          <span>RelativeBench</span>
          <a className="text-sm normal-case tracking-normal underline underline-offset-4" href="/privacy">Your data</a>
        </footer>
      </div>
    </main>
  );
}
