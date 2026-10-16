import { RuleTester } from 'oxlint/plugins-dev';

import { noHiddenRevealDefaultRule } from '../../../src/rules/no-hidden-reveal-default.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/no-hidden-reveal-default', noHiddenRevealDefaultRule, {
  valid: [
    'export function View() { return <section className="hover:opacity-0 transition-opacity">Visible</section>; }',
    'export function View() { return <section className="md:invisible motion-safe:transition">Visible</section>; }',
    'export function View() { return <section className="opacity-0">Draft</section>; }',
    'export function View() { return <section className="opacity-100 transition-opacity">Visible</section>; }',
    "export function View() { return <section className={cn('opacity-100', isOpen && 'transition-opacity')}>Visible</section>; }",
    "export function View() { return <section className={hidden ? 'opacity-0' : 'transition-opacity'}>Visible</section>; }",
    "export function View() { return <section className={cx({ 'opacity-0': false, 'transition-opacity': true })}>Visible</section>; }",
    "export function View() { return <section className={cn(false && 'opacity-0', 'transition-opacity')}>Visible</section>; }",
    "const css = 'opacity: 0.5; transition: opacity .2s';",
    'const css = `opacity: 0.05; animation: fade 1s`;',
  ],
  invalid: [
    {
      code: "const css = 'opacity: 0; transition: opacity .2s';",
      errors: [{ messageId: 'hiddenReveal' }],
    },
    {
      code: "const css = 'opacity:0.0;animation: fade 1s';",
      errors: [{ messageId: 'hiddenReveal' }],
    },
    {
      code: 'export function View() { return <section className="!opacity-0 transition-opacity">Hidden</section>; }',
      errors: [{ messageId: 'hiddenReveal' }],
    },
    {
      code: 'export function View() { return <section className="invisible! motion-safe:animate-fade-in">Hidden</section>; }',
      errors: [{ messageId: 'hiddenReveal' }],
    },
    {
      code: 'export function View() { return <section className="opacity-0 transition-opacity">Hidden</section>; }',
      errors: [{ messageId: 'hiddenReveal' }],
    },
    {
      code: "export function View() { return <section style={{ opacity: 0, transition: 'opacity .2s' }}>Hidden</section>; }",
      errors: [{ messageId: 'hiddenReveal' }],
    },
    {
      code: "export function View() { return <section className={cn('opacity-0', isOpen && 'transition-opacity')}>Hidden</section>; }",
      errors: [{ messageId: 'hiddenReveal' }],
    },
    {
      code: "export function View() { return <section className={clsx(['opacity-0', 'transition-opacity'])}>Hidden</section>; }",
      errors: [{ messageId: 'hiddenReveal' }],
    },
    {
      code: "export function View() { return <section className={cx({ 'opacity-0': true, 'transition-opacity': isOpen })}>Hidden</section>; }",
      errors: [{ messageId: 'hiddenReveal' }],
    },
  ],
});
