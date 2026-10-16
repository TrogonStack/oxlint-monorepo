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
import { classBase } from '../shared/tailwind.ts';

const DEFAULT_MAX_RADIUS_PX = 31;

function classHasExcessiveRadius(value: string, maxRadiusPx: number): boolean {
  return splitClasses(value).some((token) => {
    const match = /^rounded(?:-[a-z]+)?-\[(.+)]$/.exec(classBase(token));
    return match !== null ? (parseCssLengthPx(match[1]) ?? 0) > maxRadiusPx : false;
  });
}

function styleHasExcessiveRadius(
  expression: ESTree.JSXExpression | null,
  maxRadiusPx: number,
): boolean {
  return styleObjectProperties(expression).some((property) => {
    if (!String(getPropertyName(property)).includes('Radius')) return false;

    return (parseCssLengthPx(getPropertyValue(property)) ?? 0) > maxRadiusPx;
  });
}

function maxRadiusPxOption(options: readonly unknown[]): number {
  const option = options[0];
  if (typeof option === 'object' && option !== null && 'maxRadiusPx' in option) {
    const { maxRadiusPx } = option;
    if (typeof maxRadiusPx === 'number') return maxRadiusPx;
  }
  return DEFAULT_MAX_RADIUS_PX;
}

/** Discourage oversized radius values on cards, sections, and inputs. */
export const noExcessiveRadiusRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('no-excessive-radius'),
      description: 'Discourage oversized radius values on cards, sections, and inputs.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxRadiusPx: { type: 'number', minimum: 0 },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ maxRadiusPx: DEFAULT_MAX_RADIUS_PX }],
    messages: {
      excessiveRadius:
        'This radius is unusually large for a framed UI surface. Use the project radius scale instead.',
    },
  },
  createOnce(context) {
    return {
      JSXAttribute(node) {
        const maxRadiusPx = maxRadiusPxOption(context.options);

        if (isJSXAttributeNamed(node, 'className')) {
          const paths = getStaticClassPaths(node);
          if (paths.some((path) => classHasExcessiveRadius(path, maxRadiusPx))) {
            context.report({ node, messageId: 'excessiveRadius' });
          }
        }

        if (
          isJSXAttributeNamed(node, 'style') &&
          styleHasExcessiveRadius(getJSXExpression(node), maxRadiusPx)
        ) {
          context.report({ node, messageId: 'excessiveRadius' });
        }
      },
    };
  },
});
