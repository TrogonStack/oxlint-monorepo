import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

import { getStaticClassPaths } from '../shared/class-paths.ts';
import { getJSXExpression, isJSXAttributeNamed } from '../shared/jsx.ts';
import {
  getPropertyName,
  getPropertyValue,
  parseCssLengthPx,
  splitClasses,
  styleObjectProperties,
} from '../shared/style-object.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

const SIDE_BORDER_PROPERTIES: ReadonlySet<string> = new Set([
  'borderLeft',
  'borderRight',
  'borderLeftWidth',
  'borderRightWidth',
]);

function classHasSideStripe(value: string): boolean {
  return splitClasses(value).some((item) => {
    if (/^border-[lr]-(?:[2-9]|\d{2,})$/.test(item)) return true;

    const arbitrary = /^border-[lr]-\[(.+)]$/.exec(item);
    return arbitrary !== null ? (parseCssLengthPx(arbitrary[1]) ?? 0) > 1 : false;
  });
}

function borderWidthFromShorthand(value: unknown): number | null {
  if (typeof value !== 'string') return null;

  const match = /(\d+(?:\.\d+)?)(px|rem)?/.exec(value.toLowerCase());
  return match !== null ? parseCssLengthPx(`${match[1]}${match[2] ?? 'px'}`) : null;
}

function styleHasSideStripe(expression: ESTree.JSXExpression | null): boolean {
  return styleObjectProperties(expression).some((property) => {
    const name = getPropertyName(property);
    if (name === null || !SIDE_BORDER_PROPERTIES.has(name)) return false;

    const value = getPropertyValue(property);
    const width = name.endsWith('Width')
      ? parseCssLengthPx(value)
      : borderWidthFromShorthand(value);
    return width !== null && width > 1;
  });
}

/** Discourage thick left/right border stripe accents on cards and callouts. */
export const noSideStripeAccentRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('no-side-stripe-accent'),
      description: 'Discourage thick left/right border stripe accents on cards and callouts.',
    },
    schema: [],
    messages: {
      sideStripe:
        'Side-stripe accents are repetitive UI scaffolding. Use full borders, icons, or background contrast instead.',
    },
  },
  createOnce(context) {
    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, 'className')) {
          const paths = getStaticClassPaths(node);
          if (paths.some(classHasSideStripe)) {
            context.report({ node, messageId: 'sideStripe' });
          }
        }

        if (isJSXAttributeNamed(node, 'style') && styleHasSideStripe(getJSXExpression(node))) {
          context.report({ node, messageId: 'sideStripe' });
        }
      },
    };
  },
});
