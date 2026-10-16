import { RuleTester } from 'oxlint/plugins-dev';

import { requireImportLocalityRule } from '../../../src/rules/require-import-locality.ts';

const tester = new RuleTester({
  cwd: '/repo',
  languageOptions: { parserOptions: { lang: 'tsx' } },
});
const cart = '/repo/src/app/cart/page.tsx';

function useRelative(suggestion: string) {
  return { messageId: 'useRelative', data: { suggestion } };
}

tester.run('trogonstack/require-import-locality', requireImportLocalityRule, {
  valid: [
    { code: "import { a } from './a';", filename: cart },
    { code: "import { a } from './_components/a';", filename: cart },
    { code: "import { a } from '../_components/a';", filename: cart },
    { code: "import { a } from '@/components/a';", filename: cart },
    { code: "import { a } from '@/app/checkout/a';", filename: cart },
    { code: "import { a } from '@/app/cart-summary/a';", filename: cart },
    { code: "import { a } from '@/app/a';", filename: cart },
    { code: "import { a } from 'react';", filename: cart },
    { code: "import { a } from '@/app/cart/a';", filename: '/repo/lib/a.ts' },
    { code: "import { a } from '~/app/cart/a';", filename: cart },
    { code: "export { a } from '@/components/a';", filename: cart },
    { code: 'const a = await import(name);', filename: cart },
    { code: "import { a } from '@/app/cart';", filename: '/repo/src/lib/page.tsx' },
  ],
  invalid: [
    {
      code: "import { a } from '@/app/cart/a';",
      filename: cart,
      output: "import { a } from './a';",
      errors: [useRelative('./a')],
    },
    {
      code: 'import { a } from "@/app/cart/_components/a";',
      filename: cart,
      output: 'import { a } from "./_components/a";',
      errors: [useRelative('./_components/a')],
    },
    {
      code: "export { a } from '@/app/cart/a';",
      filename: cart,
      output: "export { a } from './a';",
      errors: [useRelative('./a')],
    },
    {
      code: "export * from '@/app/cart/a';",
      filename: cart,
      output: "export * from './a';",
      errors: [useRelative('./a')],
    },
    {
      code: "const a = await import('@/app/cart/a');",
      filename: cart,
      output: "const a = await import('./a');",
      errors: [useRelative('./a')],
    },
    {
      code: "import { a } from '@/app/cart/a';",
      filename: '/repo/apps/web/src/app/cart/page.tsx',
      output: "import { a } from './a';",
      errors: [useRelative('./a')],
    },
    {
      code: "import { a } from '@/components/a';",
      filename: '/repo/src/page.tsx',
      output: "import { a } from './components/a';",
      errors: [useRelative('./components/a')],
    },
    {
      code: "import { a } from '~/app/cart/a';",
      filename: cart,
      settings: { trogonstack: { sourceAliases: ['~/'] } },
      output: "import { a } from './a';",
      errors: [useRelative('./a')],
    },
    {
      code: "import styles from '@/app/cart/page.module.css?inline';",
      filename: cart,
      output: "import styles from './page.module.css?inline';",
      errors: [useRelative('./page.module.css?inline')],
    },
  ],
});

const fixtures = `${import.meta.dirname}/../../fixtures/import-locality`;
const fixtureTester = new RuleTester({
  cwd: fixtures,
  languageOptions: { parserOptions: { lang: 'tsx' } },
});

fixtureTester.run('trogonstack/require-import-locality directories', requireImportLocalityRule, {
  valid: [
    { code: "import x from '@/app';", filename: `${fixtures}/src/app/cart/page.tsx` },
    { code: "import x from '@/app/checkout';", filename: `${fixtures}/src/app/cart/page.tsx` },
  ],
  invalid: [
    {
      code: "import x from '@/app/cart';",
      filename: `${fixtures}/src/app/cart/page.tsx`,
      output: "import x from '.';",
      errors: [useRelative('.')],
    },
    {
      code: "import x from '@/app/cart/_lib';",
      filename: `${fixtures}/src/app/cart/page.tsx`,
      output: "import x from './_lib';",
      errors: [useRelative('./_lib')],
    },
  ],
});
