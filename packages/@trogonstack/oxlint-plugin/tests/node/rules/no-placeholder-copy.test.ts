import { RuleTester } from 'oxlint/plugins-dev';

import { noPlaceholderCopyRule } from '../../../src/rules/no-placeholder-copy.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/no-placeholder-copy', noPlaceholderCopyRule, {
  valid: [
    {
      code: "const label = 'todo';",
    },
    {
      code: "const copy = { [title]: 'Coming soon' };",
    },
    {
      code: 'export function View() { return <input className="placeholder:text-muted" />; }',
    },
    {
      code: 'const copy = { internal: `Coming soon` };',
    },
    {
      code: "export function View() { return <input className={'placeholder:text-muted'} />; }",
    },
    {
      code: "const copy = { 'placeholder': 'Search projects' };",
    },
  ],
  invalid: [
    {
      code: "const copy = { ['title']: 'Coming soon' };",
      errors: [{ messageId: 'placeholder' }],
    },
    {
      code: 'export function View() { return <p>Coming soon</p>; }',
      errors: [{ messageId: 'placeholder' }],
    },
    {
      code: 'export function View() { return <input placeholder="Coming soon" />; }',
      errors: [{ messageId: 'placeholder' }],
    },
    {
      code: 'const copy = { emptyMessage: `TBD` };',
      errors: [{ messageId: 'placeholder' }],
    },
    {
      code: "const copy = { title: 'Lorem ipsum dashboard' };",
      errors: [{ messageId: 'placeholder' }],
    },
    {
      code: "export function View() { return <input placeholder={'Coming soon'} />; }",
      errors: [{ messageId: 'placeholder' }],
    },
    {
      code: 'export function View() { return <input placeholder={`Coming soon`} />; }',
      errors: [{ messageId: 'placeholder' }],
    },
    {
      code: "export function View() { return <p>{'Lorem ipsum'}</p>; }",
      errors: [{ messageId: 'placeholder' }],
    },
    {
      code: 'export function View() { return <p>{`Coming soon`}</p>; }',
      errors: [{ messageId: 'placeholder' }],
    },
  ],
});
