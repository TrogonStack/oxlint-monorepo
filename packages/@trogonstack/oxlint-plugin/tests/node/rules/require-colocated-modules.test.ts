import { RuleTester } from 'oxlint/plugins-dev';

import { requireColocatedModulesRule } from '../../../src/rules/require-colocated-modules.ts';

const root = `${import.meta.dirname}/../../fixtures/colocated-modules`;
const tester = new RuleTester({ cwd: root });
const file = (path: string) => `${root}/src/${path}`;

function hoisted(users: string, owner = 'src') {
  return {
    messageId: 'hoisted',
    data: { users, target: `src/${users}`, owner },
  };
}

function buried(scope: string, target: string, owner: string) {
  return {
    messageId: 'buried',
    data: {
      scope: `src/${scope}`.replace(/\/$/u, ''),
      target: `src/${target}`.replace(/\/$/u, ''),
      owner: `src/${owner}`,
    },
  };
}

tester.run('trogonstack/require-colocated-modules', requireColocatedModulesRule, {
  valid: [
    { code: 'export {};', filename: file('helpers/formatPrice.ts') },
    { code: 'export {};', filename: file('components/Button/hooks/useX.ts') },
    { code: 'export {};', filename: file('components/Button/styles/color.ts') },
    { code: 'export {};', filename: file('hooks/useOrphan.ts') },
    { code: 'export {};', filename: file('hooks/useCommented.ts') },
    { code: 'export {};', filename: file('hooks/useStringy.ts') },
    { code: 'export {};', filename: file('helpers/onlyTested.ts') },
    { code: 'export {};', filename: file('app/(shop)/cart/page.tsx') },
    { code: 'export {};', filename: file('app/cart/page.tsx') },
    { code: 'export {};', filename: file('helpers/onlyTested.test.ts') },
    { code: 'export {};', filename: file('components/Button/Button.tsx') },
    { code: 'export {};', filename: file('app/cart/_hooks/use-local.ts') },
    { code: 'export {};', filename: `${root}/outside/hooks/useCart.ts` },
  ],
  invalid: [
    {
      code: 'export {};',
      filename: file('hooks/useCart.ts'),
      errors: [hoisted('app/(shop)/cart')],
    },
    {
      code: 'export {};',
      filename: file('hooks/useAlias.ts'),
      errors: [hoisted('app/(shop)/cart')],
    },
    {
      code: 'export {};',
      filename: file('helpers/formatDate.ts'),
      errors: [hoisted('app')],
    },
    {
      code: 'export {};',
      filename: file('app/_hooks/useSession.ts'),
      errors: [hoisted('app/cart', 'src/app')],
    },
    {
      code: 'export {};',
      filename: file('app/cart/_hooks/use-cart.ts'),
      errors: [buried('app/cart', 'app', 'app/cart')],
    },
    {
      code: 'export {};',
      filename: file('components/Button/components/Icon/Icon.tsx'),
      errors: [buried('components/Button', '', 'components/Button/components/Icon')],
    },
  ],
});
