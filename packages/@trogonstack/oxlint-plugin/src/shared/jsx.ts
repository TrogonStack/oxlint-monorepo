import type { ESTree } from '@oxlint/plugins';

export function isJSXAttributeNamed(node: ESTree.JSXAttributeItem, name: string): boolean {
  return (
    node.type === 'JSXAttribute' && node.name.type === 'JSXIdentifier' && node.name.name === name
  );
}

/** Returns the expression inside `attr={...}`, or null for any other attribute value. */
export function getJSXExpression(
  node: ESTree.JSXAttribute | null | undefined,
): ESTree.JSXExpression | null {
  if (node?.value?.type !== 'JSXExpressionContainer') return null;
  return node.value.expression;
}

export function isInsideJSXAttributeValue(node: ESTree.Node): boolean {
  let current: ESTree.Node | null = node.parent;
  while (current !== null && current.type !== 'Program') {
    if (current.type === 'JSXAttribute') return true;
    current = current.parent;
  }
  return false;
}

export function findJSXAttribute(
  opening: ESTree.JSXOpeningElement,
  name: string,
): ESTree.JSXAttribute | null {
  for (const attribute of opening.attributes) {
    if (
      attribute.type === 'JSXAttribute' &&
      attribute.name.type === 'JSXIdentifier' &&
      attribute.name.name === name
    ) {
      return attribute;
    }
  }
  return null;
}
