import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

import { getStaticClassPaths } from '../shared/class-paths.ts';
import { findJSXAttribute } from '../shared/jsx.ts';
import { splitClasses } from '../shared/style-object.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

function openingElementName(opening: ESTree.JSXOpeningElement): string {
  if (opening.name.type === 'JSXIdentifier') return opening.name.name;
  if (opening.name.type === 'JSXMemberExpression') return opening.name.property.name;
  return '';
}

function hasCardClass(opening: ESTree.JSXOpeningElement): boolean {
  const className = findJSXAttribute(opening, 'className');
  return getStaticClassPaths(className).some((path) =>
    splitClasses(path).some((item) => /^card(?:$|-|_)/.test(item)),
  );
}

function isCardElement(node: ESTree.JSXElement): boolean {
  const name = openingElementName(node.openingElement);
  return name === 'Card' || name.endsWith('Card') || hasCardClass(node.openingElement);
}

function firstNestedCard(node: ESTree.JSXElement): ESTree.JSXElement | null {
  const stack: ESTree.Node[] = [...node.children];
  while (stack.length > 0) {
    const current = stack.shift();
    if (current === undefined) continue;

    if (current.type === 'JSXElement') {
      if (isCardElement(current)) return current;
      stack.push(...current.children);
    }

    if (current.type === 'JSXExpressionContainer' && current.expression.type === 'JSXElement') {
      stack.push(current.expression);
    }
  }

  return null;
}

/** Discourage nested Card components or nested card class containers. */
export const noNestedCardsRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('no-nested-cards'),
      description: 'Discourage nested Card components or nested card class containers.',
    },
    schema: [],
    messages: {
      nestedCard:
        'Avoid nesting cards inside cards. Flatten the layout or use an unframed section.',
    },
  },
  createOnce(context) {
    return {
      JSXElement(node) {
        if (!isCardElement(node)) return;

        const nested = firstNestedCard(node);
        if (nested !== null) {
          context.report({ node: nested.openingElement, messageId: 'nestedCard' });
        }
      },
    };
  },
});
