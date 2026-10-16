import { RuleTester } from 'oxlint/plugins-dev';

import { requireKebabCaseDirectoriesRule } from '../../../src/rules/require-kebab-case-directories.ts';

const tester = new RuleTester({ cwd: '/repo' });
const error = (name: string, suggestion: string) => ({
  messageId: 'notKebabCase',
  data: { name, suggestion },
});

tester.run('trogonstack/require-kebab-case-directories', requireKebabCaseDirectoriesRule, {
  valid: [
    { code: 'export {};', filename: '/repo/src/components/button/button.tsx' },
    { code: 'export {};', filename: '/repo/src/app/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/_components/button.tsx' },
    { code: 'export {};', filename: '/repo/src/app/user-settings/_hooks/use-thing.ts' },
    { code: 'export {};', filename: '/repo/src/components/__tests__/setup.ts' },
    { code: 'export {};', filename: '/repo/src/@types/globals.d.ts' },
    { code: 'export {};', filename: '/repo/src/app/(marketing)/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/(marketing-site)/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/blog/[slug]/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/blog/[postId]/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/docs/[...path]/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/docs/[[...path]]/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/@modal/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/feed/(.)photo/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/feed/(..)photo/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/feed/(...)photo/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/feed/(..)(..)photo/page.tsx' },
    { code: 'export {};', filename: '/repo/src/libs/billing-v2/index.ts' },
    { code: 'export {};', filename: '/repo/src/libs/v2/index.ts' },
    { code: 'export {};', filename: '/repo/src/Button.tsx' },
    { code: 'export {};', filename: '/repo/Components/Button/button.tsx' },
    { code: 'export {};', filename: '/repo/apps/web/src/app/_services/api.ts' },
    { code: 'export {};', filename: 'C:\\repo\\src\\components\\button\\button.tsx' },
  ],
  invalid: [
    {
      code: 'export {};',
      filename: '/repo/src/components/Button/button.tsx',
      errors: [error('Button', 'button')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/hooks/useCart/use-cart.ts',
      errors: [error('useCart', 'use-cart')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/user_settings/page.ts',
      errors: [error('user_settings', 'user-settings')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/HTMLParser/parser.ts',
      errors: [error('HTMLParser', 'html-parser')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/_Components/button.tsx',
      errors: [error('_Components', '_components')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/(Marketing)/page.tsx',
      errors: [error('(Marketing)', '(marketing)')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/@Modal/page.tsx',
      errors: [error('@Modal', '@modal')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/feed/(.)Photo/page.tsx',
      errors: [error('(.)Photo', '(.)photo')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/blog/[]/page.tsx',
      errors: [error('[]', 'directory')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/__private/page.tsx',
      errors: [error('__private', '_private')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/Components/Button/Icon/icon.tsx',
      errors: [error('Components', 'components')],
    },
    {
      code: 'export {};',
      filename: '/repo/apps/web/src/app/userSettings/page.tsx',
      errors: [error('userSettings', 'user-settings')],
    },
    {
      code: 'export {};',
      filename: 'C:\\repo\\src\\components\\Button\\button.tsx',
      errors: [error('Button', 'button')],
    },
  ],
});
