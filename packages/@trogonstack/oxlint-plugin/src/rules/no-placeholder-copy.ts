import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import { getLiteralString, isLikelyUserFacingString, patternMatches } from '../shared/text.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

export const noPlaceholderCopyRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-placeholder-copy'),
      description: 'Disallow placeholder copy in user-facing strings.',
    },
    schema: [],
    messages: {
      placeholder: 'Placeholder copy detected in user-facing text: `{{value}}`.',
    },
  },
  createOnce(context) {
    function check(node: ESTree.Node, rawValue: string): void {
      if (rawValue === '' || !isLikelyUserFacingString(node)) return;

      if (patternMatches(rawValue, getTrogonstackSettings(context).placeholderPatterns)) {
        context.report({
          node,
          messageId: 'placeholder',
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
