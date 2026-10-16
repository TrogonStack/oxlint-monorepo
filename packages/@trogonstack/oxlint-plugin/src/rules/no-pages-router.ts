import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { sourceDirectories, sourcePath } from '../shared/source-path.ts';

export const noPagesRouterRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-pages-router'),
      description: 'Disallow files under `src/pages`; use the App Router in `src/app`.',
    },
    schema: [],
    messages: {
      pagesRouter:
        'Do not use the Pages Router. Move this file into the App Router under `src/app`.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const path = sourcePath(context);
        if (path === null) return;
        if (sourceDirectories(path)[0] !== 'pages') return;
        context.report({ node, messageId: 'pagesRouter' });
      },
    };
  },
});
