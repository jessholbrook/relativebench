'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import detailExamples from '@/data/snapshots/example-benchmark-details.json';

type Metric = { label: string; value: number; unit: string };
const signed = (value: number) => value > 0 ? `+${value}` : String(value);
const benchmarks = detailExamples.benchmarks;
const limit = Math.ceil(Math.max(...Object.values(benchmarks).flatMap(({ lower, upper }) => [Math.abs(lower), Math.abs(upper)])) / 5) * 5;
const position = (value: number) => `${((value + limit) / (2 * limit)) * 100}%`;

export function BenchmarkDeltas({ metrics }: { metrics: Metric[] }) {
  return (
    <div>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">Example 95% confidence intervals and selected task comparisons. These illustrate the report format, not estimates from collected runs.</p>
      <Accordion multiple className="grid items-start gap-4 md:grid-cols-2">
        {metrics.map((metric) => {
          const details = benchmarks[metric.label as keyof typeof benchmarks];
          if (!details) return null;
          const positive = metric.value >= 0;
          const crossesZero = details.lower <= 0 && details.upper >= 0;
          return (
            <AccordionItem key={metric.label} value={metric.label} className="min-w-0 rounded-xl border-0 bg-card ring-1 ring-border not-last:border-b-0">
              <AccordionTrigger className="items-center gap-3 px-5 py-4 hover:bg-muted/40 hover:no-underline" aria-label={`${metric.label}: ${signed(metric.value)} percentage points. Toggle task differences`}>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold">{metric.label}</span>
                  <span className="mt-1 block text-sm font-normal text-muted-foreground">Task differences</span>
                </span>
                <span className={`font-mono text-lg font-semibold ${positive ? 'text-teal-700 dark:text-teal-300' : 'text-rose-700 dark:text-rose-300'}`}>{signed(metric.value)}</span>
              </AccordionTrigger>
              <div className="px-5 pb-5">
                {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- This CSS-rendered interval is one named graphic, not an external image. */}
                <div role="img" aria-label={`${metric.label}: ${signed(metric.value)} percentage points; example 95% confidence interval ${signed(details.lower)} to ${signed(details.upper)}.`} className="relative mx-2 h-10">
                  <span className="absolute top-1/2 h-px w-full bg-border" />
                  <span className="absolute left-1/2 top-1 h-8 border-l border-dashed border-muted-foreground/60" />
                  <span className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-full ${positive ? 'bg-teal-100' : 'bg-rose-100'}`} style={{ left: position(Math.min(0, metric.value)), width: `${Math.abs(metric.value) / (2 * limit) * 100}%` }} />
                  <span className={`absolute top-1/2 h-0.5 -translate-y-1/2 ${positive ? 'bg-teal-700' : 'bg-rose-700'}`} style={{ left: position(details.lower), width: `${(details.upper - details.lower) / (2 * limit) * 100}%` }} />
                  {[details.lower, details.upper].map((bound) => <span key={bound} className={`absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 ${positive ? 'bg-teal-700' : 'bg-rose-700'}`} style={{ left: position(bound) }} />)}
                  <span className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${positive ? 'bg-teal-700' : 'bg-rose-700'}`} style={{ left: position(metric.value) }} />
                </div>
                <div aria-hidden="true" className="flex justify-between text-xs text-muted-foreground"><span>{-limit}</span><span>0</span><span>+{limit} pp</span></div>
                <p className="mt-3 text-sm text-muted-foreground">95% interval: {signed(details.lower)} to {signed(details.upper)} pp{crossesZero ? ' · includes no change' : ''}</p>
              </div>
              <AccordionContent className="h-auto px-5 pb-5">
                <p className="text-sm leading-6 text-muted-foreground">Selected example tasks—not the full scoring set behind the category average.</p>
                <ul className="space-y-5">
                  {details.tasks.map((task) => {
                    const outcome = task.before.pass === task.after.pass ? 'Unchanged' : task.after.pass ? 'Improved' : 'Regressed';
                    return (
                      <li key={task.id}>
                        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-base font-semibold">{task.title}</h3>
                          <span className={`text-sm font-medium ${outcome === 'Improved' ? 'text-teal-700 dark:text-teal-300' : outcome === 'Regressed' ? 'text-rose-700 dark:text-rose-300' : 'text-muted-foreground'}`}>{outcome}</span>
                        </div>
                        <dl className="space-y-2 text-sm leading-6">
                          <div><dt className="inline font-semibold">Model A · {task.before.pass ? 'Passed' : 'Failed'}: </dt><dd className="inline text-muted-foreground">{task.before.detail}</dd></div>
                          <div><dt className="inline font-semibold">Model B · {task.after.pass ? 'Passed' : 'Failed'}: </dt><dd className="inline text-muted-foreground">{task.after.detail}</dd></div>
                        </dl>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
