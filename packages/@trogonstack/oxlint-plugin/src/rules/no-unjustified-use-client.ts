import { defineRule } from '@oxlint/plugins';

import type { ESTree, Scope, SourceCode, Variable } from '@oxlint/plugins';

import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import { isStringLiteral } from '../shared/static-expression.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

type NamedIdentifier = Extract<ESTree.Node, { type: 'Identifier'; name: string }>;

const CLIENT_HOOKS: ReadonlySet<string> = new Set([
  'useState',
  'useEffect',
  'useLayoutEffect',
  'useReducer',
  'useRef',
  'useTransition',
  'useDeferredValue',
  'useImperativeHandle',
  'useSyncExternalStore',
  'useInsertionEffect',
  'useOptimistic',
  'useActionState',
]);
const BROWSER_GLOBALS: ReadonlySet<string> = new Set([
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'navigator',
]);
const TYPE_WRAPPER_TYPES: ReadonlySet<string> = new Set([
  'TSAsExpression',
  'TSTypeAssertion',
  'TSNonNullExpression',
  'TSInstantiationExpression',
  'TSSatisfiesExpression',
]);

function isTypeOnlyImport(
  declaration: ESTree.ImportDeclaration,
  specifier: ESTree.ImportDeclarationSpecifier,
): boolean {
  return (
    declaration.importKind === 'type' ||
    (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')
  );
}

function memberPropertyName(node: ESTree.MemberExpression): string | null {
  if (!node.computed && node.property.type === 'Identifier') return node.property.name;
  return isStringLiteral(node.property) ? node.property.value : null;
}

function isStaticPropertyKey(node: ESTree.Node): boolean {
  const parent = node.parent;
  return (
    parent !== null &&
    ((parent.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand) ||
      (parent.type === 'MemberExpression' && parent.property === node && !parent.computed))
  );
}

function isTypeOnlyReference(node: ESTree.Node): boolean {
  let current: ESTree.Node = node;
  let isInsideTypeTree = false;

  while (current.parent !== null) {
    const parent: ESTree.Node = current.parent;
    if (parent.type === 'TSTypeQuery') return true;

    if (!parent.type.startsWith('TS')) return isInsideTypeTree;

    isInsideTypeTree = true;
    if (TYPE_WRAPPER_TYPES.has(parent.type)) {
      return 'expression' in parent && parent.expression !== current;
    }
    current = parent;
  }

  return isInsideTypeTree;
}

function isImportBinding(node: ESTree.Node): boolean {
  const parentType = node.parent?.type;
  return (
    parentType === 'ImportSpecifier' ||
    parentType === 'ImportDefaultSpecifier' ||
    parentType === 'ImportNamespaceSpecifier'
  );
}

function variableFor(sourceCode: SourceCode, node: NamedIdentifier): Variable | null {
  let scope: Scope | null = sourceCode.getScope(node);
  while (scope !== null) {
    const variable = scope.set.get(node.name);
    if (variable !== undefined) return variable;
    scope = scope.upper;
  }
  return null;
}

function isUseClientDirective(statement: ESTree.Node | undefined): boolean {
  return (
    statement?.type === 'ExpressionStatement' &&
    statement.expression.type === 'Literal' &&
    statement.expression.value === 'use client'
  );
}

function isClientOnlyModule(source: string, moduleName: string): boolean {
  return source === moduleName || source.startsWith(`${moduleName}/`);
}

export const noUnjustifiedUseClientRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-unjustified-use-client'),
      description: 'Prevent unnecessary `use client` directives.',
    },
    schema: [],
    messages: {
      unjustified: 'Review `use client`; this file has no obvious client-only behavior.',
    },
  },
  createOnce(context) {
    let useClientDirective: ESTree.Node | null = null;
    let hasClientSignal = false;
    const clientHookLocalNames = new Set<string>();
    const reactNamespaceNames = new Set<string>();

    function isImportedBinding(node: NamedIdentifier): boolean {
      const variable = variableFor(context.sourceCode, node);
      return variable?.defs.some((definition) => definition.type === 'ImportBinding') ?? false;
    }

    function isGlobalReference(node: NamedIdentifier): boolean {
      const variable = variableFor(context.sourceCode, node);
      return variable === null || variable.defs.length === 0;
    }

    function isRuntimeReference(node: ESTree.Node): boolean {
      return !isImportBinding(node) && !isStaticPropertyKey(node) && !isTypeOnlyReference(node);
    }

    return {
      before() {
        useClientDirective = null;
        hasClientSignal = false;
        clientHookLocalNames.clear();
        reactNamespaceNames.clear();
      },
      Program(node) {
        const first = node.body[0];
        if (first !== undefined && isUseClientDirective(first)) useClientDirective = first;
      },
      ImportDeclaration(node) {
        const source = node.source.value;
        const runtimeSpecifiers = node.specifiers.filter(
          (specifier) => !isTypeOnlyImport(node, specifier),
        );
        if (
          getTrogonstackSettings(context).clientOnlyImports.some((moduleName) =>
            isClientOnlyModule(source, moduleName),
          ) &&
          (node.specifiers.length === 0 || runtimeSpecifiers.length > 0)
        ) {
          hasClientSignal = true;
        }

        for (const specifier of runtimeSpecifiers) {
          if (/^use[A-Z]/.test(specifier.local.name)) {
            clientHookLocalNames.add(specifier.local.name);
          }

          if (source !== 'react') continue;

          if (specifier.type === 'ImportSpecifier') {
            const imported =
              specifier.imported.type === 'Identifier'
                ? specifier.imported.name
                : specifier.imported.value;
            if (CLIENT_HOOKS.has(imported)) clientHookLocalNames.add(specifier.local.name);
          } else {
            reactNamespaceNames.add(specifier.local.name);
          }
        }
      },
      Identifier(node) {
        if (useClientDirective === null || !isRuntimeReference(node)) return;

        if (BROWSER_GLOBALS.has(node.name) && isGlobalReference(node)) {
          hasClientSignal = true;
          return;
        }

        if (clientHookLocalNames.has(node.name) && isImportedBinding(node)) {
          hasClientSignal = true;
        }
      },
      MemberExpression(node) {
        if (
          useClientDirective === null ||
          node.object.type !== 'Identifier' ||
          !isRuntimeReference(node.object)
        ) {
          return;
        }

        const propertyName = memberPropertyName(node);
        if (propertyName === null) return;

        if (
          reactNamespaceNames.has(node.object.name) &&
          CLIENT_HOOKS.has(propertyName) &&
          isImportedBinding(node.object)
        ) {
          hasClientSignal = true;
        }

        if (
          node.object.name === 'globalThis' &&
          BROWSER_GLOBALS.has(propertyName) &&
          isGlobalReference(node.object)
        ) {
          hasClientSignal = true;
        }
      },
      JSXAttribute(node) {
        if (useClientDirective === null) return;

        if (node.name.type === 'JSXIdentifier' && /^on[A-Z]/.test(node.name.name)) {
          hasClientSignal = true;
        }
      },
      'Program:exit'() {
        if (useClientDirective === null || hasClientSignal) return;

        context.report({ node: useClientDirective, messageId: 'unjustified' });
      },
    };
  },
});
