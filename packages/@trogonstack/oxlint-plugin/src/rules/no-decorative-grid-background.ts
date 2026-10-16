import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

import { getStaticClassPaths } from '../shared/class-paths.ts';
import { getJSXExpression, isInsideJSXAttributeValue, isJSXAttributeNamed } from '../shared/jsx.ts';
import { staticTemplateValue } from '../shared/static-expression.ts';
import { getPropertyValue, styleObjectProperties } from '../shared/style-object.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

function hasDecorativeGrid(value: string): boolean {
  const text = value.toLowerCase();
  return (
    text.includes('linear-gradient') &&
    /(?<![\w.])1px/.test(text) &&
    (text.includes('90deg') || (text.match(/linear-gradient/g)?.length ?? 0) > 1)
  );
}

function styleHasDecorativeGrid(expression: ESTree.JSXExpression | null): boolean {
  return styleObjectProperties(expression).some((property) => {
    const value = getPropertyValue(property);
    return typeof value === 'string' && hasDecorativeGrid(value);
  });
}

/** Discourage decorative grid backgrounds unless the UI is a real canvas/map/measurement surface. */
export const noDecorativeGridBackgroundRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('no-decorative-grid-background'),
      description:
        'Discourage decorative grid backgrounds unless the UI is a real canvas/map/measurement surface.',
    },
    schema: [],
    messages: {
      decorativeGrid:
        'Decorative grid backgrounds are a common generated-UI tell. Use product structure or a plain surface instead.',
    },
  },
  createOnce(context) {
    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, 'className')) {
          const paths = getStaticClassPaths(node);
          if (paths.some(hasDecorativeGrid)) {
            context.report({ node, messageId: 'decorativeGrid' });
          }
        }

        if (isJSXAttributeNamed(node, 'style') && styleHasDecorativeGrid(getJSXExpression(node))) {
          context.report({ node, messageId: 'decorativeGrid' });
        }
      },
      Literal(node) {
        if (isInsideJSXAttributeValue(node)) return;

        if (typeof node.value === 'string' && hasDecorativeGrid(node.value)) {
          context.report({ node, messageId: 'decorativeGrid' });
        }
      },
      TemplateLiteral(node) {
        if (isInsideJSXAttributeValue(node)) return;

        const value = staticTemplateValue(node);
        if (value !== null && value !== '' && hasDecorativeGrid(value)) {
          context.report({ node, messageId: 'decorativeGrid' });
        }
      },
    };
  },
});
