import { RuleTester } from 'oxlint/plugins-dev';

import { noGenericStatLabelRule } from '../../../src/rules/no-generic-stat-label.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/no-generic-stat-label', noGenericStatLabelRule, {
  valid: [
    {
      code: 'export function View() { return <h2>Failed payments</h2>; }',
    },
    {
      code: 'export function View() { return <h2>{title}</h2>; }',
    },
    {
      code: 'export function View() { return <Metric description="Analytics" />; }',
    },
  ],
  invalid: [
    {
      code: 'export function View() { return <h2>Analytics</h2>; }',
      errors: [{ messageId: 'genericLabel' }],
    },
    {
      code: 'export function View() { return <Metric label="Usage" />; }',
      errors: [{ messageId: 'genericLabel' }],
    },
    {
      code: 'export function View() { return <Metric title={`Overview`} />; }',
      errors: [{ messageId: 'genericLabel' }],
    },
  ],
});
