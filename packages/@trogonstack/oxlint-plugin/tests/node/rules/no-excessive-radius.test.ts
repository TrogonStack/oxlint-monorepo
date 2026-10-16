import { RuleTester } from 'oxlint/plugins-dev';

import { noExcessiveRadiusRule } from '../../../src/rules/no-excessive-radius.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/no-excessive-radius', noExcessiveRadiusRule, {
  valid: [
    'export function View() { return <button className="rounded-full">Save</button>; }',
    'export function View() { return <section style={{ borderRadius: 16 }} />; }',
    {
      name: 'maxRadiusPx option raises the limit',
      code: 'export function View() { return <section className="rounded-[40px]" />; }',
      options: [{ maxRadiusPx: 48 }],
    },
  ],
  invalid: [
    {
      code: 'export function View() { return <section className="rounded-[40px]" />; }',
      errors: [{ messageId: 'excessiveRadius' }],
    },
    {
      code: "export function View() { return <section style={{ borderRadius: '2rem' }} />; }",
      errors: [{ messageId: 'excessiveRadius' }],
    },
    {
      code: 'export function View() { return <section className="rounded-[20px]" />; }',
      options: [{ maxRadiusPx: 16 }],
      errors: [{ messageId: 'excessiveRadius' }],
    },
  ],
});
