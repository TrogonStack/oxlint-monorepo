import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { sourceDirectories, sourceFileName, sourcePath } from '../shared/source-path.ts';

const TESTS_DIRECTORY = '__tests__';
const EXTENSIONS = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'mts', 'cts'];
const UNIT_TEST_FILE = new RegExp(`^(.+)\\.(?:test|spec)\\.(?:${EXTENSIONS.join('|')})$`, 'u');

export const requireColocatedUnitTestsRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-colocated-unit-tests'),
      description:
        'Require unit tests to sit next to the file they test instead of inside `__tests__`.',
    },
    schema: [],
    messages: {
      misplacedTest:
        'Unit tests must sit next to the file they test. `__tests__` is for testing support files.',
      missingSibling:
        'No sibling file named `{{name}}` was found next to this unit test. Name the test after the file it covers.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const path = sourcePath(context);
        if (path === null) return;
        const match = UNIT_TEST_FILE.exec(sourceFileName(path));
        const base = match?.[1];
        if (base === undefined) return;

        if (sourceDirectories(path).includes(TESTS_DIRECTORY)) {
          context.report({ node, messageId: 'misplacedTest' });
          return;
        }

        const directory = dirname(context.filename);
        const hasSibling = EXTENSIONS.some((extension) =>
          existsSync(join(directory, `${base}.${extension}`)),
        );
        if (hasSibling) return;
        context.report({
          node,
          messageId: 'missingSibling',
          data: { name: `${base}.[extension]` },
        });
      },
    };
  },
});
