import { RuleTester } from 'oxlint/plugins-dev';

import { requireReducedMotionRule } from '../../../src/rules/require-reduced-motion.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/require-reduced-motion', requireReducedMotionRule, {
  valid: [
    'export function View() { return <button className="[&>*]:transition-opacity [&>*]:motion-reduce:transition-none">Save</button>; }',
    'export function View() { return <button className="[mask-type:luminance] bg-[url(http://x)]">Save</button>; }',
    'export function View() { return <button className="px-3">Save</button>; }',
    'export function View() { return <button className="transition-colors motion-reduce:transition-none">Save</button>; }',
    "const css = '.item { transition: opacity .2s; } @media (prefers-reduced-motion: reduce) { .item { transition: none } }';",
    "const css = '.item { animation: fade-in .2s ease-out; } @media (prefers-reduced-motion: reduce) { .item { animation: none } }';",
    "const css = '.item { animation: spin 1s !important; } @media (prefers-reduced-motion: reduce) { .item { animation: none !important; } }';",
    "const css = '.item > .child { animation: spin 1s } @media (prefers-reduced-motion: reduce) { .item>.child { animation:none } }';",
    "const css = '@media screen { .item { animation: spin 1s } } @media screen and (prefers-reduced-motion: reduce) { .item { animation: none } }';",
    "const css = '@media (min-width: 640px) { .item { animation: spin 1s } } @media (min-width:640px) and (prefers-reduced-motion: reduce) { .item { animation: none } }';",
    "const css = '@media screen { .item { animation: spin 1s } } @media screen/**/and (prefers-reduced-motion: reduce) { .item { animation: none } }';",
    "const css = '@layer reset { .x { color:red } } .item { animation:spin 1s } @media (prefers-reduced-motion: reduce) { .item { animation:none } }';",
    "const css = '@media (prefers-reduced-motion: no-preference) { .item { transition: opacity .2s; } }';",
    'export function View() { return <button className="motion-safe:animate-pulse">Save</button>; }',
    'export function View() { return <button className="hover:transition-transform motion-reduce:hover:transition-none">Save</button>; }',
    'export function View() { return <button className="animate-none transition-none">Save</button>; }',
    'export function View() { return <button className="animate-spin motion-reduce:animate-none">Save</button>; }',
    'export function View() { return <button className="animate-none! transition-none!">Save</button>; }',
    'export function View() { return <button className="animate-spin! motion-reduce:animate-none!">Save</button>; }',
    "export function View() { return <button style={{ animation: 'none', animationName: 'none', transition: 'none' }}>Save</button>; }",
    'export function View() { return <button style={{ animation: null, animationName: false, transition: 0 }}>Save</button>; }',
    "const css = '.thing { --animation: fade; }';",
    "const css = '.thing { /* animation: spin 1s; */ color: red; }';",
    'const css = `.item::before { content: "foo animation: spin 1s"; }`;',
    'const css = `.item { content: "}"; animation: spin 1s; } @media (prefers-reduced-motion: reduce) { .item { animation:none } }`;',
    'const css = `.item { animation: spin 1s; } @media (prefers-reduced-motion: reduce) { .item { content: "@scope"; animation:none } }`;',
    "import { useReducedMotion } from 'framer-motion';\nexport function View() { const reduced = useReducedMotion(); return <button className={reduced ? '' : 'animate-pulse'}>Save</button>; }",
  ],
  invalid: [
    {
      code: 'export function View() { return <button className="[&>*]:transition-opacity">Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button className="animate-spin! bg-[url(http://x)]">Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button className="[&:hover]:md:transition-all">Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button className="transition-opacity">Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '.item { animation: fade-in .2s ease-out; }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button className="hover:transition-transform">Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button className="md:animate-spin">Load</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'const note = \'motion-reduce: is a Tailwind variant\';\nexport function View() { return <button className="transition-opacity">Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <div><p className="transition-colors motion-reduce:transition-none">Safe</p><p className="animate-pulse">Unsafe</p></div>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button className="animate-spin motion-reduce:transition-none">Load</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button className="transition-opacity motion-reduce:animate-none">Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { * { animation: none } } .item { transition: opacity .2s; }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { * { color: red } } .item { animation: fade-in .2s ease-out; }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '.thing { animation: none, spin 1s linear infinite; }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .other { animation: none; } } .thing { animation: fade 1s; }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .thing { animation: none; } } .thing, .other { animation: spin 1s; }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { * { animation: none; } } .thing { animation: spin 1s; }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .item { animation: none; } } .item { animation: spin 1s; }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .item { animation: spin 1s; } }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: reduce) { .item { animation: none; } .item { animation: spin 1s; } }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '.item { animation: spin 1s !important; } @media (prefers-reduced-motion: reduce) { .item { animation: none; } }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@media not all and (prefers-reduced-motion: no-preference) { .item { transition: opacity .2s; } }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: no-preference), (min-width: 10000px) { .item { transition: opacity .2s; } }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@media (prefers-reduced-motion: no-preference) or (prefers-reduced-motion: reduce) { .item { animation: spin 1s } }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '.item { animation: spin 1s } @media (prefers-reduced-motion: reduce) { @media (prefers-reduced-motion: no-preference) { .item { animation:none } } }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@layer base, components; @layer components { .item { animation: spin 1s; } } @layer base { @media (prefers-reduced-motion: reduce) { .item { animation:none; } } }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '.foo { & .item { animation:spin 1s } } @media (prefers-reduced-motion: reduce) { .bar { & .item { animation:none } } }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '.item { animation:spin 1s } @media (prefers-reduced-motion: reduce) { .outside { .item { animation:none } } }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '.item { animation:spin 1s } @media (prefers-reduced-motion: reduce) { @scope (.scoped) { .item { animation:none } } }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "const css = '@layer { .item { animation:spin 1s !important } } @media (prefers-reduced-motion: reduce) { .item { animation:none !important } }';",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'const css = `.item { animation: spin 1s; } @media (prefers-reduced-motion: reduce) { .item { content: "foo animation: none "; } }`;',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'const css = `.item { content: "@media print {"; animation: spin 1s; }`;',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'const css = `.item { content: "/*"; animation: spin 1s; content: "*/"; }`;',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'const css = \'.x { content: "\\\\\\\\"; } .item { animation: spin 1s; }\';',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button className="hover:transition-transform motion-reduce:transition-none">Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button className="motion-reduce:animate-spin">Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button className="!animate-spin">Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button className="animate-spin! motion-reduce:animate-none">Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button className="first:hover:animate-spin motion-reduce:hover:first:animate-none">Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: "export function View() { return <button className={reduced ? 'motion-reduce:transition-none' : 'transition-opacity'}>Save</button>; }",
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button style={({ animation: "spin 1s" } as unknown)}>Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
    {
      code: 'export function View() { return <button style={{ animation: ("spin 1s" as const) }}>Save</button>; }',
      errors: [{ messageId: 'reducedMotion' }],
    },
  ],
});
