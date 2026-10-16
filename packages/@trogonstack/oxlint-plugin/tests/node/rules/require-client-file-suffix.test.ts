import { RuleTester } from 'oxlint/plugins-dev';

import { requireClientFileSuffixRule } from '../../../src/rules/require-client-file-suffix.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const missing = { messageId: 'missingSuffix' };
const directive = "'use client';\nexport function A() { return null; }";

tester.run('trogonstack/require-client-file-suffix', requireClientFileSuffixRule, {
  valid: [
    { code: directive, filename: '/repo/src/components/button.client.tsx' },
    { code: directive, filename: '/repo/src/app/cart/_components/button.client.tsx' },
    { code: directive, filename: '/repo/apps/web/src/app/(shop)/cart/cart-form.client.ts' },
    { code: directive, filename: 'button.client.jsx' },
    { code: directive, filename: '/repo/src/app/error.tsx' },
    { code: directive, filename: '/repo/src/app/error.js' },
    { code: directive, filename: '/repo/src/app/global-error.tsx' },
    { code: directive, filename: '/repo/src/app/cart/error.tsx' },
    { code: directive, filename: '/repo/apps/web/src/app/(shop)/[id]/error.tsx' },
    { code: 'export function A() { return null; }', filename: '/repo/src/components/button.tsx' },
    { code: "'use server';\nexport const a = 1;", filename: '/repo/src/server/button.ts' },
    {
      code: "import x from 'x';\n'use client';\nexport const a = x;",
      filename: '/repo/src/components/button.tsx',
    },
    { code: "const a = 1;\n'use client';", filename: '/repo/src/components/button.tsx' },
    { code: '"use client";\nexport const a = 1;', filename: '/repo/src/components/a.client.tsx' },
  ],
  invalid: [
    { code: directive, filename: '/repo/src/components/button.tsx', errors: [missing] },
    {
      code: '"use client";\nexport const a = 1;',
      filename: '/repo/src/components/button.ts',
      errors: [missing],
    },
    { code: directive, filename: 'button.tsx', errors: [missing] },
    { code: directive, filename: '/repo/src/app/cart/page.tsx', errors: [missing] },
    { code: directive, filename: '/repo/src/components/error.tsx', errors: [missing] },
    { code: directive, filename: '/repo/src/lib/global-error.tsx', errors: [missing] },
    { code: directive, filename: '/repo/src/app/errors.tsx', errors: [missing] },
    { code: directive, filename: '/repo/src/app/error-boundary.tsx', errors: [missing] },
    { code: directive, filename: '/repo/src/components/client.tsx', errors: [missing] },
    { code: directive, filename: '/repo/src/components/button.clients.tsx', errors: [missing] },
    { code: directive, filename: '/repo/src/components/button.client', errors: [missing] },
    { code: directive, filename: '/repo/src/components/button-client.tsx', errors: [missing] },
  ],
});
