import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to read a benchmark | RelativeBench',
  description: 'What model benchmarks measure, where they fall short, and how to read a model transition without losing sight of uncertainty.',
};

const link = 'underline decoration-brand-coral/50 underline-offset-4 hover:decoration-brand-coral';
const emphasis = 'bg-brand-coral/20 px-1 font-semibold text-[#171715] [box-decoration-break:clone]';

export default function BenchmarkGuide() {
  return (
    <main className="min-h-screen bg-[#f3f1ec] px-6 py-8 text-[#171715] sm:px-12 sm:py-12">
      <nav aria-label="Guide navigation" className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-3 text-sm">
        <a className={link} href="/">← RelativeBench</a>
        <a className={link} href="/demo">Example report</a>
        <a className={link} href="/rate">Try it</a>
      </nav>
      <article className="mx-auto mt-12 max-w-3xl space-y-10 text-base leading-8 sm:text-lg">
        <header>
          <p className="text-sm uppercase tracking-widest text-[#6e6b66]">A reader’s guide</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">What a benchmark can—and cannot—tell you.</h1>
          <p className="mt-6 text-[#514e49]">A benchmark is a repeatable test, not a complete description of a model. The useful question is not simply “Who scored highest?” It is “What was tested, under which conditions, and does that resemble my work?”</p>
        </header>

        <section aria-labelledby="measurement">
          <h2 id="measurement" className="font-serif text-2xl sm:text-3xl">A score starts with choices</h2>
          <p className="mt-4">An evaluation selects tasks, fixes how a model receives them, and applies a scoring rule. A benchmark might check an answer against a key, run tests on code, or ask people to judge an open-ended response. The final score summarizes those observations using a chosen weighting scheme.</p>
          <p className="mt-4"><strong className={emphasis}>The setup is part of the result.</strong> A different prompt, tool allowance, retry budget, model revision, or scoring rule can make two numbers incomparable. Read the model identifiers and evaluation settings alongside the score. A controlled model test is also different from testing a whole product with memory, search, latency, and an interface.</p>
        </section>

        <section aria-labelledby="coverage">
          <h2 id="coverage" className="font-serif text-2xl sm:text-3xl">Good tests still leave things out</h2>
          <p className="mt-4"><strong className={emphasis}>Coverage is not universality.</strong> Success on selected tasks need not transfer to your language, domain, accessibility needs, or multi-step workflow. HELM makes this explicit by examining multiple scenarios and dimensions—including robustness and efficiency—rather than accuracy alone. <a className={link} href="https://arxiv.org/abs/2211.09110">Read the HELM paper.</a></p>
          <p className="mt-4"><strong className={emphasis}>A familiar test can overstate generalization.</strong> If benchmark material appeared in training, performance may partly reflect exposure rather than success on unseen work. Contamination is difficult to establish for opaque training sets; an absence of detected overlap is not proof of independence. <a className={link} href="https://arxiv.org/abs/2310.17623">Research on detecting test-set contamination.</a></p>
          <p className="mt-4"><strong className={emphasis}>Judging introduces another measurement problem.</strong> Human preference is not the same as correctness. Automated judges can also favor answer position, verbosity, or their own style. Pairwise evaluation already exists; RelativeBench does not invent it or make those biases disappear. <a className={link} href="https://arxiv.org/abs/2306.05685">MT-Bench and Chatbot Arena describe these trade-offs.</a></p>
        </section>

        <section aria-labelledby="uncertainty">
          <h2 id="uncertainty" className="font-serif text-2xl sm:text-3xl">Small differences need context</h2>
          <p className="mt-4">Tasks are a sample of possible work, and model outputs can vary between runs. Evaluating both models on the same tasks preserves the pairing when estimating their difference. Repeated judgments on one task are not the same as collecting more independent tasks. <a className={link} href="https://arxiv.org/abs/2411.00640">Adding Error Bars to Evals explains statistical comparison and evaluation planning.</a></p>
          <p className="mt-4"><strong className={emphasis}>Error bars describe sampling uncertainty, not every source of error.</strong> A 95% interval comes from a procedure intended to cover the target quantity in 95% of repeated studies under its assumptions. It does not certify task quality, remove judge bias, or mean that 95% of users will experience that range. An interval crossing zero does not establish equivalence; an interval excluding zero does not establish practical importance.</p>
        </section>

        <section aria-labelledby="transition">
          <h2 id="transition" className="font-serif text-2xl sm:text-3xl">What RelativeBench adds</h2>
          <p className="mt-4">The proposed unit is a directed transition: the model people know → its replacement. Standard benchmark deltas show capability movement. Matched task outcomes show what starts or stops working. Blinded judgments from incumbent users estimate perceived change with their existing workflows held fixed. Adapted workflows and later learning are separate questions, not extra ingredients in the same score.</p>
          <p className="mt-4"><strong className={emphasis}>An average improvement can coexist with broken workflows.</strong> Imagine 100 tasks: the previous model passes 80, the new one passes 85. If 10 earlier successes now fail and 15 earlier failures now pass, the net gain is five percentage points—but the regression rate among earlier successes is 10/80, or 12.5%. The recovery rate among earlier failures is 15/20, or 75%. Different denominators answer different questions.</p>
          <p className="mt-4">Experience Delta maps the five judgments from “much worse” to “much better” onto −2 through +2, takes their preregistered weighted mean, and multiplies by 50. Its range is −100 to +100. This equal-spacing assumption is a modeling choice for an ordinal scale, not a measurement of utility. A +11 delta is not an 11% productivity gain, and zero can hide improvements and regressions that cancel out. Read all five response bins beside it.</p>
        </section>

        <section aria-labelledby="limits">
          <h2 id="limits" className="font-serif text-2xl sm:text-3xl">What remains to be demonstrated</h2>
          <p className="mt-4">RelativeBench currently offers an example report and a rater workflow; it has not collected human preference results. Incumbent exposure, task coverage, blinding, and the relationship between perceived change and real work still need independent review and study. Recognizable response styles can weaken blinding. A fixed workflow may disadvantage a model that needs adaptation, which is why we keep those conditions separate.</p>
          <p className="mt-4">The pilot’s ±5-point importance threshold is provisional. Bootstrap software tests are not a substitute for interval-coverage and sample-size simulations. Safety, privacy, cost, latency, and critical task failures need their own checks; a positive preference score cannot compensate for a failed guardrail. These are limits of the proposed approach, not problems that adding more decimal places will solve.</p>
          <p className="mt-4">Read a report in that order: identify the transition and population, check the settings and evidence, inspect gains alongside regressions, then ask whether the uncertainty supports a change that matters to your work.</p>
          <p className="mt-6"><a className={link} href="/demo">Explore the example report →</a></p>
        </section>
      </article>
    </main>
  );
}
