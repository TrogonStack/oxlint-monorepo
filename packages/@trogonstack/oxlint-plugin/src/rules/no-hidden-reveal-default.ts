import { defineRule } from '@oxlint/plugins';

import { getStaticClassPaths } from '../shared/class-paths.ts';
import { getJSXExpression, isInsideJSXAttributeValue, isJSXAttributeNamed } from '../shared/jsx.ts';
import { staticTemplateValue } from '../shared/static-expression.ts';
import {
  getPropertyName,
  getPropertyValue,
  splitClasses,
  styleObjectProperties,
} from '../shared/style-object.ts';

import type { ESTree } from '@oxlint/plugins';
import { ruleDocsUrl } from '../shared/docs.ts';
import { parseClassToken } from '../shared/tailwind.ts';

function classHasHiddenReveal(value: string): boolean {
  const classes = splitClasses(value);
  const tokens = classes.map(parseClassToken);
  const hidden = tokens.some(
    (token) =>
      token.variants.length === 0 && (token.base === 'opacity-0' || token.base === 'invisible'),
  );
  const motion = tokens.some((token) =>
    /^(?:animate-|transition(?:-|$)|duration-)/.test(token.base),
  );
  return hidden && motion;
}

function styleHasHiddenReveal(expression: ESTree.Node | null): boolean {
  const properties = styleObjectProperties(expression);
  const hidden = properties.some((property) => {
    const name = getPropertyName(property);
    const value = getPropertyValue(property);
    return (
      (name === 'opacity' && Number(value) === 0) || (name === 'visibility' && value === 'hidden')
    );
  });
  const motion = properties.some((property) => {
    const name = getPropertyName(property);
    return name === 'animation' || name === 'transition';
  });
  return hidden && motion;
}

function cssStringHasHiddenReveal(value: string): boolean {
  return (
    /(?:opacity\s*:\s*0|visibility\s*:\s*hidden)/.test(value) &&
    /\b(?:animation|transition)\s*:/.test(value)
  );
}

export const noHiddenRevealDefaultRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('no-hidden-reveal-default'),
      description: 'Discourage reveal animations that hide content by default.',
    },
    schema: [],
    messages: {
      hiddenReveal:
        'Reveal animations should enhance already-visible content. Do not gate content behind hidden default state.',
    },
  },
  createOnce(context) {
    function report(node: ESTree.Node): void {
      context.report({ node, messageId: 'hiddenReveal' });
    }

    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, 'className')) {
          if (getStaticClassPaths(node).some(classHasHiddenReveal)) report(node);
        }

        if (isJSXAttributeNamed(node, 'style') && styleHasHiddenReveal(getJSXExpression(node))) {
          report(node);
        }
      },
      Literal(node) {
        if (isInsideJSXAttributeValue(node)) return;

        if (typeof node.value === 'string' && cssStringHasHiddenReveal(node.value)) report(node);
      },
      TemplateLiteral(node) {
        if (isInsideJSXAttributeValue(node)) return;

        const value = staticTemplateValue(node);
        if (value !== null && value !== '' && cssStringHasHiddenReveal(value)) report(node);
      },
    };
  },
});
