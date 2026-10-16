import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';

function hasServerSegment(filename: string): boolean {
  const baseName = filename.replaceAll('\\', '/').split('/').at(-1) ?? '';
  return baseName.split('.').slice(1, -1).includes('server');
}

export const noServerFileSuffixRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-server-file-suffix'),
      description:
        'Disallow the `.server` file name suffix; server is the default, so name client files `*.client.*` instead.',
    },
    schema: [],
    messages: {
      serverSuffix:
        'Do not use the `.server` suffix. Server is the default rendering strategy; name client-only files `*.client.*` instead.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        if (hasServerSegment(context.filename)) {
          context.report({ node, messageId: 'serverSuffix' });
        }
      },
    };
  },
});
