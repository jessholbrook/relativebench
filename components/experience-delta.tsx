'use client';

import { useId, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Outcome = 'better' | 'same' | 'worse';
type Experience = {
  delta: number;
  confidence_interval: { level: number; lower: number; upper: number };
  distribution_percent: Record<Outcome, number>;
  rating_distribution_percent: Record<string, number>;
};

const outcomes = [
  { key: 'better', color: 'bg-lime-400', ink: 'text-lime-900', tint: 'bg-lime-100', description: 'Users perceived an improvement over the model they already use.' },
  { key: 'same', color: 'bg-stone-400', ink: 'text-stone-700', tint: 'bg-stone-100', description: 'Users perceived no meaningful change from the model they already use.' },
  { key: 'worse', color: 'bg-rose-400', ink: 'text-rose-800', tint: 'bg-rose-50', description: 'Users perceived a regression from the model they already use.' },
] as const;

const signed = (value: number) => value > 0 ? `+${value}` : String(value);

export function ExperienceDelta({ experience }: { experience: Experience }) {
  const [selected, setSelected] = useState<Outcome | null>(null);
  const [hovered, setHovered] = useState<Outcome | null>(null);
  const [focused, setFocused] = useState<Outcome | null>(null);
  const detailId = useId();
  const active = hovered ?? focused ?? selected;
  const detail = outcomes.find((outcome) => outcome.key === active);
  const interval = experience.confidence_interval;
  const level = Math.round(interval.level * 100);
  const limit = Math.max(10, Math.ceil(Math.max(Math.abs(interval.lower), Math.abs(interval.upper), Math.abs(experience.delta)) / 10) * 10);
  const x = (value: number) => 20 + ((value + limit) / (2 * limit)) * 260;

  const interactions = (key: Outcome) => ({
    onMouseEnter: () => setHovered(key),
    onMouseLeave: () => setHovered(null),
    onFocus: () => setFocused(key),
    onBlur: () => setFocused(null),
    onClick: () => setSelected(key),
    'aria-pressed': selected === key,
    'aria-describedby': detailId,
  });

  return (
    <Card className="border-0 bg-white text-stone-900 shadow-none ring-1 ring-stone-200">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-xl">Experience Delta</CardTitle>
          <CardDescription className="mt-1 text-base text-stone-600">Perceived change with the previous workflow held fixed</CardDescription>
        </div>
        <Badge className="border-stone-200 bg-stone-50 text-stone-600" variant="outline">Example</Badge>
      </CardHeader>
      <CardContent className="grid gap-6 py-4 md:grid-cols-[.8fr_1.2fr] md:gap-8">
        <div>
          <div className="flex items-start gap-2">
            <span className="text-6xl font-semibold tracking-[-0.07em] text-lime-900">{signed(experience.delta)}</span>
            <span className="mt-3 font-mono text-sm text-stone-500">ΔE₀</span>
          </div>
          <figure className="mt-3">
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- Inline SVG needs a named image role; an img cannot contain the chart geometry. */}
            <svg viewBox="0 0 300 90" className="w-full max-w-sm overflow-visible" role="img" aria-label={`Experience Delta ${signed(experience.delta)}; ${level}% confidence interval ${signed(interval.lower)} to ${signed(interval.upper)}. Zero indicates no change.`}>
              <line x1="20" y1="40" x2="280" y2="40" stroke="#d6d3d1" strokeWidth="1" />
              <rect x={x(-5)} y="29" width={x(5) - x(-5)} height="22" fill="#e34c3b" opacity="0.15" />
              <line x1={x(0)} y1="16" x2={x(0)} y2="57" stroke="#a8a29e" strokeDasharray="3 3" />
              <line x1={x(interval.lower)} y1="40" x2={x(interval.upper)} y2="40" stroke="#4d7c0f" strokeWidth="3" />
              {[interval.lower, interval.upper].map((value) => (
                <g key={value}>
                  <line x1={x(value)} y1="31" x2={x(value)} y2="49" stroke="#4d7c0f" strokeWidth="2" />
                  <text x={x(value)} y="22" textAnchor="middle" fontSize="14" fill="#3f6212">{signed(value)}</text>
                </g>
              ))}
              <circle cx={x(experience.delta)} cy="40" r="5" fill="#365314" />
              {[-limit, 0, limit].map((value) => (
                <text key={value} x={x(value)} y="74" textAnchor="middle" fontSize="14" fill="#57534e">{signed(value)}</text>
              ))}
            </svg>
            <figcaption className="text-sm leading-6 text-stone-600">{level}% confidence interval: {signed(interval.lower)} to {signed(interval.upper)}</figcaption>
          </figure>
          <p className="mt-3 max-w-sm text-sm leading-6 text-stone-600">Shading marks the provisional −5 to +5 importance band. The axis shows a zoomed view; the full ΔE scale runs from −100 to +100. This example interval is illustrative, not calculated from collected ratings.</p>
        </div>

        <div className="min-w-0">
          <fieldset className="flex min-w-0" aria-label="Example outcome distribution">
            {outcomes.map((outcome) => (
              <Button
                key={outcome.key}
                variant="ghost"
                className="group h-11 min-w-0 shrink rounded-none border-0 bg-transparent p-0 hover:bg-transparent focus-visible:z-10"
                style={{ width: `${experience.distribution_percent[outcome.key]}%` }}
                aria-label={`${experience.distribution_percent[outcome.key]}% ${outcome.key}: show details`}
                {...interactions(outcome.key)}
              >
                <span className={`block h-4 w-full transition-all motion-reduce:transition-none ${outcome.color} ${outcome.key === 'better' ? 'rounded-l-full' : outcome.key === 'worse' ? 'rounded-r-full' : ''} ${active === outcome.key ? 'h-6 brightness-95' : active ? 'opacity-50' : ''}`} />
              </Button>
            ))}
          </fieldset>
          <fieldset className="mt-2 grid min-w-0 grid-cols-3 gap-1" aria-label="Explore outcomes">
            {outcomes.map((outcome) => (
              <Button
                key={outcome.key}
                variant="ghost"
                className={`h-auto flex-col items-start gap-1 whitespace-normal px-2 py-3 text-left hover:text-inherit ${outcome.ink} ${active === outcome.key ? outcome.tint : 'bg-transparent'}`}
                aria-label={`${outcome.key}: ${experience.distribution_percent[outcome.key]}%`}
                {...interactions(outcome.key)}
              >
                <strong className="text-2xl">{experience.distribution_percent[outcome.key]}%</strong>
                <span className="text-base font-normal">{outcome.key}</span>
              </Button>
            ))}
          </fieldset>
          <output id={detailId} className="mt-4 block min-h-24 text-sm leading-6 text-stone-600">
            {detail ? <><strong className="font-semibold text-stone-900">{experience.distribution_percent[detail.key]}% {detail.key}.</strong> {detail.description}</> : 'Hover, focus, or tap an outcome to explore what changed.'}
          </output>
        </div>
      </CardContent>
      <div className="px-6 pb-6">
        <h3 className="text-base font-semibold">How strong was the change?</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">The five weighted response groups make up the headline score. “Better” alone doesn’t tell you whether a change was small or substantial.</p>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            ['-2', 'Much worse'], ['-1', 'Slightly worse'], ['0', 'Indistinguishable'],
            ['1', 'Slightly better'], ['2', 'Much better'],
          ].map(([rating, label]) => (
            <div key={rating}>
              <dt className="text-sm text-stone-600">{label}</dt>
              <dd className="mt-1 text-xl font-semibold">{experience.rating_distribution_percent[rating]}%</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm leading-6 text-stone-600">ΔE = 50 × the weighted average rating (−2 to +2). A +11 here isn’t an 11% productivity gain. An interval can’t account for biased tasks or judges. <a href="/guide#uncertainty" className="underline underline-offset-4">How to read uncertainty</a></p>
      </div>
    </Card>
  );
}
