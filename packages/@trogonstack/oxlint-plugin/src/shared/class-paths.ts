import type { ESTree } from '@oxlint/plugins';

import {
  isNumericLiteral,
  isStringLiteral,
  isUndefinedIdentifier,
  staticExpressionNullish,
  templateCookedText,
  unwrapStaticExpression,
} from './static-expression.ts';

type Node = ESTree.Node;
type Maybe<T> = T | null | undefined;

const CLASS_BUILDER_NAMES: ReadonlySet<string> = new Set([
  'clsx',
  'classnames',
  'classNames',
  'cn',
  'cx',
  'cva',
  'twMerge',
  'twJoin',
]);
const MAX_STATIC_CLASS_PATHS = 64;

function classBuilderName(callee: ESTree.Expression): string | null {
  if (callee.type === 'Identifier') return callee.name;
  if (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier'
  ) {
    return callee.property.name;
  }
  return null;
}

function normalizeClassPath(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function uniquePaths(paths: readonly string[]): string[] {
  return [...new Set(paths.map(normalizeClassPath))].slice(0, MAX_STATIC_CLASS_PATHS);
}

function combinePaths(groups: readonly (readonly string[])[]): string[] {
  let paths = [''];

  for (const group of groups) {
    const nextPaths: string[] = [];
    for (const left of paths) {
      for (const right of group) {
        nextPaths.push([left, right].filter(Boolean).join(' '));
        if (nextPaths.length >= MAX_STATIC_CLASS_PATHS) break;
      }
      if (nextPaths.length >= MAX_STATIC_CLASS_PATHS) break;
    }
    paths = uniquePaths(nextPaths);
  }

  return paths;
}

function classTruthiness(node: Maybe<Node>): boolean | null {
  const subject = unwrapStaticExpression(node);
  if (subject?.type === 'Literal') return Boolean(subject.value);

  if (subject?.type === 'TemplateLiteral' && subject.expressions.length === 0) {
    return Boolean(templateCookedText(subject));
  }

  if (isUndefinedIdentifier(subject)) return false;

  if (subject?.type === 'UnaryExpression') {
    if (subject.operator === 'void') return false;
    if (subject.operator === '!') {
      const truthiness = classTruthiness(subject.argument);
      return truthiness === null ? null : !truthiness;
    }
    if (
      (subject.operator === '+' || subject.operator === '-') &&
      isNumericLiteral(subject.argument)
    ) {
      return Boolean(subject.operator === '+' ? +subject.argument.value : -subject.argument.value);
    }
  }

  if (subject?.type === 'LogicalExpression') {
    const leftTruthiness = classTruthiness(subject.left);
    const rightTruthiness = classTruthiness(subject.right);
    if (subject.operator === '&&') {
      if (leftTruthiness === false || rightTruthiness === false) return false;
      return leftTruthiness === true ? rightTruthiness : null;
    }
    if (subject.operator === '||') {
      if (leftTruthiness === true || rightTruthiness === true) return true;
      return leftTruthiness === false ? rightTruthiness : null;
    }
  }

  return null;
}

function templatePath(node: ESTree.TemplateLiteral): string {
  if (node.expressions.length === 0) return templateCookedText(node);

  const fragments: string[] = [];
  for (const [index, quasi] of node.quasis.entries()) {
    let text = quasi.value.cooked ?? '';
    if (index > 0) text = text.replace(/^\S+/, '');
    if (index < node.expressions.length) text = text.replace(/\S+$/, ' ');
    if (text.trim()) fragments.push(text);
  }

  return fragments.join(' ');
}

function objectKey(property: ESTree.ObjectProperty): string | null {
  if (property.computed) return null;
  if (isStringLiteral(property.key)) return property.key.value;
  return property.key.type === 'Identifier' ? property.key.name : null;
}

function classPaths(input: Maybe<Node>): string[] {
  const expression = unwrapStaticExpression(input);
  if (expression === null || expression === undefined) return [''];

  if (expression.type === 'Literal') {
    return typeof expression.value === 'string' ? [expression.value] : [''];
  }

  if (expression.type === 'TemplateLiteral') return [templatePath(expression)];

  if (expression.type === 'ArrayExpression') {
    return combinePaths(expression.elements.map((element) => classPaths(element)));
  }

  if (expression.type === 'ObjectExpression') {
    let paths = [''];
    for (const property of expression.properties) {
      if (property.type !== 'Property') continue;

      const key = objectKey(property);
      if (key === null || key === '') continue;

      const truthiness = classTruthiness(property.value);
      if (truthiness === false) continue;

      const presentPaths = combinePaths([paths, [key]]);
      paths = truthiness === true ? presentPaths : uniquePaths([...presentPaths, ...paths]);
    }
    return paths;
  }

  if (expression.type === 'ConditionalExpression') {
    const truthiness = classTruthiness(expression.test);
    if (truthiness === true) return classPaths(expression.consequent);
    if (truthiness === false) return classPaths(expression.alternate);
    return uniquePaths([...classPaths(expression.consequent), ...classPaths(expression.alternate)]);
  }

  if (expression.type === 'LogicalExpression') {
    if (expression.operator === '&&') {
      const truthiness = classTruthiness(expression.left);
      if (truthiness === false) return [''];
      if (truthiness === true) return classPaths(expression.right);
      return uniquePaths(['', ...classPaths(expression.right)]);
    }

    if (expression.operator === '||') {
      const truthiness = classTruthiness(expression.left);
      if (truthiness === true) return classPaths(expression.left);
      if (truthiness === false) return classPaths(expression.right);
      return uniquePaths([...classPaths(expression.left), ...classPaths(expression.right)]);
    }

    const nullish = staticExpressionNullish(expression.left);
    if (nullish === true) return classPaths(expression.right);
    if (nullish === false) return classPaths(expression.left);
    return uniquePaths([...classPaths(expression.left), ...classPaths(expression.right)]);
  }

  if (expression.type === 'CallExpression') {
    const name = classBuilderName(expression.callee);
    if (name !== null && CLASS_BUILDER_NAMES.has(name)) {
      return combinePaths(expression.arguments.map((argument) => classPaths(argument)));
    }
  }

  return [''];
}

/** Enumerates the class strings a `className`-style attribute can statically produce. */
export function getStaticClassPaths(node: Maybe<ESTree.JSXAttribute>): string[] {
  const value = node?.value;
  if (value === null || value === undefined) return [];

  if (isStringLiteral(value)) return [value.value];

  if (value.type === 'JSXExpressionContainer') {
    return classPaths(value.expression).map(normalizeClassPath).filter(Boolean);
  }

  return [];
}
