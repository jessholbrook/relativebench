import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'From benchmark scores to real-world changes | RelativeBench',
  description: 'How benchmarks turn tasks into scores, why a higher average can hide regressions, and how relative comparisons help explain the experience of switching models.',
};

const link = 'underline decoration-brand-coral/50 underline-offset-4 hover:decoration-brand-coral';
const emphasis = 'bg-brand-coral/20 px-1 font-semibold text-[#171715] [box-decoration-break:clone]';

export default function BenchmarkGuide() {
  return (
    <main className="min-h-screen bg-[#f3f1ec] px-6 py-8 text-[#171715] sm:px-12 sm:py-12">
      <nav aria-label="Guide navigation" className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-3 text-sm">
        <a className={link} href="/">← RelativeBench</a>
        <a className={link} href="/methodology">Methodology</a>
        <a className={link} href="/demo">Example report</a>
        <a className={link} href="/rate">Try it</a>
      </nav>
      <article className="mx-auto mt-12 max-w-3xl space-y-10 text-base leading-8 sm:text-lg">
        <header>
          <p className="text-sm uppercase tracking-widest text-[#6e6b66]">A practical guide</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight sm:text-5xl">A higher score. A better experience?</h1>
          <p className="mt-6 text-[#514e49]">A benchmark score tells you how a model did on a test. If you’re deciding whether to switch models, you need another view too: what gets better, what stays reliable, and what stops working? Let’s walk through how a score is made—and what gets lost when we stop there.</p>
        </header>

        <section aria-labelledby="measurement">
          <h2 id="measurement" className="font-serif text-2xl sm:text-3xl">How a benchmark becomes a score</h2>
          <p className="mt-4"><strong className={emphasis}>Start with tasks and a definition of success.</strong> A benchmark picks a set of questions or jobs and a way to judge the answers. For a factual question, that might mean checking against a reference answer. For code, it might mean running tests. For an open-ended response, people or a model judge might apply a rubric or choose which answer they prefer.</p>
          <p className="mt-4">These aren’t all the same kind of test. <a className={link} href="https://openai.com/index/introducing-simpleqa/">SimpleQA</a> uses a model grader to classify short factual answers as correct, incorrect, or not attempted. <a className={link} href="https://www.swebench.com/SWE-bench/guides/evaluation/">SWE-bench</a> applies generated code patches to repositories and runs their tests. <a className={link} href="https://arxiv.org/abs/2306.05685">MT-Bench and Chatbot Arena</a> explore model-judge ratings and human preferences. A percentage correct and a preference score answer different questions.</p>
          <p className="mt-4"><strong className={emphasis}>Run the tasks under a defined setup.</strong> Choose the model release, prompts, available tools, and limits on tokens and retries. Save the responses, score them using the chosen rules, and record failures or missing outputs instead of quietly dropping them. A model with search and several attempts hasn’t taken the same test as one without tools and with a single attempt.</p>
          <p className="mt-4"><strong className={emphasis}>Summarize the results.</strong> In a simple pass/fail benchmark with equally weighted tasks, the score is passes divided by tasks, multiplied by 100. Other benchmarks use partial credit, different weights, or preference-based rankings. Before comparing two headline numbers, check that the tasks, scoring rules, and execution settings line up.</p>
        </section>

        <section aria-labelledby="example">
          <h2 id="example" className="font-serif text-2xl sm:text-3xl">A simple example: 7 out of 10 becomes 8 out of 10</h2>
          <p className="mt-4">Imagine a small example benchmark with ten tasks: five coding tasks and five tasks that require valid structured output. Each task counts equally. Both models get the same prompts, tools, and attempt budget. These numbers are a worked example, not collected results.</p>
          <p className="mt-4">The previous model passes seven tasks. Its replacement passes eight. That’s <strong className={emphasis}>70% → 80%, a gain of 10 percentage points.</strong> On the headline score, the new release is ahead.</p>
          <p className="mt-4">Now look at the profile. Coding improves from two passes out of five to four. Structured output falls from five out of five to four. The overall gain is real on this test, but it isn’t a gain in every kind of work.</p>
          <p className="mt-4"><strong className={emphasis}>Single scores miss direction.</strong> If you spend your day debugging code, this could be a welcome upgrade. If your workflow depends on reliable structured output, the same release could add work instead of saving it.</p>
        </section>

        <section aria-labelledby="flips">
          <h2 id="flips" className="font-serif text-2xl sm:text-3xl">The flips tell you what changed</h2>
          <p className="mt-4">Keep the old and new result for each task together. In our example, six tasks still pass, two go from fail to pass, one goes from pass to fail, and one still fails. The score moved by one successful task, but <strong className={emphasis}>three tasks changed outcome.</strong></p>
          <p className="mt-4">The two positive flips might be a function that now handles an empty list and a parser that now handles a timezone offset. The negative flip might be a response that used to return only valid JSON but now adds a friendly introduction. A person reading it might not mind. A system expecting JSON could reject the whole response.</p>
          <p className="mt-4">Another replacement could also score eight out of ten by keeping all seven earlier successes and fixing just one failure. Same final score, same average improvement, but no previously working task breaks. That’s a different upgrade.</p>
          <p className="mt-4">To report those changes clearly, use the right starting group: one of seven previous successes regressed, while two of three previous failures recovered. Those rates answer different questions; subtracting them doesn’t give the overall score change. Always show the counts alongside them.</p>
        </section>

        <section aria-labelledby="experience">
          <h2 id="experience" className="font-serif text-2xl sm:text-3xl">People bring their old model with them</h2>
          <p className="mt-4"><strong className={emphasis}>Users have memory.</strong> People don’t start every release from scratch. They bring prompts that work, formats their tools expect, and habits for checking or fixing answers. Losing something dependable can be disruptive even when the replacement does more things well overall.</p>
          <p className="mt-4"><strong className={emphasis}>Change has a shape.</strong> Which tasks change, how often people do them, and how costly a failure is all matter. A gain on an occasional brainstorming task may not offset a regression in a daily reporting workflow. That’s why a task profile and examples of the flips are more useful than an average alone.</p>
          <p className="mt-4">Pass/fail still doesn’t tell the whole story. Two responses can both pass while one is easier to use. A response can also feel polished and helpful while being wrong. Keep correctness and perceived usefulness separate, then look at them together.</p>
        </section>

        <section aria-labelledby="transition">
          <h2 id="transition" className="font-serif text-2xl sm:text-3xl">Compare the transition, not just the totals</h2>
          <p className="mt-4">RelativeBench adds that view to standard benchmarks. Choose a specific current model and replacement, define the tasks and conditions, and run both on matched tasks. Keep the category scores, the individual gains and regressions, and the unchanged outcomes visible.</p>
          <p className="mt-4">Then ask people who know the current model to score each response separately against a rubric. Keep model names hidden and balance which response appears on each side. After those first scores are recorded, show the pair and ask whether the replacement feels much worse, slightly worse, meaningfully the same, slightly better, or much better.</p>
          <p className="mt-4">Experience Delta summarizes those five ratings, but the full distribution stays beside it. A positive average with a group reporting strong regressions tells a different story from a modest improvement almost everyone shares. It’s a measure of reported perceived change—not a percentage improvement in productivity.</p>
          <p className="mt-4"><strong className={emphasis}>Make the comparison look like the decision people face.</strong> Holding existing workflows fixed asks, “What happens if I switch today?” Giving both models a fair adaptation budget asks, “What could I get after changing how I work?” Those are different questions, so we report them separately.</p>
          <p className="mt-4">This is the case for greater real-world relevance: the comparison starts from a model people use and the work they need it to keep doing. That relevance depends on choosing representative tasks, users, and conditions. It isn’t automatic, and RelativeBench still needs participant studies to establish how well its measures track real-world experience.</p>
        </section>

        <section aria-labelledby="uncertainty">
          <h2 id="uncertainty" className="font-serif text-2xl sm:text-3xl">Check how much confidence the evidence deserves</h2>
          <p className="mt-4">Ten tasks make the arithmetic easy to follow, not a strong claim about a model. One task changes that score by ten percentage points. Real evaluations need enough tasks and evaluators, and an uncertainty estimate that respects the matched comparisons and repeated ratings. Repeating one task many times isn’t the same as testing more independent tasks. <a className={link} href="https://arxiv.org/abs/2411.00640">Adding Error Bars to Evals</a> explains how to plan and compare evaluations statistically.</p>
          <p className="mt-4"><strong className={emphasis}>Error bars aren’t a guarantee.</strong> Confidence intervals describe sampling uncertainty under the analysis assumptions. They don’t fix an unrepresentative task set, material the model may have seen in training, or biased judges. An interval crossing zero doesn’t prove the models are equivalent; an interval excluding zero doesn’t prove the difference matters in your work.</p>
          <p className="mt-4">When you read a report, ask: does this task mix resemble my work? Which earlier successes stopped working? Which failures were fixed? Do people familiar with the old model notice the same changes? And are any regressions too costly to accept, even with a better average?</p>
          <p className="mt-4">Benchmarks give us a repeatable starting point. Relative comparisons help us ask the next question: <strong className={emphasis}>better at what, and better for whom?</strong></p>
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-base"><a className={link} href="/demo">Explore the example report →</a><a className={link} href="/methodology">Read the methodology →</a></p>
        </section>
      </article>
    </main>
  );
}
