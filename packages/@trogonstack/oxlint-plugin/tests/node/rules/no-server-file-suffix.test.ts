import { RuleTester } from 'oxlint/plugins-dev';

import { noServerFileSuffixRule } from '../../../src/rules/no-server-file-suffix.ts';

const tester = new RuleTester();
const error = { messageId: 'serverSuffix' };

tester.run('trogonstack/no-server-file-suffix', noServerFileSuffixRule, {
  valid: [
    { code: 'export {};', filename: '/repo/src/app/_services/db.ts' },
    { code: 'export {};', filename: '/repo/src/app/_services/storage.client.ts' },
    { code: 'export {};', filename: '/repo/src/server.ts' },
    { code: 'export {};', filename: '/repo/src/server/index.ts' },
    { code: 'export {};', filename: '/repo/src/app/my.server.dir/db.ts' },
    { code: 'export {};', filename: '/repo/src/app/servers.ts' },
  ],
  invalid: [
    { code: 'export {};', filename: '/repo/src/app/_services/db.server.ts', errors: [error] },
    { code: 'export {};', filename: '/repo/src/app/page.server.tsx', errors: [error] },
    { code: 'export {};', filename: '/repo/apps/web/src/x.server.mjs', errors: [error] },
    { code: 'export {};', filename: '/repo/src/types.server.d.ts', errors: [error] },
    { code: 'export {};', filename: '/repo/src/a.server.test.ts', errors: [error] },
    { code: 'export {};', filename: 'db.server.ts', errors: [error] },
    { code: 'export {};', filename: 'C:\\repo\\src\\app\\db.server.ts', errors: [error] },
  ],
});
