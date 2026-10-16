import { RuleTester } from 'oxlint/plugins-dev';

import { requireAppEntryFileRule } from '../../../src/rules/require-app-entry-file.ts';

const tester = new RuleTester({ cwd: '/repo' });
const error = { messageId: 'misplacedEntry' };

tester.run('trogonstack/require-app-entry-file', requireAppEntryFileRule, {
  valid: [
    { code: 'export {};', filename: '/repo/src/app/index.tsx' },
    { code: 'export {};', filename: '/repo/src/app/main.tsx' },
    { code: 'export {};', filename: '/repo/src/app.tsx' },
    { code: 'export {};', filename: '/repo/src/main.css' },
    { code: 'export {};', filename: '/repo/src/index.d.ts' },
    { code: 'export {};', filename: '/repo/src/components/index.ts' },
    { code: 'export {};', filename: '/repo/index.ts' },
    { code: 'export {};', filename: '/repo/apps/web/src/app/index.tsx' },
    { code: 'export {};', filename: 'C:\\repo\\src\\app\\index.tsx' },
  ],
  invalid: [
    { code: 'export {};', filename: '/repo/src/main.tsx', errors: [error] },
    { code: 'export {};', filename: '/repo/src/index.tsx', errors: [error] },
    { code: 'export {};', filename: '/repo/src/main.ts', errors: [error] },
    { code: 'export {};', filename: '/repo/src/index.js', errors: [error] },
    { code: 'export {};', filename: '/repo/src/main.jsx', errors: [error] },
    { code: 'export {};', filename: '/repo/src/index.mjs', errors: [error] },
    { code: 'export {};', filename: '/repo/src/main.cts', errors: [error] },
    { code: 'export {};', filename: '/repo/apps/web/src/main.tsx', errors: [error] },
    { code: 'export {};', filename: 'C:\\repo\\src\\main.tsx', errors: [error] },
  ],
});
