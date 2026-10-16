import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { isDirective } from '../shared/module-directives.ts';
import { sourceFileName, sourcePath } from '../shared/source-path.ts';

const CLIENT_FILE = /\.client\./u;
const REQUIRED_CLIENT_BASE_NAMES: ReadonlySet<string> = new Set(['error', 'global-error']);

export const requireClientFileSuffixRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-client-file-suffix'),
      description: 'Require files with a `use client` directive to be named `*.client.*`.',
    },
    schema: [],
    messages: {
      missingSuffix: 'Files with `use client` must be named `*.client.[extension]`.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const first = node.body[0];
        if (first === undefined || !isDirective(first, 'use client')) return;

        const fileName = context.filename.replaceAll('\\', '/').split('/').at(-1) ?? '';
        if (CLIENT_FILE.test(fileName)) return;

        const path = sourcePath(context);
        if (path !== null && path.segments[0] === 'app') {
          const baseName = sourceFileName(path).split('.')[0] ?? '';
          if (REQUIRED_CLIENT_BASE_NAMES.has(baseName)) return;
        }

        context.report({ node: first, messageId: 'missingSuffix' });
      },
    };
  },
});
