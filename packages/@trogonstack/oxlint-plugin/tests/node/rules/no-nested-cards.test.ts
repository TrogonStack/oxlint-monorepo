import { RuleTester } from 'oxlint/plugins-dev';

import { noNestedCardsRule } from '../../../src/rules/no-nested-cards.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/no-nested-cards', noNestedCardsRule, {
  valid: [
    'export function View() { return <Card><section>Details</section></Card>; }',
    'export function View() { return <div className="panel"><div className="card">Details</div></div>; }',
  ],
  invalid: [
    {
      code: 'export function View() { return <div className="card"><div className="card">Nested</div></div>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card><MetricCard /></Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
  ],
});
