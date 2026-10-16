import { RuleTester } from 'oxlint/plugins-dev';

import { requireTypesDirectoryRule } from '../../../src/rules/require-types-directory.ts';

const tester = new RuleTester({ cwd: '/repo' });
const error = { messageId: 'misplacedDeclaration' };

tester.run('trogonstack/require-types-directory', requireTypesDirectoryRule, {
  valid: [
    { code: 'export {};', filename: '/repo/src/@types/globals.d.ts' },
    { code: 'export {};', filename: '/repo/src/@types/vendor/lib.d.mts' },
    { code: 'export {};', filename: '/repo/apps/web/src/@types/env.d.cts' },
    { code: 'export {};', filename: '/repo/next-env.d.ts' },
    { code: 'export {};', filename: '/repo/apps/web/next-env.d.ts' },
    { code: 'export {};', filename: '/repo/src/app/page.ts' },
    { code: 'export {};', filename: '/repo/src/app/model.d.tsx.ts' },
    { code: 'export {};', filename: '/repo/src/app/d.ts' },
    { code: 'export {};', filename: 'C:\\repo\\src\\@types\\globals.d.ts' },
  ],
  invalid: [
    { code: 'export {};', filename: '/repo/src/globals.d.ts', errors: [error] },
    { code: 'export {};', filename: '/repo/src/app/globals.d.ts', errors: [error] },
    { code: 'export {};', filename: '/repo/src/types/globals.d.mts', errors: [error] },
    { code: 'export {};', filename: '/repo/src/lib/globals.d.cts', errors: [error] },
    { code: 'export {};', filename: '/repo/apps/web/src/app/env.d.ts', errors: [error] },
    { code: 'export {};', filename: '/repo/src/foo/@types/env.d.ts', errors: [error] },
    { code: 'export {};', filename: 'C:\\repo\\src\\app\\globals.d.ts', errors: [error] },
  ],
});

new RuleTester({ cwd: '/home/dev/src/repo' }).run(
  'trogonstack/require-types-directory (checkout inside a src directory)',
  requireTypesDirectoryRule,
  {
    valid: [{ code: 'export {};', filename: '/home/dev/src/repo/next-env.d.ts' }],
    invalid: [
      { code: 'export {};', filename: '/home/dev/src/repo/src/app/env.d.ts', errors: [error] },
    ],
  },
);
