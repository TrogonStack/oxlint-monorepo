import type { ESTree } from '@oxlint/plugins';

import { isStringLiteral, templateCookedText } from './static-expression.ts';

const USER_FACING_JSX_ATTRS: ReadonlySet<string> = new Set([
  'aria-label',
  'alt',
  'label',
  'placeholder',
  'title',
]);

const USER_FACING_PROPERTY_KEYS: ReadonlySet<string> = new Set([
  'title',
  'description',
  'subtitle',
  'label',
  'placeholder',
  'emptyMessage',
  'heading',
]);

export function normalizeLower(value: string): string {
  return value.toLowerCase().trim();
}

export function patternMatches(value: string, patterns: readonly string[]): boolean {
  const lower = normalizeLower(value);
  return patterns.some((pattern) => lower.includes(normalizeLower(pattern)));
}

/** Reads a string literal or a template literal without substitutions. */
export function getLiteralString(node: ESTree.Node | null | undefined): string | null {
  if (isStringLiteral(node)) return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return templateCookedText(node);
  }
  return null;
}

function isUserFacingJsxAttribute(attribute: ESTree.JSXAttribute): boolean {
  return attribute.name.type === 'JSXIdentifier' && USER_FACING_JSX_ATTRS.has(attribute.name.name);
}

/** Reports whether a string node sits where users read it: JSX text, JSX child or attribute expressions, copy attributes, or copy keys. */
export function isLikelyUserFacingString(node: ESTree.Node): boolean {
  const parent = node.parent as ESTree.Node | null;
  if (parent === null) return false;

  if (node.type === 'JSXText') return true;

  if (parent.type === 'JSXAttribute') return isUserFacingJsxAttribute(parent);

  if (parent.type === 'JSXExpressionContainer') {
    const container = parent.parent as ESTree.Node | null;
    if (container?.type === 'JSXAttribute') return isUserFacingJsxAttribute(container);
    return container?.type === 'JSXElement' || container?.type === 'JSXFragment';
  }

  if (parent.type === 'Property') {
    const key = parent.key;
    if (key === node) return false;
    const keyName =
      key.type === 'Identifier' && !parent.computed
        ? key.name
        : isStringLiteral(key)
          ? key.value
          : null;
    return keyName !== null && USER_FACING_PROPERTY_KEYS.has(keyName);
  }

  return false;
}
