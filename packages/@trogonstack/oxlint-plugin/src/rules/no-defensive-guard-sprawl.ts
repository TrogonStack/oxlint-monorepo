import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

import { isUndefinedIdentifier } from '../shared/static-expression.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

type FunctionNode = ESTree.ArrowFunctionExpression | ESTree.Function;

const DEFAULT_MAX_GUARDS = 2;
const VALIDATOR_NAME_RE = /^(?:is|has|can|should|assert|ensure|validate)[A-Z_]/;
const EQUALITY_OPERATORS: ReadonlySet<string> = new Set(['==', '!=', '===', '!==']);

function functionName(node: FunctionNode): string | null {
  if (node.id !== null) return node.id.name;

  const parent = node.parent;
  if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier')
    return parent.id.name;
  if (parent.type === 'Property' && !parent.computed && parent.key.type === 'Identifier')
    return parent.key.name;
  if (parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition')
    return classMemberName(parent);
  if (parent.type === 'AssignmentExpression' && parent.right === node)
    return assignmentTargetName(parent.left);
  return null;
}

function classMemberName(
  member: ESTree.MethodDefinition | ESTree.PropertyDefinition,
): string | null {
  if (member.computed) return null;
  const key = member.key;
  return key.type === 'Identifier' || key.type === 'PrivateIdentifier' ? key.name : null;
}

function assignmentTargetName(target: ESTree.Node): string | null {
  if (target.type === 'Identifier') return target.name;
  if (
    target.type === 'MemberExpression' &&
    !target.computed &&
    target.property.type === 'Identifier'
  )
    return target.property.name;
  return null;
}

function isValidatorFunction(node: FunctionNode): boolean {
  const name = functionName(node);
  return name !== null && VALIDATOR_NAME_RE.test(name);
}

function isNullLiteral(node: ESTree.Node): boolean {
  return node.type === 'Literal' && node.value === null;
}

function isNullishOperand(node: ESTree.Node): boolean {
  return isNullLiteral(node) || isUndefinedIdentifier(node);
}

function isTypeof(node: ESTree.Node): boolean {
  return node.type === 'UnaryExpression' && node.operator === 'typeof';
}

function isUndefinedString(node: ESTree.Node): boolean {
  return node.type === 'Literal' && node.value === 'undefined';
}

function isIsRecordCall(node: ESTree.Node): boolean {
  if (node.type !== 'CallExpression') return false;

  const callee = node.callee;
  if (callee.type === 'Identifier') return callee.name === 'isRecord';

  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'isRecord'
  );
}

function hasNullishOrRecordCheck(node: ESTree.Node): boolean {
  if (isIsRecordCall(node)) return true;

  if (node.type === 'UnaryExpression') return hasNullishOrRecordCheck(node.argument);
  if (node.type === 'ChainExpression') return hasNullishOrRecordCheck(node.expression);
  if (node.type === 'LogicalExpression') {
    return hasNullishOrRecordCheck(node.left) || hasNullishOrRecordCheck(node.right);
  }

  if (node.type !== 'BinaryExpression' || !EQUALITY_OPERATORS.has(node.operator)) return false;

  if (isNullishOperand(node.left) || isNullishOperand(node.right)) return true;

  return (
    (isTypeof(node.left) && isUndefinedString(node.right)) ||
    (isTypeof(node.right) && isUndefinedString(node.left))
  );
}

function isAbruptGuard(statement: ESTree.Node): statement is ESTree.IfStatement {
  if (statement.type !== 'IfStatement' || statement.alternate !== null) return false;

  const consequent = statement.consequent;
  const body = consequent.type === 'BlockStatement' ? consequent.body : [consequent];
  return (
    body.length > 0 &&
    body.every((item) => item.type === 'ReturnStatement' || item.type === 'ThrowStatement')
  );
}

function countLeadingDefensiveGuards(body: readonly ESTree.Node[]): number {
  let count = 0;

  for (const statement of body) {
    if (!isAbruptGuard(statement) || !hasNullishOrRecordCheck(statement.test)) break;
    count += 1;
  }

  return count;
}

function maxGuardsOption(options: readonly unknown[]): number {
  const option = options[0];
  if (typeof option === 'object' && option !== null && 'maxGuards' in option) {
    const { maxGuards } = option;
    if (typeof maxGuards === 'number') return maxGuards;
  }
  return DEFAULT_MAX_GUARDS;
}

/** Discourage repeated defensive null and record guards in ordinary functions. */
export const noDefensiveGuardSprawlRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('no-defensive-guard-sprawl'),
      description: 'Discourage repeated defensive null and record guards in ordinary functions.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxGuards: { type: 'integer', minimum: 0 },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ maxGuards: DEFAULT_MAX_GUARDS }],
    messages: {
      guardSprawl:
        'This function stacks {{count}} defensive null/record guards. Centralize shape validation in a small helper instead.',
    },
  },
  createOnce(context) {
    function checkFunction(node: FunctionNode): void {
      if (isValidatorFunction(node) || node.body === null || node.body.type !== 'BlockStatement') {
        return;
      }

      const guardCount = countLeadingDefensiveGuards(node.body.body);
      if (guardCount <= maxGuardsOption(context.options)) return;

      context.report({ node, messageId: 'guardSprawl', data: { count: String(guardCount) } });
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});
