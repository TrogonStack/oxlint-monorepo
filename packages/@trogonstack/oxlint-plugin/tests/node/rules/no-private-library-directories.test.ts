import { RuleTester } from 'oxlint/plugins-dev';

import { noPrivateLibraryDirectoriesRule } from '../../../src/rules/no-private-library-directories.ts';

const tester = new RuleTester({ cwd: '/repo' });
const error = (name: string) => ({ messageId: 'privateDirectory', data: { name } });

tester.run('trogonstack/no-private-library-directories', noPrivateLibraryDirectoriesRule, {
  valid: [
    { code: 'export {};', filename: '/repo/src/libs/billing/charge.ts' },
    { code: 'export {};', filename: '/repo/src/libs/billing/internal/charge.ts' },
    { code: 'export {};', filename: '/repo/src/libs/billing/__tests__/charge.ts' },
    { code: 'export {};', filename: '/repo/src/libs/billing/charge/__tests__/charge.ts' },
    { code: 'export {};', filename: '/repo/src/libs/_billing/charge.ts' },
    { code: 'export {};', filename: '/repo/src/libs/_shared.ts' },
    { code: 'export {};', filename: '/repo/src/app/_components/button.tsx' },
    { code: 'export {};', filename: '/repo/src/other/billing/_internal/charge.ts' },
    { code: 'export {};', filename: '/repo/src/libs/billing/_charge.ts' },
  ],
  invalid: [
    {
      code: 'export {};',
      filename: '/repo/src/libs/billing/_internal/charge.ts',
      errors: [error('_internal')],
    },
    {
      code: 'export {};',
      filename: '/repo/apps/web/src/libs/billing/deep/_private/charge.ts',
      errors: [error('_private')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/libs/billing/_a/_b/charge.ts',
      errors: [error('_a')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/libs/billing/__tests__/_helpers/charge.ts',
      errors: [error('_helpers')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/libs/billing/__mocks__/charge.ts',
      errors: [error('__mocks__')],
    },
    {
      code: 'export {};',
      filename: 'C:\\repo\\src\\libs\\billing\\_internal\\charge.ts',
      errors: [error('_internal')],
    },
  ],
});
