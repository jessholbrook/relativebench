import { pageMetadata } from '@/lib/site-metadata';

// Content adapted for presentation from docs/methodology.md. Keep protocol changes in sync.
export const metadata = pageMetadata('/methodology', 'Methodology | RelativeBench',
  'The RelativeBench protocol: model transitions, capability and compatibility changes, Experience Delta, evaluation procedures, and limits.');
const linkStyle = 'underline decoration-brand-coral/50 underline-offset-4 hover:decoration-brand-coral';

export default function Methodology() {
  return (
    <main className="min-h-screen bg-[#f3f1ec] px-6 py-8 text-[#171715] sm:px-12 sm:py-12">
      <nav aria-label="Methodology navigation" className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-3 text-sm">
        <a className={linkStyle} href="/">← RelativeBench</a>
        <a className={linkStyle} href="/guide">Benchmark guide</a>
        <a className={linkStyle} href="/demo">Example report</a>
        <a className={linkStyle} href="/rate">Try it</a>
      </nav>
      <article className="mx-auto mt-12 max-w-3xl text-base leading-8 text-[#514e49] sm:text-lg">
        <header>
          <h1 className="font-serif text-4xl leading-tight tracking-tight text-[#171715] sm:text-5xl">Methodology</h1>
          <p className="mt-5">How RelativeBench defines a model transition, measures what changes, and keeps comparisons fair.</p>
          <p className="mt-3 text-sm"><a className={linkStyle} href="https://github.com/jessholbrook/relativebench/blob/main/docs/methodology.md">Read the source protocol on GitHub ↗</a></p>
        </header>
        <nav aria-label="Methodology sections" className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a className={linkStyle} href="#purpose">{"Purpose"}</a>
          <a className={linkStyle} href="#separate-tracks">{"Separate tracks"}</a>
          <a className={linkStyle} href="#measurement-layers">{"Measurement layers"}</a>
          <a className={linkStyle} href="#transition-conditions">{"Transition conditions"}</a>
          <a className={linkStyle} href="#evaluator-cohorts">{"Evaluator cohorts"}</a>
          <a className={linkStyle} href="#evaluation-procedure">{"Evaluation procedure"}</a>
          <a className={linkStyle} href="#scenario-sampling">{"Scenario sampling"}</a>
          <a className={linkStyle} href="#execution-controls">{"Execution controls"}</a>
          <a className={linkStyle} href="#bias-controls">{"Bias controls"}</a>
          <a className={linkStyle} href="#claims">{"Claims"}</a>
        </nav>
        <p className="mt-4 text-sm leading-7">Protocol version: <strong>0.1.0</strong><br />Status: <strong>Frozen for the first pilot</strong><br />Last updated in source: <strong>2026-08-28</strong></p>
        <section className="mt-10 scroll-mt-8" aria-labelledby="purpose"><h2 id="purpose" className="font-serif text-2xl sm:text-3xl">{"Purpose"}</h2>
        <p className="mt-4">{"Most leaderboards estimate the capability of a model at one point in time. RelativeBench estimates the change experienced when a person moves from a predecessor to a successor."}</p>
        <p className="mt-4">{"The unit of analysis is a directed and justified transition edge, not a global rank:"}</p>
        <pre className="my-5 overflow-x-auto rounded-md bg-[#e9e6df] p-4 text-sm leading-6"><code>{"Transition(previous_model, new_model, track, execution_profile)"}</code></pre>
        <p className="mt-4">{"A release date alone does not define a transition. The catalog must document that users of the predecessor would reasonably be migrated to or choose the successor."}</p>
        </section>
        <section className="mt-10 scroll-mt-8" aria-labelledby="separate-tracks"><h2 id="separate-tracks" className="font-serif text-2xl sm:text-3xl">{"Separate tracks"}</h2>
        <p className="mt-4">{"RelativeBench never combines these tracks in one score:"}</p>
        <ul className="mt-4 list-disc space-y-2 pl-6"><li><strong className="font-semibold text-[#171715]">{"Model Core:"}</strong>{" immutable API or open-weight model identifiers, a controlled system instruction, and a fixed tool envelope."}</li><li><strong className="font-semibold text-[#171715]">{"Product Experience:"}</strong>{" the complete user-facing surface, including system behavior, tools, memory, search, latency, and interface constraints."}</li></ul>
        <p className="mt-4">{"Every result records its track and execution profile. Product Experience results may be more representative but are less reproducible."}</p>
        </section>
        <section className="mt-10 scroll-mt-8" aria-labelledby="measurement-layers"><h2 id="measurement-layers" className="font-serif text-2xl sm:text-3xl">{"Measurement layers"}</h2>
        <h3 className="mt-6 text-xl font-semibold">{"Capability delta"}</h3>
        <p className="mt-4">{"Standard benchmark scores are shown as a vector of benchmark-specific differences. RelativeBench does not average unrelated benchmarks into a universal capability number."}</p>
        <p className="mt-4">{"For benchmark "}<code className="break-words font-mono text-[0.9em]">{"b"}</code>{":"}</p>
        <pre className="my-5 overflow-x-auto rounded-md bg-[#e9e6df] p-4 text-sm leading-6"><code>{"capability_delta_b = score_new_b - score_previous_b"}</code></pre>
        <p className="mt-4">{"The benchmark version, prompt template, scoring implementation, and execution settings are part of the result."}</p>
        <h3 className="mt-6 text-xl font-semibold">{"Compatibility delta"}</h3>
        <p className="mt-4">{"The same scorable item is executed against both models. Each pair falls into one cell:"}</p>
        <div className="my-5 overflow-x-auto"><table className="w-full text-left text-base"><thead><tr><th scope="col" className="px-3 py-2 font-semibold">{"Previous"}</th><th scope="col" className="px-3 py-2 font-semibold">{"New"}</th><th scope="col" className="px-3 py-2 font-semibold">{"Interpretation"}</th></tr></thead><tbody><tr><td className="px-3 py-2 align-top">{"pass"}</td><td className="px-3 py-2 align-top">{"pass"}</td><td className="px-3 py-2 align-top">{"stable success"}</td></tr><tr><td className="px-3 py-2 align-top">{"pass"}</td><td className="px-3 py-2 align-top">{"fail"}</td><td className="px-3 py-2 align-top">{"negative flip"}</td></tr><tr><td className="px-3 py-2 align-top">{"fail"}</td><td className="px-3 py-2 align-top">{"pass"}</td><td className="px-3 py-2 align-top">{"positive flip"}</td></tr><tr><td className="px-3 py-2 align-top">{"fail"}</td><td className="px-3 py-2 align-top">{"fail"}</td><td className="px-3 py-2 align-top">{"stable failure"}</td></tr></tbody></table></div>
        <p className="mt-4">{"The principal compatibility measures are:"}</p>
        <pre className="my-5 overflow-x-auto rounded-md bg-[#e9e6df] p-4 text-sm leading-6"><code>{"negative_flip_rate = negative_flips / previous_passes\npositive_flip_rate = positive_flips / previous_failures"}</code></pre>
        <p className="mt-4">{"Conditional rates are reported with their denominators. When a denominator is zero, the corresponding rate is undefined rather than zero."}</p>
        <h3 className="mt-6 text-xl font-semibold">{"Experience Delta (ΔE)"}</h3>
        <p className="mt-4">{"After pointwise assessment, a human evaluator gives one paired transition judgment:"}</p>
        <div className="my-5 overflow-x-auto"><table className="w-full text-left text-base"><thead><tr><th scope="col" className="px-3 py-2 font-semibold">{"Rating"}</th><th scope="col" className="px-3 py-2 font-semibold">{"Meaning"}</th></tr></thead><tbody><tr><td className="px-3 py-2 align-top">{"-2"}</td><td className="px-3 py-2 align-top">{"new is much worse"}</td></tr><tr><td className="px-3 py-2 align-top">{"-1"}</td><td className="px-3 py-2 align-top">{"new is slightly worse"}</td></tr><tr><td className="px-3 py-2 align-top">{"0"}</td><td className="px-3 py-2 align-top">{"meaningfully indistinguishable"}</td></tr><tr><td className="px-3 py-2 align-top">{"+1"}</td><td className="px-3 py-2 align-top">{"new is slightly better"}</td></tr><tr><td className="px-3 py-2 align-top">{"+2"}</td><td className="px-3 py-2 align-top">{"new is much better"}</td></tr></tbody></table></div>
        <p className="mt-4">{"With non-negative preregistered weights "}<code className="break-words font-mono text-[0.9em]">{"w_i"}</code>{":"}</p>
        <pre className="my-5 overflow-x-auto rounded-md bg-[#e9e6df] p-4 text-sm leading-6"><code>{"ΔE = 100 * sum(w_i * rating_i / 2) / sum(w_i)"}</code></pre>
        <p className="mt-4">{"ΔE ranges from -100 to +100. A zero means no net perceived directional change in the sampled task and evaluator population; it does not prove that the models behave identically."}</p>
        <p className="mt-4">{"Supporting measures:"}</p>
        <pre className="my-5 overflow-x-auto rounded-md bg-[#e9e6df] p-4 text-sm leading-6"><code>{"preference_lift = 100 * (P(rating > 0) - P(rating < 0))\nnoticeability = P(rating != 0)\nstrong_regression_rate = P(rating == -2)"}</code></pre>
        <p className="mt-4">{"The full five-bin response distribution and uncertainty interval accompany every ΔE."}</p>
        </section>
        <section className="mt-10 scroll-mt-8" aria-labelledby="transition-conditions"><h2 id="transition-conditions" className="font-serif text-2xl sm:text-3xl">{"Transition conditions"}</h2>
        <p className="mt-4">{"Each condition is a separate estimand."}</p>
        <h3 className="mt-6 text-xl font-semibold">{"Frozen workflow (ΔE₀)"}</h3>
        <p className="mt-4">{"Prompts, conversation state, and task procedures developed for the predecessor are applied unchanged. This estimates immediate upgrade experience."}</p>
        <h3 className="mt-6 text-xl font-semibold">{"Adapted workflow (ΔE*)"}</h3>
        <p className="mt-4">{"The workflow may be optimized separately for each model under a symmetric time and information budget. This estimates relative attainable performance."}</p>
        <h3 className="mt-6 text-xl font-semibold">{"Learned transition (ΔEₜ)"}</h3>
        <p className="mt-4">{"Incumbent users work with the successor for a preregistered period and repeat matched tasks. The first pilot uses seven days and denotes the result ΔE₇."}</p>
        <p className="mt-4">{"Derived descriptive measures are:"}</p>
        <pre className="my-5 overflow-x-auto rounded-md bg-[#e9e6df] p-4 text-sm leading-6"><code>{"migration_friction = ΔE* - ΔE₀\nlearning_recovery = ΔE₇ - ΔE₀"}</code></pre>
        <p className="mt-4">{"These are reported descriptively until repeated studies establish their reliability."}</p>
        </section>
        <section className="mt-10 scroll-mt-8" aria-labelledby="evaluator-cohorts"><h2 id="evaluator-cohorts" className="font-serif text-2xl sm:text-3xl">{"Evaluator cohorts"}</h2>
        <p className="mt-4">{"Results are stratified by cohort:"}</p>
        <ul className="mt-4 list-disc space-y-2 pl-6"><li><strong className="font-semibold text-[#171715]">{"Incumbent:"}</strong>{" used the predecessor at least weekly during the preceding four weeks."}</li><li><strong className="font-semibold text-[#171715]">{"Fresh:"}</strong>{" no more than incidental predecessor use during the preceding four weeks."}</li><li><strong className="font-semibold text-[#171715]">{"Domain expert:"}</strong>{" passes a task-domain qualification defined before collection."}</li><li><strong className="font-semibold text-[#171715]">{"Automated judge:"}</strong>{" used only as a separately labeled secondary analysis after calibration against humans."}</li></ul>
        <p className="mt-4">{"The headline ΔE for a release transition uses the incumbent cohort. Exposure is self-reported in the first pilot and must be described as such."}</p>
        </section>
        <section className="mt-10 scroll-mt-8" aria-labelledby="evaluation-procedure"><h2 id="evaluation-procedure" className="font-serif text-2xl sm:text-3xl">{"Evaluation procedure"}</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6"><li>{"Assign a task using a preregistered, seeded randomization schedule."}</li><li>{"Generate or retrieve responses under the transition execution profile."}</li><li>{"Blind model identity and randomize left/right order."}</li><li>{"Ask the evaluator to score each response independently against a task-specific rubric."}</li><li>{"Reveal both responses together and collect the five-level transition judgment."}</li><li>{"Collect optional reason tags only after the primary judgment."}</li><li>{"Record timing, order, display characteristics, and evaluator cohort."}</li></ol>
        <p className="mt-4">{"The protocol preserves ties. Objective correctness and perceived preference are separate measurements: a preference must never be used as an objective pass/fail score. The candidate rater asks for perceived usefulness even on objective tasks, with indistinguishable available when there is no meaningful difference. This clarification and the "}<a className={linkStyle} href="https://github.com/jessholbrook/relativebench/blob/main/docs/objective-scoring.md">{"candidate correctness rules"}</a>{" require explicit protocol review before primary collection; they do not retroactively validate existing rehearsal ratings."}</p>
        </section>
        <section className="mt-10 scroll-mt-8" aria-labelledby="scenario-sampling"><h2 id="scenario-sampling" className="font-serif text-2xl sm:text-3xl">{"Scenario sampling"}</h2>
        <p className="mt-4">{"The first pilot uses a frozen manifest with six intended categories:"}</p>
        <ul className="mt-4 list-disc space-y-2 pl-6"><li>{"reasoning and analysis"}</li><li>{"coding and debugging"}</li><li>{"instruction following"}</li><li>{"structured output"}</li><li>{"factual synthesis"}</li><li>{"safety and appropriate refusal"}</li></ul>
        <p className="mt-4">{"Each scenario records its source, license, category, difficulty, required capabilities, scoring mode, and privacy class. Scenario weights are frozen before model responses are inspected."}</p>
        <p className="mt-4">{"Repeated generations share a scenario cluster in uncertainty estimation. Rephrasings of one underlying task are not treated as independent tasks."}</p>
        </section>
        <section className="mt-10 scroll-mt-8" aria-labelledby="execution-controls"><h2 id="execution-controls" className="font-serif text-2xl sm:text-3xl">{"Execution controls"}</h2>
        <p className="mt-4">{"Every run records:"}</p>
        <ul className="mt-4 list-disc space-y-2 pl-6"><li>{"immutable provider and model identifiers"}</li><li>{"collection timestamp"}</li><li>{"system instruction hash"}</li><li>{"tool and retrieval configuration"}</li><li>{"temperature, seed when supported, and token limits"}</li><li>{"input and output token counts"}</li><li>{"latency and cost metadata when available"}</li><li>{"raw response artifact hash"}</li><li>{"benchmark and protocol versions"}</li></ul>
        <p className="mt-4">{"Unavailable predecessor models are not silently approximated. Previously archived outputs may be used only when their execution profile is complete and the limitation is disclosed."}</p>
        </section>
        <section className="mt-10 scroll-mt-8" aria-labelledby="bias-controls"><h2 id="bias-controls" className="font-serif text-2xl sm:text-3xl">{"Bias controls"}</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6"><li>{"Left/right order is balanced within scenario and cohort."}</li><li>{"Pointwise scoring occurs before paired preference."}</li><li>{"Response length and formatting features are retained for sensitivity analysis."}</li><li>{"Duplicate evaluators and implausibly fast sessions are flagged using preregistered rules."}</li><li>{"Benchmark authors and maintainers do not inspect held-out pilot items before execution."}</li><li>{"Automated judging is tested for order reversal consistency and human agreement."}</li></ul>
        </section>
        <section className="mt-10 scroll-mt-8" aria-labelledby="claims"><h2 id="claims" className="font-serif text-2xl sm:text-3xl">{"Claims"}</h2>
        <p className="mt-4">{"RelativeBench estimates change for a defined transition, task distribution, execution profile, and evaluator population. It does not establish universal model quality or a causal effect of architecture changes. Public summaries must link to the corresponding result manifest and protocol version."}</p>
        </section>
      </article>
    </main>
  );
}
