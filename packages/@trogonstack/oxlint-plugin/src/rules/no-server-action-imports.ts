import { defineRule } from '@oxlint/plugins';

import type { ESTree, Scope, Variable } from '@oxlint/plugins';

import { isServerActionsPath } from '../shared/app-routes.ts';
import { ruleDocsUrl } from '../shared/docs.ts';
import { importSourceVisitors } from '../shared/module-directives.ts';
import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import { resolveSourceImport, sourcePath } from '../shared/source-path.ts';

type FunctionNode = ESTree.ArrowFunctionExpression | ESTree.Function;

function isFunctionNode(node: ESTree.Node | null | undefined): node is FunctionNode {
  return (
    node?.type === 'FunctionDeclaration' ||
    node?.type === 'FunctionExpression' ||
    node?.type === 'ArrowFunctionExpression'
  );
}

function declaredFunctions(statement: ESTree.Node): [string, FunctionNode][] {
  if (statement.type === 'FunctionDeclaration' && statement.id !== null) {
    return [[statement.id.name, statement]];
  }
  if (statement.type !== 'VariableDeclaration') return [];
  const result: [string, FunctionNode][] = [];
  for (const declarator of statement.declarations) {
    if (declarator.id.type === 'Identifier' && isFunctionNode(declarator.init)) {
      result.push([declarator.id.name, declarator.init]);
    }
  }
  return result;
}

export const noServerActionImportsRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-server-action-imports'),
      description: 'Disallow Server Actions from importing or calling other Server Actions.',
    },
    schema: [],
    messages: {
      importsAction: 'Do not import a Server Action file from another Server Action file.',
      callsAction:
        'Do not call the exported Server Action `{{name}}` from another Server Action. Extract the shared logic into a plain function.',
    },
  },
  createOnce(context) {
    let isActionsFile = false;
    const exportedFunctions = new Map<string, FunctionNode>();

    function topLevelCaller(node: ESTree.Node): FunctionNode | null {
      let current: ESTree.Node | null = node;
      let caller: FunctionNode | null = null;
      while (current !== null) {
        if (isFunctionNode(current)) caller = current;
        current = current.parent;
      }
      return caller;
    }

    function moduleVariable(identifier: ESTree.IdentifierReference): Variable | null {
      let scope: Scope | null = context.sourceCode.getScope(identifier);
      while (scope !== null) {
        const variable = scope.set.get(identifier.name);
        if (variable !== undefined) {
          return scope.type === 'module' || scope.type === 'global' ? variable : null;
        }
        scope = scope.upper;
      }
      return null;
    }

    const visitors = importSourceVisitors((node, source) => {
      if (!isActionsFile) return;
      const importer = sourcePath(context);
      if (importer === null) return;
      const target = resolveSourceImport(
        importer,
        source,
        getTrogonstackSettings(context).sourceAliases,
      );
      if (target !== null && isServerActionsPath(target)) {
        context.report({ node, messageId: 'importsAction' });
      }
    });

    return {
      before() {
        isActionsFile = false;
        exportedFunctions.clear();
      },
      Program(node) {
        const path = sourcePath(context);
        isActionsFile = path !== null && isServerActionsPath(path);
        if (!isActionsFile) return;

        const functions = new Map<string, FunctionNode>();
        const exportedNames = new Set<string>();
        for (const statement of node.body) {
          if (statement.type === 'ExportNamedDeclaration') {
            if (statement.declaration) {
              for (const [name, fn] of declaredFunctions(statement.declaration)) {
                functions.set(name, fn);
                exportedNames.add(name);
              }
            } else if (statement.source === null) {
              for (const specifier of statement.specifiers) {
                if (specifier.local.type === 'Identifier') exportedNames.add(specifier.local.name);
              }
            }
          } else {
            for (const [name, fn] of declaredFunctions(statement)) functions.set(name, fn);
          }
        }
        for (const name of exportedNames) {
          const fn = functions.get(name);
          if (fn !== undefined) exportedFunctions.set(name, fn);
        }
      },
      ImportDeclaration: visitors.ImportDeclaration,
      ExportNamedDeclaration: visitors.ExportNamedDeclaration,
      ExportAllDeclaration: visitors.ExportAllDeclaration,
      ImportExpression: visitors.ImportExpression,
      CallExpression(node) {
        if (!isActionsFile || node.callee.type !== 'Identifier') return;
        const callee = exportedFunctions.get(node.callee.name);
        if (callee === undefined) return;

        const caller = topLevelCaller(node);
        if (caller === null || caller === callee) return;
        const isExportedCaller = [...exportedFunctions.values()].includes(caller);
        if (!isExportedCaller) return;

        const variable = moduleVariable(node.callee);
        if (variable === null) return;
        const declaration = variable.defs[0]?.node;
        const isSameBinding =
          declaration === callee ||
          (declaration?.type === 'VariableDeclarator' && declaration.init === callee);
        if (!isSameBinding) return;

        context.report({ node, messageId: 'callsAction', data: { name: node.callee.name } });
      },
    };
  },
});
