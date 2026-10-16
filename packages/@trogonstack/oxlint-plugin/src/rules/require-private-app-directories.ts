import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { sourceDirectories, sourcePath } from '../shared/source-path.ts';

const FRACTAL_DIRECTORIES: ReadonlySet<string> = new Set([
  'services',
  'storages',
  'schemas',
  'components',
  'hooks',
  'contexts',
  'constants',
  'types',
  'styles',
  'assets',
  'i18n',
  'helpers',
  'server',
]);

export const requirePrivateAppDirectoriesRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-private-app-directories'),
      description:
        'Require fractal directories under `src/app` to be private folders prefixed with an underscore.',
    },
    schema: [],
    messages: {
      publicDirectory:
        'The `{{name}}` directory under `src/app` must be a private folder. Rename it to `_{{name}}`.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const path = sourcePath(context.filename);
        if (path === null) return;
        const directories = sourceDirectories(path);
        if (directories[0] !== 'app') return;
        for (const segment of directories.slice(1)) {
          if (segment.startsWith('_')) return;
          if (FRACTAL_DIRECTORIES.has(segment)) {
            context.report({ node, messageId: 'publicDirectory', data: { name: segment } });
            return;
          }
        }
      },
    };
  },
});
