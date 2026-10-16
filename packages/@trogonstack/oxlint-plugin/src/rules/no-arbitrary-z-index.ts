import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

import { getStaticClassPaths } from '../shared/class-paths.ts';
import { getJSXExpression, isJSXAttributeNamed } from '../shared/jsx.ts';
import {
  getPropertyName,
  getPropertyValue,
  splitClasses,
  styleObjectProperties,
} from '../shared/style-object.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

const DEFAULT_MAX_Z_INDEX = 998;

function classHasArbitraryZIndex(value: string, maxZIndex: number): boolean {
  return splitClasses(value).some((item) => {
    const arbitrary = /^z-\[(\d+)]$/.exec(item);
    if (arbitrary !== null) return Number(arbitrary[1]) > maxZIndex;

    const direct = /^z-(\d{3,})$/.exec(item);
    return direct !== null ? Number(direct[1]) > maxZIndex : false;
  });
}

function styleHasArbitraryZIndex(
  expression: ESTree.JSXExpression | null,
  maxZIndex: number,
): boolean {
  return styleObjectProperties(expression).some((property) => {
    if (getPropertyName(property) !== 'zIndex') return false;

    const value = Number(getPropertyValue(property));
    return Number.isFinite(value) && value > maxZIndex;
  });
}

function maxZIndexOption(options: readonly unknown[]): number {
  const option = options[0];
  if (typeof option === 'object' && option !== null && 'maxZIndex' in option) {
    const { maxZIndex } = option;
    if (typeof maxZIndex === 'number') return maxZIndex;
  }
  return DEFAULT_MAX_Z_INDEX;
}

/** Discourage arbitrary z-index values outside a semantic stacking scale. */
export const noArbitraryZIndexRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('no-arbitrary-z-index'),
      description: 'Discourage arbitrary z-index values outside a semantic stacking scale.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxZIndex: { type: 'integer', minimum: 0 },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ maxZIndex: DEFAULT_MAX_Z_INDEX }],
    messages: {
      arbitraryZIndex:
        'Avoid arbitrary high z-index values. Use a semantic stacking token or scale.',
    },
  },
  createOnce(context) {
    return {
      JSXAttribute(node) {
        const maxZIndex = maxZIndexOption(context.options);

        if (isJSXAttributeNamed(node, 'className')) {
          const paths = getStaticClassPaths(node);
          if (paths.some((path) => classHasArbitraryZIndex(path, maxZIndex))) {
            context.report({ node, messageId: 'arbitraryZIndex' });
          }
        }

        if (
          isJSXAttributeNamed(node, 'style') &&
          styleHasArbitraryZIndex(getJSXExpression(node), maxZIndex)
        ) {
          context.report({ node, messageId: 'arbitraryZIndex' });
        }
      },
    };
  },
});
