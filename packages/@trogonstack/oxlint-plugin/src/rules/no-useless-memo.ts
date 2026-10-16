import { defineRule } from '@oxlint/plugins';

import type { ESTree, Scope, SourceCode, Variable } from '@oxlint/plugins';
import { ruleDocsUrl } from '../shared/docs.ts';

type CallbackNode = ESTree.ArrowFunctionExpression | ESTree.Function;
type HookName = 'useMemo' | 'useCallback';

const TRIVIAL_EXPRESSION_TYPES: ReadonlySet<string> = new Set([
  'Literal',
  'TemplateLiteral',
  'Identifier',
  'MemberExpression',
  'BinaryExpression',
]);

function isHookName(value: string | null): value is HookName {
  return value === 'useMemo' || value === 'useCallback';
}

function isCallback(node: ESTree.Node | undefined): node is CallbackNode {
  return node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression';
}

function getReturnedExpression(callback: ESTree.Node | undefined): ESTree.Node | null {
  if (!isCallback(callback) || callback.body === null) return null;

  if (callback.body.type !== 'BlockStatement') return callback.body;

  const [first] = callback.body.body;
  if (callback.body.body.length === 1 && first?.type === 'ReturnStatement') {
    return first.argument;
  }

  return null;
}

function resolveVariable(sourceCode: SourceCode, node: ESTree.Node, name: string): Variable | null {
  let scope: Scope | null = sourceCode.getScope(node);
  while (scope !== null) {
    const variable = scope.variables.find((item) => item.name === name);
    if (variable !== undefined) return variable;
    scope = scope.upper;
  }
  return null;
}

function reactImportedName(variable: Variable | null): string | null {
  const def = variable?.defs[0];
  if (
    def === undefined ||
    def.type !== 'ImportBinding' ||
    def.parent?.type !== 'ImportDeclaration' ||
    def.parent.source.value !== 'react'
  ) {
    return null;
  }

  if (def.node.type === 'ImportSpecifier') {
    return def.node.imported.type === 'Identifier'
      ? def.node.imported.name
      : def.node.imported.value;
  }

  return '*';
}

function memberPropertyName(callee: ESTree.MemberExpression): string | null {
  const property = callee.property;
  if (property.type === 'Identifier' && !callee.computed) return property.name;
  if (property.type === 'Literal' && typeof property.value === 'string') return property.value;
  return null;
}

function resolveHookName(sourceCode: SourceCode, node: ESTree.CallExpression): HookName | null {
  const callee = node.callee;

  if (callee.type === 'Identifier') {
    const variable = resolveVariable(sourceCode, node, callee.name);
    if (variable === null) return isHookName(callee.name) ? callee.name : null;

    const imported = reactImportedName(variable);
    return isHookName(imported) ? imported : null;
  }

  if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') {
    const propertyName = memberPropertyName(callee);
    if (!isHookName(propertyName)) return null;

    const variable = resolveVariable(sourceCode, node, callee.object.name);
    if (variable === null) return callee.object.name === 'React' ? propertyName : null;

    return reactImportedName(variable) === '*' ? propertyName : null;
  }

  return null;
}

export const noUselessMemoRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('no-useless-memo'),
      description: 'Discourage trivial useMemo/useCallback usage.',
    },
    schema: [],
    messages: {
      uselessMemo: 'This `useMemo` appears trivial and likely unnecessary.',
      uselessCallback: 'This `useCallback` appears unnecessary without memo-sensitive usage.',
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const hookName = resolveHookName(context.sourceCode, node);

        if (hookName === 'useMemo') {
          const expression = getReturnedExpression(node.arguments[0]);
          if (expression !== null && TRIVIAL_EXPRESSION_TYPES.has(expression.type)) {
            context.report({ node, messageId: 'uselessMemo' });
          }
        }

        if (hookName === 'useCallback') {
          const callback = node.arguments[0];
          if (!isCallback(callback) || callback.body === null) return;

          const body = callback.body;
          if (body.type !== 'BlockStatement') {
            context.report({ node, messageId: 'uselessCallback' });
            return;
          }

          const hasSideEffect = body.body.some((statement) => statement.type !== 'ReturnStatement');
          if (!hasSideEffect) context.report({ node, messageId: 'uselessCallback' });
        }
      },
    };
  },
});
