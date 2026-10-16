import { RuleTester } from 'oxlint/plugins-dev';

import { noDemoDataPrimaryPathRule } from '../../../src/rules/no-demo-data-primary-path.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/no-demo-data-primary-path', noDemoDataPrimaryPathRule, {
  valid: [
    {
      filename: '/repo/app/dashboard/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nexport async function Page() { const data = await fetch('/api/rows'); return data; }",
    },
    {
      filename: '/repo/components/Preview.tsx',
      code: "import { rows } from '@/fixtures/rows';\nexport function Preview() { return rows; }",
    },
    {
      filename: '/repo/src/pages/reports.tsx',
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { const records = db.report.findMany(); return records ?? rows; }",
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return records ?? rows; }",
    },
    {
      filename: '/repo/app/dashboard/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { const data = trpc.rows.list.useQuery(); return data ?? rows; }",
    },
    {
      filename: '/repo/app/dashboard/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return <Table rows={records ?? rows} />; }",
    },
    {
      filename: '/repo/app/dashboard/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return <main>Live data only</main>; }",
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return { rows: true }; }",
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import type { Rows } from '@/fixtures/rows';\nexport function Page(): Rows | null { return null; }",
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\ntype Rows = string[];\nexport async function Page() { const records = (await db.report.findMany()) as Rows; return <Table rows={records ?? rows} />; }",
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\ntype Rows = string[];\nexport async function Page() { const records = await db.report.findMany(); return <Table rows={records ?? (rows as Rows)} />; }",
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return <Table rows={records ?? rows!} />; }",
    },
  ],
  invalid: [
    {
      filename: '/repo/app/dashboard/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return rows; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: 'C:\\repo\\app\\dashboard\\page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return rows; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return { [rows]: true }; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/src/pages/reports.tsx',
      code: "import rows from '@/demo';\nexport function Page() { return rows; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nexport function Page() { return rows; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/src/app/dashboard/layout.tsx',
      code: "import { rows } from '@/mocks/rows';\nexport default function Layout({ children }) { return <div data-rows={rows.length}>{children}</div>; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nconst flags = { fetch: false };\nexport function Page() { return rows; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/app/dashboard/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nexport async function Page() { await fetch('/telemetry'); return <Table rows={rows} />; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return <Table rows={rows} />; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport function Page() { return <Table rows={rows} />; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { fallbackRows, previewRows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return <><Table rows={records ?? fallbackRows} /><Table rows={previewRows} /></>; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return <Table rows={records || rows} />; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import '@/fixtures/rows';\nexport function Page() { return <main>Live data only</main>; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { const records = await db.report.findMany(); return <>{(() => records ?? rows)()}</>; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\nimport { db } from '@/lib/db';\nexport async function Page() { let records = await db.report.findMany(); records = undefined; return <Table rows={records ?? rows} />; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
    {
      filename: '/repo/app/page.tsx',
      code: "import { rows } from '@/fixtures/rows';\ntype Rows = unknown;\nexport function Page() { const value = rows satisfies Rows; return value; }",
      errors: [{ messageId: 'demoDataPrimary' }],
    },
  ],
});
