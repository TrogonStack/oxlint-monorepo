import type { ESTree } from '@oxlint/plugins';

import {
  isNumericLiteral,
  isStringLiteral,
  staticTemplateValue,
  unwrapStaticExpression,
} from './static-expression.ts';

export type StyleValue = string | number;

export function splitClasses(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

export function getPropertyName(
  property: ESTree.ObjectPropertyKind | null | undefined,
): string | null {
  if (property?.type !== 'Property') return null;
  const key = property.key;
  if (key.type === 'Identifier' && !property.computed) return key.name;
  if (isStringLiteral(key)) return key.value;
  return null;
}

export function getPropertyValue(
  property: ESTree.ObjectPropertyKind | null | undefined,
): StyleValue | null {
  if (property?.type !== 'Property') return null;
  const value = unwrapStaticExpression(property.value);
  if (isStringLiteral(value) || isNumericLiteral(value)) return value.value;
  return staticTemplateValue(value);
}

export function styleObjectProperties(
  node: ESTree.Node | null | undefined,
): ESTree.ObjectProperty[] {
  const expression = unwrapStaticExpression(node);
  if (expression?.type !== 'ObjectExpression') return [];
  return expression.properties.filter((property) => property.type === 'Property');
}

export function stylePropertyMap(
  node: ESTree.Node | null | undefined,
): Map<string, StyleValue | null> {
  const map = new Map<string, StyleValue | null>();
  for (const property of styleObjectProperties(node)) {
    const name = getPropertyName(property);
    if (name !== null && name !== '') map.set(name, getPropertyValue(property));
  }
  return map;
}

/** Converts a bare number, px, or rem length to pixels, assuming 16px per rem. */
export function parseCssLengthPx(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;

  const match = /^(-?\d+(?:\.\d+)?)(px|rem)?$/.exec(value.trim().toLowerCase());
  if (match === null) return null;

  const numeric = Number.parseFloat(match[1] ?? '');
  if (!Number.isFinite(numeric)) return null;

  return match[2] === 'rem' ? numeric * 16 : numeric;
}
