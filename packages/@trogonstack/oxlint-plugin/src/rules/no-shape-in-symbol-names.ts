import { defineRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';
import { ruleDocsUrl } from '../shared/docs.ts';

const FORBIDDEN_SYMBOL_NAME = 'shape';

function containsForbiddenSymbolName(name: string): boolean {
  return name.toLowerCase().includes(FORBIDDEN_SYMBOL_NAME);
}

/** Ban the case-insensitive substring "shape" in every JavaScript and TypeScript symbol name. */
export const noForbiddenTermInSymbolNamesRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-shape-in-symbol-names'),
      description:
        'Disallow the case-insensitive substring "shape" in JavaScript, TypeScript, private, and JSX symbol names.',
    },
    messages: {
      forbiddenSymbolName:
        'Rename symbol "{{name}}" for its domain role; "shape" describes structure rather than ownership.',
    },
  },
  createOnce(context) {
    const reportedRangeStarts = new Set<number>();

    const reportForbiddenSymbolName = (node: ESTree.Node & { name: string }) => {
      if (!containsForbiddenSymbolName(node.name)) return;
      if (reportedRangeStarts.has(node.range[0])) return;
      reportedRangeStarts.add(node.range[0]);
      context.report({
        node,
        messageId: 'forbiddenSymbolName',
        data: { name: node.name },
      });
    };

    return {
      before() {
        reportedRangeStarts.clear();
      },
      Identifier: reportForbiddenSymbolName,
      PrivateIdentifier: reportForbiddenSymbolName,
      JSXIdentifier: reportForbiddenSymbolName,
    };
  },
});
