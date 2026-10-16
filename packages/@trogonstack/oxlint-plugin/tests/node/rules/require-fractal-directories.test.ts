import { RuleTester } from 'oxlint/plugins-dev';

import { requireFractalDirectoriesRule } from '../../../src/rules/require-fractal-directories.ts';

const tester = new RuleTester({ cwd: '/repo' });
const error = (directory: string, parent: string) => ({
  messageId: 'unknownDirectory',
  data: { directory, parent },
});

tester.run('trogonstack/require-fractal-directories', requireFractalDirectoriesRule, {
  valid: [
    { code: 'export {};', filename: '/repo/src/index.ts' },
    { code: 'export {};', filename: '/repo/src/app/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/(shop)/cart/_components/x.tsx' },
    { code: 'export {};', filename: '/repo/src/app/[locale]/[...slug]/@modal/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/[[...slug]]/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/components/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/_hooks/deep/er/use-x.ts' },
    { code: 'export {};', filename: '/repo/src/app/dashboard/__tests__/setup.ts' },
    { code: 'export {};', filename: '/repo/src/app/_components/Button/hooks/use-x.ts' },
    { code: 'export {};', filename: '/repo/src/app/_storages/local/token.ts' },
    { code: 'export {};', filename: '/repo/src/app/_server/actions/save.ts' },
    { code: 'export {};', filename: '/repo/src/app/_i18n/messages/en.ts' },
    { code: 'export {};', filename: '/repo/src/components/Button/hooks/use-x.ts' },
    { code: 'export {};', filename: '/repo/src/components/Button/components/Icon/styles/x.ts' },
    { code: 'export {};', filename: '/repo/src/components/Button.tsx' },
    { code: 'export {};', filename: '/repo/src/hooks/components/x.ts' },
    { code: 'export {};', filename: '/repo/src/libs/analytics/services/segment/track.ts' },
    { code: 'export {};', filename: '/repo/src/libs/analytics/__tests__/setup.ts' },
    { code: 'export {};', filename: '/repo/src/libs/analytics/index.ts' },
    { code: 'export {};', filename: '/repo/src/@types/deep/global.d.ts' },
    { code: 'export {};', filename: '/repo/src/polyfills/anything/at/all.ts' },
    { code: 'export {};', filename: '/repo/src/services/stripe/client.ts' },
    { code: 'export {};', filename: '/repo/src/storages/cookies/token.ts' },
    { code: 'export {};', filename: '/repo/src/i18n/relative-time/en.ts' },
    { code: 'export {};', filename: '/repo/src/server/actions/save/validate.ts' },
    { code: 'export {};', filename: '/repo/src/helpers/currency/format.ts' },
    { code: 'export {};', filename: '/repo/src/__tests__/setup.ts' },
    { code: 'export {};', filename: '/repo/apps/web/src/hooks/use-x.ts' },
    { code: 'export {};', filename: '/repo/lib/random/x.ts' },
    { code: 'export {};', filename: 'C:\\repo\\src\\app\\_components\\x.tsx' },
    {
      code: 'export {};',
      filename: '/repo/src/features/x.ts',
      options: [{ additionalDirectories: ['features'] }],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/_features/x.ts',
      options: [{ additionalDirectories: ['features'] }],
    },
  ],
  invalid: [
    {
      code: 'export {};',
      filename: '/repo/src/random/x.ts',
      errors: [error('random', 'src')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/_utils/x.ts',
      errors: [error('app/_utils', 'src/app')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/(shop)/cart/_utils/x.ts',
      errors: [error('app/(shop)/cart/_utils', 'src/app/(shop)/cart')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/storages/redis/x.ts',
      errors: [error('storages/redis', 'src/storages')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/i18n/locales/en.ts',
      errors: [error('i18n/locales', 'src/i18n')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/server/jobs/run.ts',
      errors: [error('server/jobs', 'src/server')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/_server/jobs/run.ts',
      errors: [error('app/_server/jobs', 'src/app/_server')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/components/Button/utils/x.ts',
      errors: [error('components/Button/utils', 'src/components/Button')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/components/Button/components/Icon/misc/x.ts',
      errors: [
        error('components/Button/components/Icon/misc', 'src/components/Button/components/Icon'),
      ],
    },
    {
      code: 'export {};',
      filename: '/repo/src/libs/analytics/utils/x.ts',
      errors: [error('libs/analytics/utils', 'src/libs/analytics')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/_components/Button/_inner/x.ts',
      errors: [error('app/_components/Button/_inner', 'src/app/_components/Button')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/features/x.ts',
      errors: [error('features', 'src')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/lib/x.ts',
      options: [{ additionalDirectories: ['features'] }],
      errors: [error('lib', 'src')],
    },
    {
      code: 'export {};',
      filename: 'C:\\repo\\src\\random\\x.ts',
      errors: [error('random', 'src')],
    },
    {
      code: 'export {};',
      filename: '/repo/apps/web/src/random/deep/x.ts',
      errors: [error('random', 'src')],
    },
  ],
});
