/** Section tops are viewport-relative and ordered as they appear in the article. */
export function activeSection(
  sections: readonly { id: string; top: number }[],
  viewportHeight: number,
  scrollY: number,
  documentHeight: number,
): string | undefined {
  if (sections.length === 0) return undefined;
  // A short final section may never reach the reading line before scrolling ends.
  if (scrollY > 0 && scrollY + viewportHeight >= documentHeight - 2) {
    return sections[sections.length - 1].id;
  }
  const readingLine = Math.min(160, viewportHeight * 0.25);
  let current = sections[0].id;
  for (const section of sections) {
    if (section.top > readingLine) break;
    current = section.id;
  }
  return current;
}
