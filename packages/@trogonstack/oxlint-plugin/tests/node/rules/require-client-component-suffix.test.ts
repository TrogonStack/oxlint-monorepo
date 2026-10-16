import { RuleTester } from 'oxlint/plugins-dev';

import { requireClientComponentSuffixRule } from '../../../src/rules/require-client-component-suffix.ts';

const tester = new RuleTester({
  cwd: '/repo',
  languageOptions: { parserOptions: { lang: 'tsx' } },
});
const error = (imported: string, local: string) => ({
  messageId: 'aliasedComponent',
  data: { imported, local },
});

tester.run('trogonstack/require-client-component-suffix', requireClientComponentSuffixRule, {
  valid: [
    {
      code: "import { ChartClient } from './chart.client';",
      filename: '/repo/src/app/page.tsx',
    },
    {
      code: "import { Chart } from './chart.client';",
      filename: '/repo/src/app/page.tsx',
    },
    {
      code: "import { Chart as ChartClient } from './chart';",
      filename: '/repo/src/app/page.tsx',
    },
    {
      code: "import { ChartClient as Chart } from './chart.client';",
      filename: '/repo/src/app/page.tsx',
    },
    {
      code: "import { useChart as useThing } from './chart.client';",
      filename: '/repo/src/app/page.tsx',
    },
    {
      code: "import Chart from './chart.client';",
      filename: '/repo/src/app/page.tsx',
    },
    {
      code: "import * as Chart from './chart.client';",
      filename: '/repo/src/app/page.tsx',
    },
    {
      code: "import { Chart as ChartClient } from 'chart.client';",
      filename: '/repo/src/app/page.tsx',
    },
    {
      code: "import { Chart as ChartClient } from './chart.clients';",
      filename: '/repo/src/app/page.tsx',
    },
    {
      code: "import { Chart as ChartClient } from './chart.client';",
      filename: '/repo/next.config.ts',
    },
    {
      code: "import { ChartClient } from './chart.client';",
      filename: 'C:\\repo\\src\\app\\page.tsx',
    },
  ],
  invalid: [
    {
      code: "import { Chart as ChartClient } from './chart.client';",
      filename: '/repo/src/app/page.tsx',
      errors: [error('Chart', 'ChartClient')],
    },
    {
      code: "import { Chart as ChartClient } from './chart.client.tsx';",
      filename: '/repo/src/app/page.tsx',
      errors: [error('Chart', 'ChartClient')],
    },
    {
      code: "import { Chart as Other, Table as TableClient } from '../_components/chart.client';",
      filename: '/repo/src/app/dashboard/page.tsx',
      errors: [error('Chart', 'Other'), error('Table', 'TableClient')],
    },
    {
      code: "import { Chart as ChartClient } from '@/app/chart.client';",
      filename: '/repo/src/app/page.tsx',
      errors: [error('Chart', 'ChartClient')],
    },
    {
      code: "import { Chart as ChartClient } from '~/app/chart.client';",
      filename: '/repo/src/app/page.tsx',
      settings: { trogonstack: { sourceAliases: ['~/'] } },
      errors: [error('Chart', 'ChartClient')],
    },
    {
      code: "import { Chart as ChartClient } from './chart.client';",
      filename: 'C:\\repo\\src\\app\\page.tsx',
      errors: [error('Chart', 'ChartClient')],
    },
  ],
});
