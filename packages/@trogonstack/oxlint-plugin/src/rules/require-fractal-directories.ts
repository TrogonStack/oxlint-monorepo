import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { TESTS_DIRECTORY, walkFractalDirectories } from '../shared/fractal-directories.ts';
import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import { sourceDirectories, sourcePath } from '../shared/source-path.ts';

export const requireFractalDirectoriesRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-fractal-directories'),
      description:
        'Require every directory under `src` to follow the fractal directory pattern of ADR 5541831634.',
    },
    schema: [],
    messages: {
      unknownDirectory:
        'The `{{directory}}` directory is not allowed in `{{parent}}`. Use a directory defined by the fractal pattern.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const path = sourcePath(context);
        if (path === null) return;
        const directories = sourceDirectories(path);
        const categories = new Set([
          ...getTrogonstackSettings(context).fractalDirectories,
          TESTS_DIRECTORY,
        ]);
        const index = walkFractalDirectories(directories, categories).unknownIndex;
        if (index === null) return;
        context.report({
          node,
          messageId: 'unknownDirectory',
          data: {
            directory: directories.slice(0, index + 1).join('/'),
            parent: ['src', ...directories.slice(0, index)].join('/'),
          },
        });
      },
    };
  },
});
