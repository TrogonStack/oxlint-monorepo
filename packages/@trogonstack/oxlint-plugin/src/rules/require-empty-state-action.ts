import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import {
  isNumericLiteral,
  isStringLiteral,
  isUndefinedIdentifier,
  staticExpressionNullish,
  templateCookedText,
  unwrapStaticExpression,
} from '../shared/static-expression.ts';
import { normalizeLower, patternMatches } from '../shared/text.ts';
import { getStaticUiPaths } from '../shared/ui-paths.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

type Maybe<T> = T | null | undefined;
type JSXChildContainer = ESTree.JSXElement | ESTree.JSXFragment;

const MESSAGE_ELEMENT_NAMES: ReadonlySet<string> = new Set([
  'p',
  'span',
  'small',
  'strong',
  'em',
  'b',
  'i',
  'label',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]);

function staticTruthiness(expression: Maybe<ESTree.Node>): boolean | null {
  const subject = unwrapStaticExpression(expression);
  if (subject?.type === 'Literal') return Boolean(subject.value);

  if (subject?.type === 'TemplateLiteral' && subject.expressions.length === 0) {
    return Boolean(templateCookedText(subject));
  }

  if (isUndefinedIdentifier(subject)) return false;

  if (subject?.type === 'UnaryExpression') {
    if (subject.operator === 'void') return false;
    if (subject.operator === '!') {
      const truthiness = staticTruthiness(subject.argument);
      return truthiness === null ? null : !truthiness;
    }
    if (
      (subject.operator === '+' || subject.operator === '-') &&
      isNumericLiteral(subject.argument)
    ) {
      return Boolean(subject.operator === '+' ? +subject.argument.value : -subject.argument.value);
    }
  }

  return null;
}

function staticTextPaths(expression: Maybe<ESTree.Node>): string[] {
  const subject = unwrapStaticExpression(expression);
  if (isStringLiteral(subject)) return [subject.value];

  if (subject?.type === 'TemplateLiteral' && subject.expressions.length === 0) {
    return [templateCookedText(subject)];
  }

  if (subject?.type === 'ConditionalExpression') {
    return [...staticTextPaths(subject.consequent), ...staticTextPaths(subject.alternate)];
  }

  if (subject?.type === 'LogicalExpression') {
    if (subject.operator === '&&') {
      if (staticTruthiness(subject.left) === false) return [];
      return staticTextPaths(subject.right);
    }

    if (subject.operator === '||') {
      const truthiness = staticTruthiness(subject.left);
      if (truthiness === true) return staticTextPaths(subject.left);
      if (truthiness === false) return staticTextPaths(subject.right);
      return [...staticTextPaths(subject.left), ...staticTextPaths(subject.right)];
    }

    const nullish = staticExpressionNullish(subject.left);
    if (nullish === true) return staticTextPaths(subject.right);
    if (nullish === false) return staticTextPaths(subject.left);
    return [...staticTextPaths(subject.left), ...staticTextPaths(subject.right)];
  }

  return [];
}

function elementName(node: ESTree.JSXElement): string {
  const name = node.openingElement.name;
  return name.type === 'JSXIdentifier' ? name.name.toLowerCase() : '';
}

function inlineStaticText(node: JSXChildContainer): string | null {
  let text = '';

  for (const child of node.children) {
    if (child.type === 'JSXText') {
      text += child.value;
      continue;
    }

    if (child.type === 'JSXExpressionContainer') {
      const texts = staticTextPaths(child.expression);
      const [only] = texts;
      if (texts.length !== 1 || only === undefined) return null;
      text += only;
      continue;
    }

    if (
      child.type === 'JSXFragment' ||
      (child.type === 'JSXElement' && MESSAGE_ELEMENT_NAMES.has(elementName(child)))
    ) {
      const nestedText = inlineStaticText(child);
      if (nestedText === null) return null;
      text += nestedText;
      continue;
    }

    return null;
  }

  return text;
}

function directMessageTexts(node: ESTree.JSXElement): string[] {
  const texts: string[] = [];
  let literalText = '';
  let interpolated = false;

  function flushLiteralText(): void {
    if (!interpolated && literalText.trim() !== '') texts.push(literalText);
    literalText = '';
    interpolated = false;
  }

  for (const child of node.children) {
    if (child.type === 'JSXText') {
      literalText += child.value;
      continue;
    }

    if (child.type === 'JSXExpressionContainer') {
      const expressionTexts = staticTextPaths(child.expression);
      if (expressionTexts.length > 0) {
        flushLiteralText();
        texts.push(...expressionTexts);
      } else if (child.expression.type !== 'JSXEmptyExpression') {
        interpolated = true;
      }
      continue;
    }

    if (child.type === 'JSXFragment') {
      const nestedText = inlineStaticText(child);
      if (nestedText !== null) literalText += nestedText;
      continue;
    }

    if (
      child.type === 'JSXElement' &&
      MESSAGE_ELEMENT_NAMES.has(elementName(node)) &&
      MESSAGE_ELEMENT_NAMES.has(elementName(child))
    ) {
      const nestedText = inlineStaticText(child);
      if (nestedText !== null) literalText += nestedText;
    }
  }

  flushLiteralText();
  return texts.map((text) => normalizeLower(text.replace(/\s+/g, ' '))).filter(Boolean);
}

function isHighConfidenceEmptyState(text: string): boolean {
  if (/^no\s+action\s+required(?:[.!?]|$)/.test(text)) return false;

  return /^(?:no\s+[a-z0-9][a-z0-9-]*|nothing found|0 results|not found|empty)(?:[.!?]|$)/.test(
    text,
  );
}

function localBoundary(node: ESTree.JSXElement): ESTree.Node {
  let current: ESTree.Node = node;
  while (current.parent !== null) {
    const parent: ESTree.Node = current.parent;
    if (parent.type === 'JSXElement') {
      if (MESSAGE_ELEMENT_NAMES.has(elementName(parent))) {
        current = parent;
        continue;
      }
      return parent;
    }
    current = parent;
  }
  return node;
}

export const requireEmptyStateActionRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('require-empty-state-action'),
      description: 'Require explicit actions in local empty-state UI blocks.',
    },
    schema: [],
    messages: {
      emptyStateAction:
        'Empty state text found without actionable wording or a usable control in its local UI block.',
    },
  },
  createOnce(context) {
    const reportedBoundaries = new WeakSet<ESTree.Node>();

    return {
      JSXElement(node) {
        const messageTexts = directMessageTexts(node);
        if (!messageTexts.some(isHighConfidenceEmptyState)) return;

        const boundary = localBoundary(node);
        if (reportedBoundaries.has(boundary)) return;
        reportedBoundaries.add(boundary);

        const { actionWords } = getTrogonstackSettings(context);
        const hasIncompletePath = getStaticUiPaths(boundary, actionWords).some((path) => {
          const texts = path.texts.map(normalizeLower);
          const actionTexts = path.actionTexts.map(normalizeLower);
          return (
            texts.some(isHighConfidenceEmptyState) &&
            !path.hasAction &&
            !actionTexts.some((text) => patternMatches(text, actionWords))
          );
        });
        if (hasIncompletePath) {
          context.report({ node, messageId: 'emptyStateAction' });
        }
      },
    };
  },
});
