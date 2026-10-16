import { RuleTester } from 'oxlint/plugins-dev';

import { requirePrivateAppDirectoriesRule } from '../../../src/rules/require-private-app-directories.ts';

const tester = new RuleTester({ cwd: '/repo' });
const error = (name: string) => ({ messageId: 'publicDirectory', data: { name } });

tester.run('trogonstack/require-private-app-directories', requirePrivateAppDirectoriesRule, {
  valid: [
    { code: 'export {};', filename: '/repo/src/app/_components/button.tsx' },
    { code: 'export {};', filename: '/repo/src/app/dashboard/_hooks/use-thing.ts' },
    { code: 'export {};', filename: '/repo/src/app/_shared/components/button.tsx' },
    { code: 'export {};', filename: '/repo/src/app/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/components.tsx' },
    { code: 'export {};', filename: '/repo/src/app/(marketing)/[id]/@modal/page.tsx' },
    { code: 'export {};', filename: '/repo/src/app/dashboard/settings/page.tsx' },
    { code: 'export {};', filename: '/repo/src/components/button.tsx' },
    { code: 'export {};', filename: '/repo/src/libs/app/components/button.tsx' },
    { code: 'export {};', filename: '/repo/src/app/utils/format.ts' },
    { code: 'export {};', filename: '/repo/src/app/libs/format.ts' },
    { code: 'export {};', filename: '/repo/apps/web/src/app/_services/api.ts' },
  ],
  invalid: [
    {
      code: 'export {};',
      filename: '/repo/src/app/components/button.tsx',
      errors: [error('components')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/dashboard/hooks/use-thing.ts',
      errors: [error('hooks')],
    },
    {
      code: 'export {};',
      filename: '/repo/apps/web/src/app/(marketing)/[id]/@modal/services/api.ts',
      errors: [error('services')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/components/hooks/use-thing.ts',
      errors: [error('components')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/dashboard/components/_inner/hooks/x.ts',
      errors: [error('components')],
    },
    { code: 'export {};', filename: '/repo/src/app/server/db.ts', errors: [error('server')] },
    { code: 'export {};', filename: '/repo/src/app/i18n/en.ts', errors: [error('i18n')] },
    {
      code: 'export {};',
      filename: '/repo/src/app/storages/local.ts',
      errors: [error('storages')],
    },
    { code: 'export {};', filename: '/repo/src/app/schemas/user.ts', errors: [error('schemas')] },
    {
      code: 'export {};',
      filename: '/repo/src/app/contexts/theme.ts',
      errors: [error('contexts')],
    },
    {
      code: 'export {};',
      filename: '/repo/src/app/constants/limits.ts',
      errors: [error('constants')],
    },
    { code: 'export {};', filename: '/repo/src/app/types/user.ts', errors: [error('types')] },
    { code: 'export {};', filename: '/repo/src/app/styles/base.ts', errors: [error('styles')] },
    { code: 'export {};', filename: '/repo/src/app/assets/logo.ts', errors: [error('assets')] },
    { code: 'export {};', filename: '/repo/src/app/helpers/format.ts', errors: [error('helpers')] },
    {
      code: 'export {};',
      filename: 'C:\\repo\\src\\app\\dashboard\\components\\button.tsx',
      errors: [error('components')],
    },
  ],
});
