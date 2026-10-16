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
    { code: 'export {};', filename: file('helpers/format-price.ts') },
    { code: 'export {};', filename: file('components/button/hooks/use-x.ts') },
    { code: 'export {};', filename: file('components/button/styles/color.ts') },
    { code: 'export {};', filename: file('hooks/use-orphan.ts') },
    { code: 'export {};', filename: file('hooks/use-commented.ts') },
    { code: 'export {};', filename: file('hooks/use-stringy.ts') },
    { code: 'export {};', filename: file('helpers/only-tested.ts') },
    { code: 'export {};', filename: file('app/(shop)/cart/page.tsx') },
    { code: 'export {};', filename: file('app/cart/page.tsx') },
    { code: 'export {};', filename: file('helpers/only-tested.test.ts') },
    { code: 'export {};', filename: file('components/button/button.tsx') },
    { code: 'export {};', filename: file('app/cart/_hooks/use-local.ts') },
    { code: 'export {};', filename: `${root}/outside/hooks/use-cart.ts` },
  ],
  invalid: [
    {
      code: 'export {};',
      filename: file('hooks/use-cart.ts'),
      errors: [hoisted('app/(shop)/cart')],
    },
    {
      code: 'export {};',
      filename: file('hooks/use-alias.ts'),
      errors: [hoisted('app/(shop)/cart')],
    },
    {
      code: 'export {};',
      filename: file('helpers/format-date.ts'),
      errors: [hoisted('app')],
    },
    {
      code: 'export {};',
      filename: file('app/_hooks/use-session.ts'),
      errors: [hoisted('app/cart', 'src/app')],
    },
    {
      code: 'export {};',
      filename: file('app/cart/_hooks/use-cart.ts'),
      errors: [buried('app/cart', 'app', 'app/cart')],
    },
    {
      code: 'export {};',
      filename: file('components/button/components/icon/icon.tsx'),
      errors: [buried('components/button', '', 'components/button/components/icon')],
    },
  ],
});
