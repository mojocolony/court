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
  expect(rule('.schedule-head,\n.match')).toContain('110px 168px minmax(420px, 1fr) 190px');
});

test('desktop navigation and schedule typography are readable at full scale', () => {
  expect(rule('.wordmark')).toContain('font-size: 14px');
  expect(rule('.top-nav')).toContain('font-size: 15px');
  expect(rule('.players')).toContain('font-size: 21px');
  expect(rule('.match-time')).toContain('font-size: 13px');
  expect(rule('.match-round')).toContain('font-size: 13px');
});

test('text size control is rendered as a restrained control', () => {
  expect(rule('.quiet-button')).toContain('border: 1px solid var(--rule)');
  expect(rule('.quiet-button')).toContain('padding: 7px 10px');
});
