import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { sourceFileName, sourcePath } from '../shared/source-path.ts';

const TYPES_DIRECTORY = '@types';
const DECLARATION_FILE = /\.d\.[cm]?ts$/u;

export const requireTypesDirectoryRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-types-directory'),
      description: 'Require TypeScript declaration files under `src` to live in `src/@types`.',
    },
    schema: [],
    messages: {
      misplacedDeclaration: 'Declaration files must live in `src/@types`.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const path = sourcePath(context);
        if (path === null) return;
        if (!DECLARATION_FILE.test(sourceFileName(path))) return;
        if (path.segments[0] === TYPES_DIRECTORY) return;
        context.report({ node, messageId: 'misplacedDeclaration' });
      },
    };
  },
});
