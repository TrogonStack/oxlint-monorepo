import { RuleTester } from 'oxlint/plugins-dev';

import { requireColocatedUnitTestsRule } from '../../../src/rules/require-colocated-unit-tests.ts';

const root = `${import.meta.dirname}/../../fixtures/colocated-unit-tests`;
const tester = new RuleTester({ cwd: root });
const misplaced = { messageId: 'misplacedTest' };
const missing = (name: string) => ({ messageId: 'missingSibling', data: { name } });

tester.run('trogonstack/require-colocated-unit-tests', requireColocatedUnitTestsRule, {
  valid: [
    { code: 'export {};', filename: `${root}/src/components/button.test.tsx` },
    { code: 'export {};', filename: `${root}/src/components/button.spec.ts` },
    { code: 'export {};', filename: `${root}/src/components/button.test.mts` },
    { code: 'export {};', filename: `${root}/src/components/button.tsx` },
    { code: 'export {};', filename: `${root}/src/components/button.module.css` },
    { code: 'export {};', filename: `${root}/src/components/__tests__/setup.ts` },
    { code: 'export {};', filename: `${root}/outside/orphan.test.ts` },
  ],
  invalid: [
    {
      code: 'export {};',
      filename: `${root}/src/components/orphan.test.tsx`,
      errors: [missing('orphan.[extension]')],
    },
    {
      code: 'export {};',
      filename: `${root}/src/components/orphan.spec.ts`,
      errors: [missing('orphan.[extension]')],
    },
    {
      code: 'export {};',
      filename: `${root}/src/components/button.stories.test.ts`,
      errors: [missing('button.stories.[extension]')],
    },
    {
      code: 'export {};',
      filename: `${root}/src/components/__tests__/button.test.tsx`,
      errors: [misplaced],
    },
    {
      code: 'export {};',
      filename: `${root}/src/__tests__/deep/button.spec.ts`,
      errors: [misplaced],
    },
  ],
});
