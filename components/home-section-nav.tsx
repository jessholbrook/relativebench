'use client';

import { useEffect, useState } from 'react';
import { activeSection } from '@/lib/active-section';

export function HomeSectionNav({ items }: { items: readonly (readonly [string, string])[] }) {
  const [activeId, setActiveId] = useState<string>();

  useEffect(() => {
    const sections = items.flatMap(([, href]) => {
      if (!href.startsWith('#')) return [];
      const section = document.getElementById(href.slice(1));
      return section ? [section] : [];
    });
    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      setActiveId(activeSection(
        sections.map((section) => ({ id: section.id, top: section.getBoundingClientRect().top })),
        window.innerHeight,
        window.scrollY,
        document.documentElement.scrollHeight,
      ));
    };
    const scheduleUpdate = () => {
      if (frame === undefined) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('hashchange', scheduleUpdate);
    window.addEventListener('pageshow', scheduleUpdate);
    const observer = new ResizeObserver(scheduleUpdate);
    sections.forEach((section) => observer.observe(section));
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('hashchange', scheduleUpdate);
      window.removeEventListener('pageshow', scheduleUpdate);
    };
  }, [items]);

  return (
    <nav className="space-y-2" aria-label="Site navigation">
      {items.map(([label, href]) => {
        const active = href.startsWith('#') && activeId === href.slice(1);
        return (
          <a
            key={href}
            href={href}
            aria-current={active ? 'location' : undefined}
            className={`block border-l-2 py-1.5 pl-3 text-sm transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#171715] ${active
              ? 'border-brand-coral/40 bg-brand-coral/20 font-semibold text-[#171715]'
              : 'border-transparent text-[#6e6b66] hover:text-[#171715]'}`}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
