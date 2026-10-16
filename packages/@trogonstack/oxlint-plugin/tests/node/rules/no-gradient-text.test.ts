import { RuleTester } from 'oxlint/plugins-dev';

import { noGradientTextRule } from '../../../src/rules/no-gradient-text.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/no-gradient-text', noGradientTextRule, {
  valid: [
    'export function View() { return <h1 className="text-brand">Revenue</h1>; }',
    "export function View() { return <h1 style={{ color: '#234' }}>Revenue</h1>; }",
    "export function View() { return <h1 className={hero ? 'bg-gradient-to-r from-red-500 to-blue-500' : 'bg-clip-text text-transparent'}>Revenue</h1>; }",
  ],
  invalid: [
    {
      code: 'export function View() { return <h1 className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">Revenue</h1>; }',
      errors: [{ messageId: 'gradientText' }],
    },
    {
      code: "export function View() { return <h1 style={{ backgroundImage: 'linear-gradient(red, blue)', backgroundClip: 'text' }}>Revenue</h1>; }",
      errors: [{ messageId: 'gradientText' }],
    },
  ],
});
