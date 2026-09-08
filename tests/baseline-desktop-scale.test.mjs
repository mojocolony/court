import { test, expect } from 'vitest';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../src/styles/layout.css', import.meta.url), 'utf8');

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  return match?.[1] ?? '';
}

test('desktop Baseline uses the approved wider editorial canvas', () => {
  expect(rule('.shell')).toContain('1540px');
  expect(rule('.schedule-head,\n.match')).toContain('125px 160px minmax(520px, 1fr) 220px');
});

test('desktop navigation and schedule typography are readable at full scale', () => {
  expect(rule('.wordmark')).toContain('font-size: 16px');
  expect(rule('.top-nav')).toContain('font-size: 17px');
  expect(rule('.players')).toContain('font-size: 22px');
  expect(rule('.match-time')).toContain('font-size: 15px');
  expect(rule('.match-round')).toContain('font-size: 16px');
});

test('text size control is rendered as a restrained control', () => {
  expect(rule('.quiet-button')).toContain('border: 1px solid var(--rule)');
  expect(rule('.quiet-button')).toContain('padding: 8px 11px');
});


test('desktop base labels are no longer microtype', () => {
  expect(rule('.segmented button')).toContain('font-size: 16px');
  expect(rule('.eyebrow,\n.round-label')).toContain('font-size: 13px');
  expect(rule('.schedule-head')).toContain('font-size: 11px');
  expect(rule('.date-rail button span')).toContain('font-size: 12px');
  expect(rule('.feed-status')).toContain('font-size: 12px');
});

test('desktop competitors use the horizontal match column', () => {
  expect(rule('.players')).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
});
