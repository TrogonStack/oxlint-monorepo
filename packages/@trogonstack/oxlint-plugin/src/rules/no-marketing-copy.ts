import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import { getLiteralString, isLikelyUserFacingString, patternMatches } from '../shared/text.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

export const noMarketingCopyRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('no-marketing-copy'),
      description: 'Discourage generic marketing copy in product UI strings.',
    },
    schema: [],
    messages: {
      marketing: 'Generic marketing copy detected in user-facing text: `{{value}}`.',
    },
  },
  createOnce(context) {
    function check(node: ESTree.Node, rawValue: string): void {
      if (rawValue === '' || !isLikelyUserFacingString(node)) return;

      if (patternMatches(rawValue, getTrogonstackSettings(context).marketingPatterns)) {
        context.report({
          node,
          messageId: 'marketing',
          data: { value: rawValue.slice(0, 60) },
        });
      }
    }

    return {
      JSXText(node) {
        check(node, node.value);
      },
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      TemplateLiteral(node) {
        const value = getLiteralString(node);
        if (value !== null && value !== '') check(node, value);
      },
    };
  },
});
