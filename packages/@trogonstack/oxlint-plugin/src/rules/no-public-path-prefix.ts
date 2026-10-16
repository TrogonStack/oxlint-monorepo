import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';

import type { ESTree } from '@oxlint/plugins';

const PUBLIC_PATH = /^\/public(?:\/|$)/u;

export const noPublicPathPrefixRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-public-path-prefix'),
      description:
        'Disallow URLs that start with `/public`, since files in `public` are served from the site root.',
    },
    schema: [],
    messages: {
      publicPrefix:
        'Files in `public` are served from the site root. Use `{{path}}` instead of `{{value}}`.',
    },
  },
  createOnce(context) {
    const check = (node: ESTree.Node, value: string) => {
      if (!PUBLIC_PATH.test(value)) return;
      context.report({
        node,
        messageId: 'publicPrefix',
        data: { value, path: value.replace(PUBLIC_PATH, '/') },
      });
    };
    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      TemplateLiteral(node) {
        const first = node.quasis[0];
        if (first !== undefined) check(node, first.value.cooked ?? first.value.raw);
      },
    };
  },
});
