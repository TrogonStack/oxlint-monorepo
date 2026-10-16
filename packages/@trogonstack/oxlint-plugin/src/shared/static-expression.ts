import type { ESTree } from '@oxlint/plugins';

type Node = ESTree.Node;
type Maybe<T> = T | null | undefined;

export function isStringLiteral(node: Maybe<Node>): node is ESTree.StringLiteral {
  return node?.type === 'Literal' && typeof node.value === 'string';
}

export function isNumericLiteral(node: Maybe<Node>): node is ESTree.NumericLiteral {
  return node?.type === 'Literal' && typeof node.value === 'number';
}

export function isBooleanLiteral(node: Maybe<Node>): node is ESTree.BooleanLiteral {
  return node?.type === 'Literal' && typeof node.value === 'boolean';
}

export function isUndefinedIdentifier(node: Maybe<Node>): node is ESTree.IdentifierReference {
  return node?.type === 'Identifier' && node.name === 'undefined';
}

/** Reads the cooked text of a template literal without substitutions. */
export function staticTemplateValue(node: Maybe<Node>): string | null {
  if (node?.type !== 'TemplateLiteral' || node.expressions.length > 0) return null;
  return templateCookedText(node);
}

export function templateCookedText(node: ESTree.TemplateLiteral): string {
  return node.quasis.map((part) => part.value.cooked ?? '').join('');
}

/** Strips wrappers that never change the runtime value of an expression. */
export function unwrapStaticExpression(expression: Maybe<Node>): Maybe<Node> {
  let current = expression;
  while (
    current?.type === 'ChainExpression' ||
    current?.type === 'TSAsExpression' ||
    current?.type === 'TSNonNullExpression' ||
    current?.type === 'TSSatisfiesExpression'
  ) {
    current = current.expression;
  }
  return current;
}

/** Evaluates truthiness when it is knowable from syntax alone, otherwise null. */
export function staticExpressionTruthiness(expression: Maybe<Node>): boolean | null {
  const subject = unwrapStaticExpression(expression);
  if (subject?.type === 'Literal') return Boolean(subject.value);

  if (subject?.type === 'TemplateLiteral' && subject.expressions.length === 0) {
    return Boolean(templateCookedText(subject));
  }

  if (isUndefinedIdentifier(subject)) return false;

  if (subject?.type === 'UnaryExpression') {
    if (subject.operator === 'void') return false;
    if (subject.operator === '!') {
      const truthiness = staticExpressionTruthiness(subject.argument);
      return truthiness === null ? null : !truthiness;
    }
    if (
      (subject.operator === '+' || subject.operator === '-') &&
      isNumericLiteral(subject.argument)
    ) {
      return Boolean(subject.operator === '+' ? +subject.argument.value : -subject.argument.value);
    }
  }

  if (subject?.type === 'ConditionalExpression') {
    const testTruthiness = staticExpressionTruthiness(subject.test);
    if (testTruthiness === true) return staticExpressionTruthiness(subject.consequent);
    if (testTruthiness === false) return staticExpressionTruthiness(subject.alternate);
  }

  if (subject?.type === 'LogicalExpression') {
    const leftTruthiness = staticExpressionTruthiness(subject.left);
    const rightTruthiness = staticExpressionTruthiness(subject.right);
    if (subject.operator === '&&') {
      if (leftTruthiness === false || rightTruthiness === false) return false;
      return leftTruthiness === true ? rightTruthiness : null;
    }
    if (subject.operator === '||') {
      if (leftTruthiness === true || rightTruthiness === true) return true;
      return leftTruthiness === false ? rightTruthiness : null;
    }
    const leftNullish = staticExpressionNullish(subject.left);
    if (leftNullish === true) return staticExpressionTruthiness(subject.right);
    if (leftNullish === false) return leftTruthiness;
  }

  return null;
}

/** Reports a definitely nullish value as true, a definitely non-nullish literal as false. */
export function staticExpressionNullish(expression: Maybe<Node>): boolean | null {
  const subject = unwrapStaticExpression(expression);
  if (subject?.type === 'Literal') return subject.value === null;
  if (subject?.type === 'UnaryExpression' && subject.operator === 'void') return true;
  return isUndefinedIdentifier(subject) ? true : null;
}
