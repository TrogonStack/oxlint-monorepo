import { RuleTester } from 'oxlint/plugins-dev';

import { noSideStripeAccentRule } from '../../../src/rules/no-side-stripe-accent.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/no-side-stripe-accent', noSideStripeAccentRule, {
  valid: [
    'export function View() { return <div className="md:border-l" />; }',
    'export function View() { return <div className="hover:border-l-0" />; }',
    'export function View() { return <aside className="border-l border-slate-300" />; }',
    "export function View() { return <aside style={{ borderLeft: '1px solid red' }} />; }",
  ],
  invalid: [
    {
      code: 'export function View() { return <div className="dark:md:border-l-4" />; }',
      errors: [{ messageId: 'sideStripe' }],
    },
    {
      code: 'export function View() { return <div className="hover:border-r-2" />; }',
      errors: [{ messageId: 'sideStripe' }],
    },
    {
      code: 'export function View() { return <div className="!border-l-4" />; }',
      errors: [{ messageId: 'sideStripe' }],
    },
    {
      code: 'export function View() { return <div className="border-l-4!" />; }',
      errors: [{ messageId: 'sideStripe' }],
    },
    {
      code: 'export function View() { return <div className="md:border-l-4!" />; }',
      errors: [{ messageId: 'sideStripe' }],
    },
    {
      code: 'export function View() { return <div className="[&>*]:border-l-4" />; }',
      errors: [{ messageId: 'sideStripe' }],
    },
    {
      code: 'export function View() { return <div className="md:border-l-[4px]" />; }',
      errors: [{ messageId: 'sideStripe' }],
    },
    {
      code: 'export function View() { return <aside className="border-l-4 border-red-500" />; }',
      errors: [{ messageId: 'sideStripe' }],
    },
    {
      code: 'export function View() { return <aside style={{ borderLeftWidth: 6 }} />; }',
      errors: [{ messageId: 'sideStripe' }],
    },
  ],
});
