import { RuleTester } from 'oxlint/plugins-dev';

import { noHoistedModulesRule } from '../../../src/rules/no-hoisted-modules.ts';

const root = `${import.meta.dirname}/../../fixtures/hoisted-modules`;
const tester = new RuleTester({ cwd: root });
const file = (path: string) => `${root}/src/${path}`;

function hoisted(users: string, owner = 'src') {
  return {
    messageId: 'hoisted',
    data: { users, target: `src/${users}`, owner },
  };
}

tester.run('trogonstack/no-hoisted-modules', noHoistedModulesRule, {
  valid: [
    { code: 'export {};', filename: file('helpers/formatPrice.ts') },
    { code: 'export {};', filename: file('components/Button/hooks/useX.ts') },
    { code: 'export {};', filename: file('components/Button/styles/color.ts') },
    { code: 'export {};', filename: file('hooks/useOrphan.ts') },
    { code: 'export {};', filename: file('helpers/onlyTested.ts') },
    { code: 'export {};', filename: file('app/(shop)/cart/page.tsx') },
    { code: 'export {};', filename: file('app/cart/page.tsx') },
    { code: 'export {};', filename: file('helpers/onlyTested.test.ts') },
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
  ],
});
