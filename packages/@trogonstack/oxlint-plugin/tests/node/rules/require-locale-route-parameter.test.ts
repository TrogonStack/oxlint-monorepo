import { RuleTester } from 'oxlint/plugins-dev';

import { requireLocaleRouteParameterRule } from '../../../src/rules/require-locale-route-parameter.ts';

const tester = new RuleTester({ cwd: '/repo' });
const error = (segment: string) => ({ messageId: 'wrongParameter', data: { segment } });

tester.run('trogonstack/require-locale-route-parameter', requireLocaleRouteParameterRule, {
  valid: [
    { code: 'export {};', filename: '/repo/src/app/[locale]/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/[locale]/[id]/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/[...slug]/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/lang/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/(lang)/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/[Lang]/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/[lang].tsx' },
    { code: 'export {};', filename: '/repo/src/components/[lang]/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/[region]/page.tsx' },
    { code: 'export {};', filename: 'C:\\repo\\src\\app\\[locale]\\page.tsx' },
  ],
  invalid: [
    { code: 'export {};', filename: '/repo/src/app/[lang]/page.tsx', errors: [error('[lang]')] },
    { code: 'export {};', filename: '/repo/src/app/[lng]/page.tsx', errors: [error('[lng]')] },
    {
      code: 'export {};',
      filename: '/repo/src/app/[...language]/page.tsx',
      errors: [error('[...language]')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/[[...langCode]]/page.tsx',
      errors: [error('[[...langCode]]')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/(shop)/[languageCode]/cart/page.tsx',
      errors: [error('[languageCode]')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/[lang]/[lng]/page.tsx',
      errors: [error('[lang]')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/[region]/page.tsx',
      settings: { trogonstack: { localeParameterAliases: ['region'] } },
      errors: [error('[region]')],
    },
    {
      code: 'export {};',
      filename: 'C:\\repo\\src\\app\\[lang]\\page.tsx',
      errors: [error('[lang]')],
    },
  ],
});
