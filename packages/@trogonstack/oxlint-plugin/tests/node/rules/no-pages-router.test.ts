import { RuleTester } from 'oxlint/plugins-dev';

import { noPagesRouterRule } from '../../../src/rules/no-pages-router.ts';

const tester = new RuleTester();
const error = { messageId: 'pagesRouter' };

tester.run('trogonstack/no-pages-router', noPagesRouterRule, {
  valid: [
    { code: 'export {};', filename: '/repo/src/app/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/pages/page.tsx' },
    { code: 'export {};', filename: '/repo/src/libs/pages/index.ts' },
    { code: 'export {};', filename: '/repo/pages/index.tsx' },
    { code: 'export {};', filename: '/repo/src/pages.ts' },
    { code: 'export {};', filename: '/repo/apps/web/src/app/layout.tsx' },
  ],
  invalid: [
    { code: 'export {};', filename: '/repo/src/pages/index.tsx', errors: [error] },
    { code: 'export {};', filename: '/repo/src/pages/api/users.ts', errors: [error] },
    { code: 'export {};', filename: '/repo/src/pages/_app.tsx', errors: [error] },
    { code: 'export {};', filename: '/repo/apps/web/src/pages/index.tsx', errors: [error] },
    { code: 'export {};', filename: 'C:\\repo\\src\\pages\\index.tsx', errors: [error] },
  ],
});
