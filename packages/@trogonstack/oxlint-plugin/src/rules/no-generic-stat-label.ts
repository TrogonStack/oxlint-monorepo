import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import { isStringLiteral } from '../shared/static-expression.ts';
import { getLiteralString, normalizeLower } from '../shared/text.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

const TARGET_ATTRS: ReadonlySet<string> = new Set(['label', 'title', 'heading']);
const HEADING_TAGS: ReadonlySet<string> = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

export const noGenericStatLabelRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('no-generic-stat-label'),
      description: 'Discourage generic metrics/section labels.',
    },
    schema: [],
    messages: {
      genericLabel: 'Generic label `{{value}}` detected. Prefer domain-specific wording.',
    },
  },
  createOnce(context) {
    function reportIfBlocked(node: ESTree.Node, value: string): void {
      if (value === '') return;

      const blocked = getTrogonstackSettings(context).genericStatLabels.map(normalizeLower);
      if (blocked.includes(normalizeLower(value))) {
        context.report({ node, messageId: 'genericLabel', data: { value } });
      }
    }

    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || !TARGET_ATTRS.has(node.name.name)) return;
        if (node.value === null) return;

        if (isStringLiteral(node.value)) {
          reportIfBlocked(node.value, node.value.value);
          return;
        }

        if (node.value.type === 'JSXExpressionContainer') {
          const value = getLiteralString(node.value.expression);
          if (value !== null) reportIfBlocked(node.value.expression, value);
        }
      },
      JSXElement(node) {
        const name = node.openingElement.name;
        if (name.type !== 'JSXIdentifier' || !HEADING_TAGS.has(name.name.toLowerCase())) return;

        const [child] = node.children;
        if (node.children.length !== 1 || child?.type !== 'JSXText') return;

        reportIfBlocked(child, child.value);
      },
    };
  },
});
