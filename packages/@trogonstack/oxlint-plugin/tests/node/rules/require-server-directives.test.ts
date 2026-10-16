import { RuleTester } from 'oxlint/plugins-dev';

import { requireServerDirectivesRule } from '../../../src/rules/require-server-directives.ts';

const tester = new RuleTester({
  cwd: '/repo',
  languageOptions: { parserOptions: { lang: 'tsx' } },
});
const noDirective = { messageId: 'missingUseServer' };
const noServerOnly = { messageId: 'missingServerOnly' };
const full = "'use server';\nimport 'server-only';\nexport const a = 1;";

tester.run('trogonstack/require-server-directives', requireServerDirectivesRule, {
  valid: [
    { code: full, filename: '/repo/src/server/db.ts' },
    { code: full, filename: '/repo/src/app/cart/_server/db.ts' },
    { code: full, filename: '/repo/apps/web/src/app/(shop)/cart/_server/actions/add.ts' },
    { code: full, filename: '/repo/src/components/button/server/load.ts' },
    {
      code: '"use server";\nimport "server-only";\nexport const a = 1;',
      filename: '/repo/src/server/db.ts',
    },
    {
      code: "'use server';\nimport { x } from 'y';\nimport 'server-only';\nexport const a = x;",
      filename: '/repo/src/server/db.ts',
    },
    { code: 'export const a = 1;', filename: '/repo/src/lib/db.ts' },
    { code: 'export const a = 1;', filename: '/repo/src/servers/db.ts' },
    { code: 'export const a = 1;', filename: '/repo/src/app/cart/server.ts' },
    { code: 'export const a = 1;', filename: '/repo/server/db.ts' },
    { code: 'export const a = 1;', filename: 'db.ts' },
  ],
  invalid: [
    {
      code: 'export const a = 1;',
      filename: '/repo/src/server/db.ts',
      errors: [noDirective, noServerOnly],
    },
    {
      code: "import 'server-only';\nexport const a = 1;",
      filename: '/repo/src/server/db.ts',
      errors: [noDirective],
    },
    {
      code: "'use server';\nexport const a = 1;",
      filename: '/repo/src/server/db.ts',
      errors: [noServerOnly],
    },
    {
      code: "import 'server-only';\n'use server';\nexport const a = 1;",
      filename: '/repo/src/server/db.ts',
      errors: [noDirective],
    },
    {
      code: "'use server';\nimport { x } from 'server-only';\nexport const a = x;",
      filename: '/repo/src/server/db.ts',
      errors: [noServerOnly],
    },
    {
      code: "'use server';\nimport 'other';\nexport const a = 1;",
      filename: '/repo/src/server/db.ts',
      errors: [noServerOnly],
    },
    {
      code: "'use client';\nimport 'server-only';",
      filename: '/repo/src/app/cart/_server/db.ts',
      errors: [noDirective],
    },
    {
      code: 'export const a = 1;',
      filename: '/repo/apps/web/src/app/(shop)/[id]/_server/actions/add.ts',
      errors: [noDirective, noServerOnly],
    },
    { code: '', filename: '/repo/src/server/empty.ts', errors: [noDirective, noServerOnly] },
  ],
});
