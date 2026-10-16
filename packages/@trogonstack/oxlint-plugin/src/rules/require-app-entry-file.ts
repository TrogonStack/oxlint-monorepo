import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { sourceFileName, sourcePath } from '../shared/source-path.ts';

const ENTRY_FILE = /^(?:main|index)\.(?:[cm]?[jt]s|[jt]sx)$/u;

export const requireAppEntryFileRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-app-entry-file'),
      description:
        'Require the application entry to be `src/app/index.tsx` instead of `src/main` or `src/index`.',
    },
    schema: [],
    messages: {
      misplacedEntry: 'The application entry must be `src/app/index.tsx`. Move this file there.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const path = sourcePath(context);
        if (path === null || path.segments.length !== 1) return;
        if (!ENTRY_FILE.test(sourceFileName(path))) return;
        context.report({ node, messageId: 'misplacedEntry' });
      },
    };
  },
});
