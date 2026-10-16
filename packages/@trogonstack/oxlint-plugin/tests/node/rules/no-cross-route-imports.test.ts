import { RuleTester } from 'oxlint/plugins-dev';

import { noCrossRouteImportsRule } from '../../../src/rules/no-cross-route-imports.ts';

const tester = new RuleTester({
  cwd: '/repo',
  languageOptions: { parserOptions: { lang: 'tsx' } },
});
const cart = '/repo/src/app/(shop)/cart/page.tsx';
const dynamic = '/repo/src/app/(shop)/products/[id]/page.tsx';
const monorepo = '/repo/apps/web/src/app/checkout/page.tsx';

function crossRoute(importer: string, target: string) {
  return { messageId: 'crossRoute', data: { importer, target } };
}

tester.run('trogonstack/no-cross-route-imports', noCrossRouteImportsRule, {
  valid: [
    { code: "import { Total } from './total';", filename: cart },
    { code: "import { Total } from './_components/total';", filename: cart },
    { code: "import { Shared } from '../_components/shared';", filename: cart },
    { code: "import { Shared } from '@/app/_components/shared';", filename: cart },
    { code: "import { Shared } from '@/app/(shop)/_components/shared';", filename: cart },
    { code: "import { layout } from '../layout';", filename: cart },
    { code: "import { Header } from '@/components/header';", filename: cart },
    { code: "import { Button } from '../../../components/button';", filename: cart },
    { code: "import React from 'react';", filename: cart },
    { code: "import { x } from '@scope/package';", filename: cart },
    { code: "import { x } from '@/app/cart/page';", filename: '/repo/src/lib/util.ts' },
    { code: "import { x } from '@/app/cart/page';", filename: '/repo/no-source/file.ts' },
    { code: "import { x } from '~/app/cart/page';", filename: monorepo },
    { code: "import { x } from '@/app/_shared/x';", filename: monorepo },
    { code: "import { x } from '../_private/x';", filename: dynamic },
    { code: "import { x } from '../../_private/x';", filename: dynamic },
    { code: "export { x } from '../_private/x';", filename: cart },
    { code: "const x = await import('../_private/x');", filename: cart },
    { code: 'const x = await import(name);', filename: cart },
    { code: 'export const x = 1;', filename: cart },
    {
      code: "import { x } from '@/app/(shop)/cart/_lib/x';",
      filename: '/repo/src/app/(shop)/cart/page.tsx',
    },
    {
      code: "import { x } from '~/app/_shared/x';",
      filename: monorepo,
      settings: { trogonstack: { sourceAliases: ['~/'] } },
    },
    {
      code: "import { x } from '@/app/cart/page';",
      filename: monorepo,
      settings: { trogonstack: { sourceAliases: ['~/'] } },
    },
    {
      code: "import { x } from '@/app/checkout/summary';",
      filename: '/repo/src/app/checkout/payment/page.tsx',
    },
  ],
  invalid: [
    {
      code: "import { Nested } from './details/nested';",
      filename: cart,
      errors: [crossRoute('(shop)/cart', '(shop)/cart/details')],
    },
    {
      code: "import { Cart } from '../cart/page';",
      filename: monorepo,
      errors: [crossRoute('checkout', 'cart')],
    },
    {
      code: "import { Cart } from '@/app/cart/page';",
      filename: monorepo,
      errors: [crossRoute('checkout', 'cart')],
    },
    {
      code: "import type { Cart } from '@/app/cart/types';",
      filename: monorepo,
      errors: [crossRoute('checkout', 'cart')],
    },
    {
      code: "import { Cart } from '@/app/cart/page';",
      filename: '/repo/src/app/page.tsx',
      errors: [crossRoute('/', 'cart')],
    },
    {
      code: "export { Cart } from '@/app/cart/page';",
      filename: monorepo,
      errors: [crossRoute('checkout', 'cart')],
    },
    {
      code: "export * from '@/app/cart/page';",
      filename: monorepo,
      errors: [crossRoute('checkout', 'cart')],
    },
    {
      code: "export * as cart from '@/app/cart/page';",
      filename: monorepo,
      errors: [crossRoute('checkout', 'cart')],
    },
    {
      code: "const cart = await import('@/app/cart/page');",
      filename: monorepo,
      errors: [crossRoute('checkout', 'cart')],
    },
    {
      code: "import { Cart } from '../../products/[id]/page';",
      filename: cart,
      errors: [crossRoute('(shop)/cart', 'products/[id]')],
    },
    {
      code: "import { x } from '../../cart/x';",
      filename: dynamic,
      errors: [crossRoute('(shop)/products/[id]', '(shop)/cart')],
    },
    {
      code: "import { x } from '@/app/(shop)/products/[id]/page';",
      filename: cart,
      errors: [crossRoute('(shop)/cart', '(shop)/products/[id]')],
    },
    {
      code: "import { x } from '@/app/checkout/payment/page';",
      filename: '/repo/src/app/checkout/page.tsx',
      errors: [crossRoute('checkout', 'checkout/payment')],
    },
    {
      code: "import { x } from '@/app/cart/_lib/x';",
      filename: monorepo,
      errors: [crossRoute('checkout', 'cart')],
    },
    {
      code: "import { x } from '@/app/checkout/payment/_lib/x';",
      filename: '/repo/src/app/checkout/_lib/y.ts',
      errors: [crossRoute('checkout', 'checkout/payment')],
    },
    {
      code: "import { x } from '~/app/cart/page';",
      filename: monorepo,
      settings: { trogonstack: { sourceAliases: ['~/'] } },
      errors: [crossRoute('checkout', 'cart')],
    },
    {
      code: "import a from '@/app/cart/a';\nimport b from './../orders/b';",
      filename: monorepo,
      errors: [crossRoute('checkout', 'cart'), crossRoute('checkout', 'orders')],
    },
  ],
});
