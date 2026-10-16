import { RuleTester } from 'oxlint/plugins-dev';

import { noMarketingCopyRule } from '../../../src/rules/no-marketing-copy.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/no-marketing-copy', noMarketingCopyRule, {
  valid: [
    {
      code: 'export function View() { return <p>Run payroll for contractors</p>; }',
    },
    {
      code: "const message = 'unlock powerful internals';",
    },
  ],
  invalid: [
    {
      code: 'export function View() { return <p>Unlock powerful insights</p>; }',
      errors: [{ messageId: 'marketing' }],
    },
    {
      code: 'const copy = { description: `Supercharge payroll` };',
      errors: [{ messageId: 'marketing' }],
    },
  ],
});
