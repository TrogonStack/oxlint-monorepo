import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { sourceDirectories, sourcePath } from '../shared/source-path.ts';

const TESTS_DIRECTORY = '__tests__';

export const noPrivateLibraryDirectoriesRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-private-library-directories'),
      description:
        'Disallow underscore-prefixed private directories inside libraries under `src/libs`, except `__tests__`.',
    },
    schema: [],
    messages: {
      privateDirectory:
        'The `{{name}}` directory inside a library under `src/libs` must not be private. Private folders belong to `src/app`.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const path = sourcePath(context.filename);
        if (path === null) return;
        const directories = sourceDirectories(path);
        if (directories[0] !== 'libs') return;
        const name = directories
          .slice(2)
          .find((segment) => segment.startsWith('_') && segment !== TESTS_DIRECTORY);
        if (name === undefined) return;
        context.report({ node, messageId: 'privateDirectory', data: { name } });
      },
    };
  },
});
