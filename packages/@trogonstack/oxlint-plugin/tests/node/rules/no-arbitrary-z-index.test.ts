import { RuleTester } from 'oxlint/plugins-dev';

import { noArbitraryZIndexRule } from '../../../src/rules/no-arbitrary-z-index.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

const error = { messageId: 'arbitraryZIndex' };

tester.run('trogonstack/no-arbitrary-z-index', noArbitraryZIndexRule, {
  valid: [
    'export function View() { return <div className="md:z-10" />; }',
    'export function View() { return <div className="hover:z-[50]" />; }',
    'export function View() { return <div className="[&>*]:z-20" />; }',
    'export function View() { return <div className="z-50" />; }',
    'export function View() { return <div style={{ zIndex: 20 }} />; }',
    "export function View() { return <div className={cn('fixed', false && 'z-[9999]')} />; }",
    "export function View() { return <div className={false ? 'z-[9999]' : 'z-50'} />; }",
    "export function View() { return <div className={undefined && 'z-[9999]'} />; }",
    "export function View() { return <div className={void 0 && 'z-[9999]'} />; }",
    "export function View() { return <div className={'z-50' || 'z-[9999]'} />; }",
    'export function View() { return <div className={`z-[${layer}]`} />; }',
    {
      name: 'maxZIndex option raises the limit',
      code: 'export function View() { return <div style={{ zIndex: 5000 }} />; }',
      options: [{ maxZIndex: 9999 }],
    },
  ],
  invalid: [
    {
      code: 'export function View() { return <div className="md:z-[9999]" />; }',
      errors: [{ messageId: 'arbitraryZIndex' }],
    },
    {
      code: 'export function View() { return <div className="hover:focus:z-[9999]" />; }',
      errors: [{ messageId: 'arbitraryZIndex' }],
    },
    {
      code: 'export function View() { return <div className="!z-[9999]" />; }',
      errors: [{ messageId: 'arbitraryZIndex' }],
    },
    {
      code: 'export function View() { return <div className="z-[9999]!" />; }',
      errors: [{ messageId: 'arbitraryZIndex' }],
    },
    {
      code: 'export function View() { return <div className="md:!z-[9999]" />; }',
      errors: [{ messageId: 'arbitraryZIndex' }],
    },
    {
      code: 'export function View() { return <div className="md:z-[9999]!" />; }',
      errors: [{ messageId: 'arbitraryZIndex' }],
    },
    {
      code: 'export function View() { return <div className="[&>*]:z-[9999]" />; }',
      errors: [{ messageId: 'arbitraryZIndex' }],
    },
    {
      code: 'export function View() { return <div className="[&:not(:first-child)]:md:z-[9999]" />; }',
      errors: [{ messageId: 'arbitraryZIndex' }],
    },
    {
      code: 'export function View() { return <div className="md:z-9999" />; }',
      errors: [{ messageId: 'arbitraryZIndex' }],
    },
    { code: 'export function View() { return <div className="z-[9999]" />; }', errors: [error] },
    {
      code: 'export function View() { return <div style={{ zIndex: 1000 }} />; }',
      errors: [error],
    },
    {
      code: "export function View() { return <div className={cn('fixed', open && 'z-[9999]')} />; }",
      errors: [error],
    },
    {
      code: "export function View() { return <div className={cn('fixed', open ? 'z-[9999]' : 'z-50')} />; }",
      errors: [error],
    },
    {
      code: "export function View() { return <div className={clsx({ a: one, b: two, c: three, d: four, e: five, f: six, 'z-[9999]': seven })} />; }",
      errors: [error],
    },
    {
      code: 'export function View() { return <div className={`fixed z-[9999] ${extra}`} />; }',
      errors: [error],
    },
    {
      code: 'export function View() { return <div style={{ zIndex: 120 }} />; }',
      options: [{ maxZIndex: 100 }],
      errors: [error],
    },
  ],
});
