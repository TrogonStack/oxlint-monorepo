import { RuleTester } from 'oxlint/plugins-dev';

import { noServerActionImportsRule } from '../../../src/rules/no-server-action-imports.ts';

const tester = new RuleTester({
  cwd: '/repo',
  languageOptions: { parserOptions: { lang: 'tsx' } },
});
const action = '/repo/src/app/cart/_server/actions/add.ts';
const plain = '/repo/apps/web/src/server/actions/add.ts';
const imports = { messageId: 'importsAction' };

function calls(name: string) {
  return { messageId: 'callsAction', data: { name } };
}

tester.run('trogonstack/no-server-action-imports', noServerActionImportsRule, {
  valid: [
    {
      code: 'export default async function () { return 1; }\nexport async function b() { return 2; }',
      filename: action,
    },
    {
      code: 'async function helper() { return 1; }\nexport default async function a() { return helper(); }',
      filename: action,
    },
    { code: "import { db } from '../db';", filename: action },
    { code: "import { db } from '@/server/db';", filename: plain },
    { code: "import { db } from '@/app/cart/_server/queries/load';", filename: action },
    { code: "import { x } from '@/app/cart/_server/actions-helper/x';", filename: action },
    { code: "import { x } from '@/app/cart/actions/x';", filename: action },
    { code: "import { x } from 'some-package/server/actions/x';", filename: action },
    {
      code: "import { x } from '@/server/actions/x';",
      filename: '/repo/src/components/button.tsx',
    },
    { code: "import { x } from '@/server/actions/x';", filename: '/repo/src/server/queries/x.ts' },
    { code: "import { x } from '~/server/actions/x';", filename: plain },
    {
      code: "import { x } from '@/server/actions/x';",
      filename: plain,
      settings: { trogonstack: { sourceAliases: ['~/'] } },
    },
    {
      code: 'export async function a() { return 1; }\nexport async function b() { return 2; }',
      filename: action,
    },
    {
      code: 'async function helper() { return 1; }\nexport async function a() { return helper(); }',
      filename: action,
    },
    {
      code: 'export async function a() { return 1; }\nasync function helper() { return a(); }\nexport async function b() { return helper(); }',
      filename: action,
    },
    {
      code: 'export async function a() { const b = () => 1; return b(); }\nexport async function b() { return 2; }',
      filename: action,
    },
    {
      code: 'export async function a(b) { return b(); }\nexport async function b() { return 2; }',
      filename: action,
    },
    {
      code: 'export async function a() { return a(); }',
      filename: action,
    },
    {
      code: 'export async function a() { return 1; }\nexport async function b() { { const a = () => 2; return a(); } }',
      filename: action,
    },
    {
      code: 'export async function a() { return 1; }\nexport async function b() { return a(); }',
      filename: '/repo/src/lib/actions.ts',
    },
    {
      code: 'async function a() { return 1; }\nexport async function b() { return a(); }',
      filename: action,
    },
    {
      code: 'export async function a() { return 1; }\nexport async function b() { return other.a(); }',
      filename: action,
    },
    {
      code: 'export const a = 1;\nexport async function b() { return a(); }',
      filename: action,
    },
  ],
  invalid: [
    {
      code: 'export default async function a() { return 1; }\nexport async function b() { return a(); }',
      filename: action,
      errors: [calls('a')],
    },
    {
      code: 'export async function a() { return 1; }\nexport default async function b() { return a(); }',
      filename: action,
      errors: [calls('a')],
    },
    {
      code: 'export async function a() { return 1; }\nexport default async function () { return a(); }',
      filename: action,
      errors: [calls('a')],
    },
    {
      code: 'export async function a() { return 1; }\nexport default async () => a();',
      filename: action,
      errors: [calls('a')],
    },
    {
      code: 'const a = async () => 1;\nexport default a;\nexport async function b() { return a(); }',
      filename: action,
      errors: [calls('a')],
    },
    {
      code: 'async function a() { return 1; }\nconst b = async () => a();\nexport default b;\nexport { a };',
      filename: action,
      errors: [calls('a')],
    },
    { code: "import { add } from './remove';", filename: action, errors: [imports] },
    {
      code: "import { add } from '../actions/remove';",
      filename: '/repo/src/app/cart/_server/actions/a/b.ts',
      errors: [imports],
    },
    {
      code: "import { add } from '@/app/orders/_server/actions/place';",
      filename: action,
      errors: [imports],
    },
    { code: "import { add } from '@/server/actions/place';", filename: plain, errors: [imports] },
    {
      code: "import type { Input } from '@/server/actions/place';",
      filename: plain,
      errors: [imports],
    },
    { code: "export { add } from './remove';", filename: action, errors: [imports] },
    { code: "export * from './remove';", filename: action, errors: [imports] },
    { code: "const m = await import('./remove');", filename: action, errors: [imports] },
    {
      code: "import { x } from '~/server/actions/x';",
      filename: plain,
      settings: { trogonstack: { sourceAliases: ['~/'] } },
      errors: [imports],
    },
    {
      code: 'export async function a() { return 1; }\nexport async function b() { return a(); }',
      filename: action,
      errors: [calls('a')],
    },
    {
      code: 'export async function a() { return 1; }\nexport const b = async () => { await a(); };',
      filename: action,
      errors: [calls('a')],
    },
    {
      code: 'export const a = async () => 1;\nexport const b = async () => a();',
      filename: action,
      errors: [calls('a')],
    },
    {
      code: 'async function a() { return 1; }\nexport { a };\nexport async function b() { return a(); }',
      filename: action,
      errors: [calls('a')],
    },
    {
      code: 'async function a() { return 1; }\nasync function b() { return a(); }\nexport { a as first, b as second };',
      filename: action,
      errors: [calls('a')],
    },
    {
      code: 'const a = async () => 1;\nexport async function b() { return a(); }\nexport { a };',
      filename: action,
      errors: [calls('a')],
    },
    {
      code: 'export async function a() { return 1; }\nexport async function b() { return [1].map(() => a()); }',
      filename: action,
      errors: [calls('a')],
    },
    {
      code: 'export async function a() { return 1; }\nexport async function b() { await a(); await a(); }',
      filename: action,
      errors: [calls('a'), calls('a')],
    },
    {
      code: 'export async function a() { return b(); }\nexport async function b() { return a(); }',
      filename: action,
      errors: [calls('b'), calls('a')],
    },
    {
      code: 'export async function a() { return 1; }\nexport async function b() { return a(); }',
      filename: plain,
      errors: [calls('a')],
    },
  ],
});

const fixtures = `${import.meta.dirname}/../../fixtures/server-action-imports`;
const fixtureTester = new RuleTester({
  cwd: fixtures,
  languageOptions: { parserOptions: { lang: 'tsx' } },
});

fixtureTester.run('trogonstack/no-server-action-imports directories', noServerActionImportsRule, {
  valid: [
    {
      code: "import { legacy } from '@/legacy/server/actions';",
      filename: `${fixtures}/src/server/actions/remove.ts`,
    },
  ],
  invalid: [
    {
      code: "import { add } from '@/server/actions';",
      filename: `${fixtures}/src/server/actions/remove.ts`,
      errors: [imports],
    },
    {
      code: "import { add } from '.';",
      filename: `${fixtures}/src/server/actions/remove.ts`,
      errors: [imports],
    },
    {
      code: "import { add } from '..';",
      filename: `${fixtures}/src/server/actions/nested/deep.ts`,
      errors: [imports],
    },
  ],
});
