import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { isDirective } from '../shared/module-directives.ts';
import { sourceDirectories, sourcePath } from '../shared/source-path.ts';

export const requireServerDirectivesRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-server-directives'),
      description:
        "Require `'use server'` and `import 'server-only'` in fractal `server` directories.",
    },
    schema: [],
    messages: {
      missingUseServer:
        'Files under a `server` directory must begin with the `use server` directive.',
      missingServerOnly: "Files under a `server` directory must contain `import 'server-only'`.",
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const path = sourcePath(context.filename);
        if (path === null) return;
        const isServerFile = sourceDirectories(path).some(
          (segment) => segment === 'server' || segment === '_server',
        );
        if (!isServerFile) return;

        if (!isDirective(node.body[0], 'use server')) {
          context.report({ node, messageId: 'missingUseServer' });
        }

        const hasServerOnly = node.body.some(
          (statement) =>
            statement.type === 'ImportDeclaration' &&
            statement.specifiers.length === 0 &&
            statement.source.value === 'server-only',
        );
        if (!hasServerOnly) context.report({ node, messageId: 'missingServerOnly' });
      },
    };
  },
});
