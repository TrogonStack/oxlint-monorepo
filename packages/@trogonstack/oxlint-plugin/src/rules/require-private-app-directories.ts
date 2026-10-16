import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import { sourceDirectories, sourcePath } from '../shared/source-path.ts';

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
        const path = sourcePath(context);
        if (path === null) return;
        const directories = sourceDirectories(path);
        if (directories[0] !== 'app') return;
        const fractalDirectories = getTrogonstackSettings(context).fractalDirectories;
        for (const segment of directories.slice(1)) {
          if (segment.startsWith('_')) return;
          if (fractalDirectories.includes(segment)) {
            context.report({ node, messageId: 'publicDirectory', data: { name: segment } });
            return;
          }
        }
      },
    };
  },
});
