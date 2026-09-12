import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { stimulusDigest } from '../lib/rating-packet-identity';

const sourcePacket = JSON.parse(await readFile(new URL('../public/rating/internal-rating-packet.json', import.meta.url), 'utf8'));
const packet = {
  ...sourcePacket,
  forms: sourcePacket.forms.map((form: { assignments: unknown[] }) => ({ ...form, assignments: form.assignments.slice(0, 2) })),
};
const pairIds = new Set(packet.forms[0].assignments.map((row: { pair_id: string }) => row.pair_id));
packet.pairs = packet.pairs.filter((row: { pair_id: string }) => pairIds.has(row.pair_id));
// Every test runs in a new isolated browser context. No user's saved sessions,
// real participant answers, or live production endpoint are touched.
test.beforeEach(async ({ page }) => {
  await page.route('**/rating/internal-rating-packet.json', route => route.fulfill({ json: packet }));
});

function codeFor(form: 'form-a' | 'form-b') {
  for (let i = 0; ; i++) {
    const code = `automated-fixture-not-human-${i}`;
    const parity = createHash('sha256').update(code).digest()[0] % 2;
    if ((parity === 0) === (form === 'form-a')) return code;
  }
}

async function enter(page: Page, form: 'form-a' | 'form-b' = 'form-a') {
  await page.goto('/rate');
  await page.getByLabel('Reviewer code').fill(codeFor(form));
  await page.getByRole('button', { name: /Enter rating workspace/ }).click();
}

async function storage(page: Page) {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find(key => key.startsWith('relativebench:rating:'));
    return key ? JSON.parse(localStorage.getItem(key)!) : null;
  });
}

async function choosePair(page: Page) {
  await expect(page.getByText('Score the left response', { exact: true })).toBeVisible();
  await page.keyboard.press('2');
  await expect(page.getByText('Score the right response', { exact: true })).toBeVisible();
  await page.keyboard.press('3');
  await expect(page.getByRole('button', { name: /Meaningfully indistinguishable/ })).toBeVisible();
  await page.keyboard.press('3');
}

for (const form of ['form-a', 'form-b'] as const) {
  test(`${form}: complete and independently verify all 120 assignments`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.unroute('**/rating/internal-rating-packet.json');
    await enter(page, form);
    for (let index = 0; index < sourcePacket.pairs.length; index++) await choosePair(page);
    await expect(page.getByText('Rating session complete', { exact: true })).toBeVisible();
    const downloadEvent = page.waitForEvent('download');
    await page.keyboard.press('e');
    const downloadPath = (await (await downloadEvent).path())!;
    const result = JSON.parse(execFileSync('python3', ['-m', 'relativebench', 'verify-rating-session',
      'public/rating/internal-rating-packet.json', downloadPath, '--require-complete'],
    { env: { ...process.env, PYTHONPATH: 'evals' }, encoding: 'utf8' }));
    expect(result.valid).toBe(true);
    expect(JSON.parse(await readFile(downloadPath, 'utf8')).completed_assignment_count).toBe(120);
  });

  test(`${form}: keyboard, resume, completion, tags, reopen, and blinded export`, async ({ page }) => {
    await enter(page, form);
    await expect(page.getByText(form, { exact: true })).toBeVisible();
    await choosePair(page);
    await page.keyboard.press('Shift+Digit1');
    await expect.poll(async () => (await storage(page))?.judgments[0]?.reason_tags).toEqual(['Correctness']);
    await page.reload();
    await page.getByLabel('Reviewer code').fill(codeFor(form));
    await page.getByRole('button', { name: /Enter rating workspace/ }).click();
    await expect.poll(async () => (await storage(page))?.currentIndex).toBe(1);
    await choosePair(page);
    await expect(page.getByText('Rating session complete', { exact: true })).toBeVisible();
    await page.keyboard.press('b');
    await expect(page.getByRole('button', { name: /Meaningfully indistinguishable/ })).toBeVisible();
    await page.keyboard.press('4');
    await expect(page.getByRole('table', { name: 'Session ratings with model names hidden' })).toBeVisible();
    const downloadEvent = page.waitForEvent('download');
    await page.keyboard.press('e');
    const download = await downloadEvent;
    const payload = JSON.parse(await readFile((await download.path())!, 'utf8'));
    expect(payload.completed_assignment_count).toBe(2);
    expect(payload.form_id).toBe(form);
    expect(payload.judgments[1].side_preference).toBe(1);
    expect(payload.judgments[0].reason_tags).toEqual(['Correctness']);
    expect(payload.reviewer_code_sha256).toBe(createHash('sha256').update(codeFor(form)).digest('hex'));
    expect(JSON.stringify(payload)).not.toMatch(/model_role|model_id|new_on_left|response_text|automated-fixture/);
    expect(payload.judgments.map((row: { assignment_id: string }) => row.assignment_id)).toEqual(
      packet.forms.find((item: { form_id: string }) => item.form_id === form).assignments.map((row: { assignment_id: string }) => row.assignment_id),
    );
  });
}

test('modified, repeated, composing keys and shortcut guide cannot answer accidentally', async ({ page }) => {
  await enter(page);
  await expect(page.getByText('Score the left response', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    for (const modifiers of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { repeat: true }, { isComposing: true }]) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', code: 'Digit2', bubbles: true, ...modifiers }));
    }
  });
  expect((await storage(page)).stage).toBe('left');
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
  await page.keyboard.press('2');
  expect((await storage(page)).stage).toBe('left');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('storage write failure warns and export still works', async ({ page }) => {
  await page.addInitScript(() => {
    // eslint-disable-next-line typescript/unbound-method -- Retain the native method; invoke below with the original receiver.
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('relativebench:rating:')) throw new DOMException('Quota', 'QuotaExceededError');
      return set.call(this, key, value);
    };
  });
  await enter(page);
  await expect(page.getByRole('alert')).toContainText('could not save your progress');
  await choosePair(page);
  const downloadEvent = page.waitForEvent('download');
  await page.keyboard.press('e');
  const payload = JSON.parse(await readFile((await (await downloadEvent).path())!, 'utf8'));
  expect(payload.judgments).toHaveLength(1);
});

test('storage read failure never starts a writer', async ({ page }) => {
  await page.addInitScript(() => {
    // eslint-disable-next-line typescript/unbound-method -- Fault injection delegates via call(this, key).
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      if (key.startsWith('relativebench:rating:')) throw new DOMException('Blocked', 'SecurityError');
      return get.call(this, key);
    };
  });
  await enter(page);
  await expect(page.getByText(/cannot access saved progress/)).toBeVisible();
  await expect(page.getByLabel('Reviewer code')).toBeEnabled();
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('relativebench:rating:')))).toEqual([]);
});

test('corrupt and mismatched progress is retained verbatim', async ({ page }) => {
  await enter(page);
  await expect.poll(async () => (await storage(page))?.stage).toBe('left');
  for (const invalid of ['{not json', JSON.stringify({ packetId: 'wrong' })]) {
    await page.evaluate(value => {
      const key = Object.keys(localStorage).find(key => key.startsWith('relativebench:rating:'))!;
      localStorage.setItem(key, value);
    }, invalid);
    await page.reload();
    await page.getByLabel('Reviewer code').fill(codeFor('form-a'));
    await page.getByRole('button', { name: /Enter rating workspace/ }).click();
    await expect(page.getByText(/cannot be safely resumed/)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem(Object.keys(localStorage).find(key => key.startsWith('relativebench:rating:'))!))).toBe(invalid);
  }
});

test('failed reset preserves session; cancelled reset never deletes', async ({ page }) => {
  await page.addInitScript(() => {
    // eslint-disable-next-line typescript/unbound-method -- Fault injection delegates via call(this, key).
    const remove = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (key) {
      if (key.startsWith('relativebench:rating:')) throw new DOMException('Blocked', 'SecurityError');
      return remove.call(this, key);
    };
  });
  await enter(page);
  await expect.poll(async () => (await storage(page))?.stage).toBe('left');
  page.once('dialog', dialog => dialog.dismiss());
  await page.keyboard.press('Shift+R');
  expect((await storage(page)).stage).toBe('left');
  page.once('dialog', dialog => dialog.accept());
  await page.keyboard.press('Shift+R');
  await expect(page.getByRole('alert')).toContainText('could not be deleted');
  expect((await storage(page)).stage).toBe('left');
});

test('packet network failure is recoverable', async ({ page }) => {
  await page.route('**/rating/internal-rating-packet.json', route => route.fulfill({ status: 503 }));
  await page.goto('/rate');
  await expect(page.getByText('Rating packet unavailable')).toBeVisible();
  await page.unroute('**/rating/internal-rating-packet.json');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByLabel('Reviewer code')).toBeVisible();
});

test('real navigation, keyboard expansion, and confirmed fixture reset', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href="/guide"]').click();
  await expect(page).toHaveURL(/\/guide$/);
  await page.locator('a[href="/demo"]').first().click();
  await expect(page).toHaveURL(/\/demo$/);
  const reasoning = page.getByRole('button', { name: /^Reasoning:/ });
  await expect(reasoning).toBeEnabled();
  await reasoning.focus();
  await page.keyboard.press('Enter');
  await expect(reasoning).toHaveAttribute('aria-expanded', 'true');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.locator('a[href="/rate"]').last().click();
  await expect(page.getByLabel('Reviewer code')).toBeVisible();
  await page.getByLabel('Reviewer code').fill(codeFor('form-a'));
  await page.getByRole('button', { name: /Enter rating workspace/ }).click();
  await expect.poll(async () => (await storage(page))?.stage).toBe('left');
  page.once('dialog', dialog => dialog.accept());
  await page.keyboard.press('Shift+R');
  await expect(page.getByLabel('Reviewer code')).toBeVisible();
  expect(await storage(page)).toBeNull();
});

test('assigned packet requires explicit activation and matching code, not hash parity', async ({ page }) => {
  // Fabricated two-task fixture in an isolated context, not a study activation.
  const code = codeFor('form-b');
  const assigned = { ...packet, session_type: 'primary_collection', collection_authorized: false,
    form_selector: 'assigned-slot-v1', assigned_reviewer_sha256: createHash('sha256').update(code).digest('hex'),
    forms: [packet.forms[0]] };
  assigned.stimulus_sha256 = await stimulusDigest(assigned);
  await page.route('**/rating/internal-rating-packet.json', route => route.fulfill({ json: assigned }));
  await page.goto('/rate');
  await expect(page.getByText('This assigned session is not open for collection yet.')).toBeVisible();
  assigned.collection_authorized = true;
  await page.reload();
  await page.getByLabel('Reviewer code').fill('wrong-test-code');
  await page.getByRole('button', { name: /Enter rating workspace/ }).click();
  await expect(page.getByText(/does not match the assigned session/)).toBeVisible();
  await page.getByLabel('Reviewer code').fill(code);
  await page.getByRole('button', { name: /Enter rating workspace/ }).click();
  await expect(page.getByText('form-a', { exact: true })).toBeVisible();
  await choosePair(page);
  await expect.poll(async () => (await storage(page))?.currentIndex).toBe(1);
});

test('Back and reopen retain first-pass scores; corrections and stimuli survive export', async ({ page }) => {
  await enter(page);
  await page.keyboard.press('1');
  await expect(page.getByText('Score the right response', { exact: true })).toBeVisible();
  await page.keyboard.press('3');
  await page.keyboard.press('b');
  await page.keyboard.press('b');
  await expect(page.getByText('Score the left response', { exact: true })).toBeVisible();
  await page.keyboard.press('3');
  await page.keyboard.press('2');
  await page.keyboard.press('4');
  const first = (await storage(page)).judgments[0];
  expect(first.pointwise_left).toBe('fails');
  expect(first.pointwise_right).toBe('meets');
  expect(first.assessment_history.final_left).toBe('meets');
  expect(first.assessment_history.final_right).toBe('partially_meets');
  expect(first.assessment_history.revisions).toHaveLength(2);
  await page.keyboard.press('b');
  await page.keyboard.press('b');
  await page.keyboard.press('1');
  await page.keyboard.press('3');
  const revised = (await storage(page)).judgments[0];
  expect(revised.pointwise_right).toBe('meets');
  expect(revised.assessment_history.final_right).toBe('fails');
  expect(revised.assessment_history.revisions).toHaveLength(3);
  const downloadEvent = page.waitForEvent('download');
  await page.keyboard.press('e');
  const payload = JSON.parse(await readFile((await (await downloadEvent).path())!, 'utf8'));
  expect(payload.stimulus_sha256).toBe(await stimulusDigest(packet));
  expect(payload.judgments[0].assessment_history).toEqual(revised.assessment_history);
});

test('multiline references preserve whitespace and changed text cannot restore old progress', async ({ page }) => {
  const changed = structuredClone(packet);
  for (const pair of changed.pairs) pair.rubric = 'line one\nline two\n  indented';
  await page.route('**/rating/internal-rating-packet.json', route => route.fulfill({ json: changed }));
  await enter(page);
  await expect(page.getByTestId('rating-rubric')).toHaveCSS('white-space', 'pre-wrap');
  expect(await page.getByTestId('rating-rubric').textContent()).toBe('line one\nline two\n  indented');
  const saved = await storage(page);
  changed.pairs[0].responses[0].text += '\nA different response';
  await page.reload();
  await page.getByLabel('Reviewer code').fill(codeFor('form-a'));
  await page.getByRole('button', { name: /Enter rating workspace/ }).click();
  await expect(page.getByText(/cannot be safely resumed/)).toBeVisible();
  expect(await storage(page)).toEqual(saved);
});

for (const width of [390, 1440]) {
  test(`routes and active workflow: no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/guide', '/demo', '/rate']) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await enter(page);
    await expect(page.getByText('Score the left response', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

for (const route of ['/', '/guide', '/demo', '/rate']) {
  test(`automated WCAG checks: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    if (route === '/rate') await expect(page.getByLabel('Reviewer code')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('automated WCAG checks: pointwise, paired, completed, shortcuts', async ({ page }) => {
  await enter(page);
  await expect(page.getByText('Score the left response', { exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.keyboard.press('2');
  await expect(page.getByText('Score the right response', { exact: true })).toBeVisible();
  await page.keyboard.press('3');
  await expect(page.getByRole('button', { name: /Meaningfully indistinguishable/ })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.keyboard.press('3');
  await choosePair(page);
  await expect(page.getByText('Rating session complete', { exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.keyboard.press('?');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});
