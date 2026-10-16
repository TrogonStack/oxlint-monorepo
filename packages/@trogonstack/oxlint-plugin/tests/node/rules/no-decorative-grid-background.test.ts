import { RuleTester } from 'oxlint/plugins-dev';

import { noDecorativeGridBackgroundRule } from '../../../src/rules/no-decorative-grid-background.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/no-decorative-grid-background', noDecorativeGridBackgroundRule, {
  valid: [
    'export function View() { return <div className="grid grid-cols-2 gap-4" />; }',
    "const blueprintBackground = 'linear-gradient(#eee, #fff)';",
  ],
  invalid: [
    {
      code: "export function View() { return <div style={{ backgroundImage: 'linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)' }} />; }",
      errors: [{ messageId: 'decorativeGrid' }],
    },
    {
      code: 'const background = `linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)`;',
      errors: [{ messageId: 'decorativeGrid' }],
    },
  ],
});
