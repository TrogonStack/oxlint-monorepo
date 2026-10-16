import { RuleTester } from 'oxlint/plugins-dev';

import { noNestedCardsRule } from '../../../src/rules/no-nested-cards.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/no-nested-cards', noNestedCardsRule, {
  valid: [
    'export function View() { return <Card><div className="md:panel [mask-type:luminance]" /></Card>; }',
    'export function View() { return <Card><section>Details</section></Card>; }',
    'export function View() { return <div className="panel"><div className="card">Details</div></div>; }',
    'export function View() { return <><Card>One</Card><Card>Two</Card></>; }',
    'export function View() { return <Card>{items.map((item) => <Card key={item}>{item}</Card>)}</Card>; }',
    'export function View() { return <Card>{render(() => <Card />)}</Card>; }',
    'export function View() { return <Card>{cond ? <section /> : null}</Card>; }',
  ],
  invalid: [
    {
      code: 'export function View() { return <Card><div className="md:card" /></Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card><div className="dark:md:card-surface" /></Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card><div className="[&>*]:card" /></Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card><div className="!card" /></Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card><div className="card!" /></Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <div className="card"><div className="card">Nested</div></div>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card><MetricCard /></Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card><><MetricCard /></></Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card>{cond && <Card />}</Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card>{cond ? <Card /> : null}</Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card>{cond ? null : <Card />}</Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card>{value ?? <Card />}</Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card>{value || <Card />}</Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card>{(cond && (<Card />))}</Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card>{(cond && <Card />) as JSX.Element}</Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
    {
      code: 'export function View() { return <Card>{cond && <section><><Card /></></section>}</Card>; }',
      errors: [{ messageId: 'nestedCard' }],
    },
  ],
});
