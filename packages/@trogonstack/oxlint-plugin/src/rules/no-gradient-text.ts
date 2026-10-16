import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

import { getStaticClassPaths } from '../shared/class-paths.ts';
import { getJSXExpression, isJSXAttributeNamed } from '../shared/jsx.ts';
import { splitClasses, stylePropertyMap } from '../shared/style-object.ts';
import { ruleDocsUrl } from '../shared/docs.ts';
import { classBase } from '../shared/tailwind.ts';

function classNameHasGradientText(value: string): boolean {
  const classes = splitClasses(value).map(classBase);
  const hasClip = classes.includes('bg-clip-text') || classes.includes('background-clip-text');
  const hasTransparentText =
    classes.includes('text-transparent') || classes.includes('[color:transparent]');
  const hasGradient = classes.some(
    (item) => item.includes('gradient') || item.startsWith('from-') || item.startsWith('to-'),
  );
  return hasClip && hasTransparentText && hasGradient;
}

function styleHasGradientText(expression: ESTree.JSXExpression | null): boolean {
  const styles = stylePropertyMap(expression);
  const clip = String(
    styles.get('backgroundClip') ?? styles.get('WebkitBackgroundClip') ?? '',
  ).toLowerCase();
  const background = String(
    styles.get('background') ?? styles.get('backgroundImage') ?? '',
  ).toLowerCase();
  return clip === 'text' && background.includes('gradient(');
}

/** Discourage gradient-clipped text in product UI. */
export const noGradientTextRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('no-gradient-text'),
      description: 'Discourage gradient-clipped text in product UI.',
    },
    schema: [],
    messages: {
      gradientText:
        'Gradient text is a low-signal visual trope. Use a solid text color and hierarchy instead.',
    },
  },
  createOnce(context) {
    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, 'className')) {
          const paths = getStaticClassPaths(node);
          if (paths.some(classNameHasGradientText)) {
            context.report({ node, messageId: 'gradientText' });
          }
        }

        if (isJSXAttributeNamed(node, 'style') && styleHasGradientText(getJSXExpression(node))) {
          context.report({ node, messageId: 'gradientText' });
        }
      },
    };
  },
});
