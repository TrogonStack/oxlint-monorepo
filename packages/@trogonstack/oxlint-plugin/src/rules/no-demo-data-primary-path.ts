import { defineRule } from '@oxlint/plugins';

import type { ESTree, Scope, SourceCode, Variable } from '@oxlint/plugins';

import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

type Maybe<T> = T | null | undefined;

type NamedIdentifier = Extract<ESTree.Node, { type: 'Identifier'; name: string }>;

const ROUTE_FILE_RE = /(?:^|\/)(?:src\/)?app\/(?:.*\/)?(?:page|layout|route)\.(?:t|j)sx?$/;
const PAGES_FILE_RE = /(?:^|\/)(?:src\/)?pages\/.*\.(?:t|j)sx?$/;
const TYPE_WRAPPER_TYPES: ReadonlySet<string> = new Set([
  'TSAsExpression',
  'TSTypeAssertion',
  'TSNonNullExpression',
  'TSInstantiationExpression',
  'TSSatisfiesExpression',
]);
const LEXICAL_OWNER_TYPES: ReadonlySet<string> = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
  'Program',
]);

function isPrimaryRouteFile(filename: string): boolean {
  return ROUTE_FILE_RE.test(filename) || PAGES_FILE_RE.test(filename);
}

function unwrapExpression(node: Maybe<ESTree.Node>): Maybe<ESTree.Node> {
  let current = node;
  while (
    current !== null &&
    current !== undefined &&
    (current.type === 'AwaitExpression' ||
      current.type === 'ChainExpression' ||
      TYPE_WRAPPER_TYPES.has(current.type))
  ) {
    current =
      current.type === 'AwaitExpression'
        ? current.argument
        : 'expression' in current
          ? (current.expression as ESTree.Node)
          : null;
  }
  return current;
}

function calleeRootName(callee: ESTree.Node): string | null {
  let current: ESTree.Node = callee;
  for (;;) {
    if (current.type === 'ChainExpression' || current.type === 'MemberExpression') {
      current = current.type === 'ChainExpression' ? current.expression : current.object;
    } else if (current.type === 'CallExpression') {
      current = current.callee;
    } else {
      break;
    }
  }

  return current.type === 'Identifier' ? current.name : null;
}

function isImportBinding(node: ESTree.Node): boolean {
  const parentType = node.parent?.type;
  return (
    parentType === 'ImportSpecifier' ||
    parentType === 'ImportDefaultSpecifier' ||
    parentType === 'ImportNamespaceSpecifier'
  );
}

function isTypeOnlyImport(
  declaration: ESTree.ImportDeclaration,
  specifier: ESTree.ImportDeclarationSpecifier,
): boolean {
  return (
    declaration.importKind === 'type' ||
    (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')
  );
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

function lexicalOwner(node: ESTree.Node): ESTree.Node | null {
  let current: ESTree.Node | null = node;
  while (current !== null) {
    if (LEXICAL_OWNER_TYPES.has(current.type)) return current;
    current = current.parent;
  }
  return null;
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

function isDemoModule(source: string, moduleName: string): boolean {
  return source === moduleName || source.startsWith(`${moduleName}/`);
}

export const noDemoDataPrimaryPathRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-demo-data-primary-path'),
      description: 'Prevent top-level routes from relying on demo data as primary data source.',
    },
    schema: [],
    messages: {
      demoDataPrimary:
        'This route uses demo data outside a nullish fallback to a same-scope real-data result. Demo data should not be the primary source.',
    },
  },
  createOnce(context) {
    const demoBindingNames = new Set<string>();
    const sideEffectDemoImports: ESTree.ImportDeclaration[] = [];
    const demoReferences: NamedIdentifier[] = [];
    const realDataVariables = new Map<Variable, ESTree.Node | null>();

    function isRealDataCall(node: Maybe<ESTree.Node>): boolean {
      const expression = unwrapExpression(node);
      if (expression?.type !== 'CallExpression') return false;

      const rootName = calleeRootName(expression.callee);
      return (
        rootName !== null && getTrogonstackSettings(context).realDataIndicators.includes(rootName)
      );
    }

    function isRealDataExpression(node: Maybe<ESTree.Node>): boolean {
      const expression = unwrapExpression(node);
      if (isRealDataCall(expression)) return true;
      if (expression?.type !== 'Identifier') return false;

      const variable = variableFor(context.sourceCode, expression);
      return (
        variable !== null &&
        realDataVariables.has(variable) &&
        realDataVariables.get(variable) === lexicalOwner(expression)
      );
    }

    function isDemoBindingReference(node: NamedIdentifier): boolean {
      if (
        !demoBindingNames.has(node.name) ||
        isImportBinding(node) ||
        isStaticPropertyKey(node) ||
        isTypeOnlyReference(node)
      ) {
        return false;
      }

      const variable = variableFor(context.sourceCode, node);
      return variable?.defs.some((definition) => definition.type === 'ImportBinding') ?? false;
    }

    function isPermittedFallback(node: ESTree.Node): boolean {
      let expression = node;
      for (;;) {
        const wrapper = expression.parent;
        if (
          wrapper === null ||
          !TYPE_WRAPPER_TYPES.has(wrapper.type) ||
          !('expression' in wrapper) ||
          wrapper.expression !== expression
        ) {
          break;
        }
        expression = wrapper;
      }

      const parent = expression.parent;
      return (
        parent?.type === 'LogicalExpression' &&
        parent.operator === '??' &&
        parent.right === expression &&
        isRealDataExpression(parent.left)
      );
    }

    return {
      before() {
        demoBindingNames.clear();
        sideEffectDemoImports.length = 0;
        demoReferences.length = 0;
        realDataVariables.clear();
        return isPrimaryRouteFile(context.filename);
      },
      ImportDeclaration(node) {
        const source = node.source.value;
        const isDemo = getTrogonstackSettings(context).demoDataModules.some((moduleName) =>
          isDemoModule(source, moduleName),
        );
        if (!isDemo) return;

        if (node.specifiers.length === 0) {
          sideEffectDemoImports.push(node);
          return;
        }

        for (const specifier of node.specifiers) {
          if (!isTypeOnlyImport(node, specifier)) demoBindingNames.add(specifier.local.name);
        }
      },
      VariableDeclarator(node) {
        if (
          node.parent.type === 'VariableDeclaration' &&
          node.parent.kind === 'const' &&
          node.id.type === 'Identifier' &&
          isRealDataCall(node.init)
        ) {
          const variable = variableFor(context.sourceCode, node.id);
          if (variable !== null) realDataVariables.set(variable, lexicalOwner(node));
        }
      },
      Identifier(node) {
        if (isDemoBindingReference(node)) demoReferences.push(node);
      },
      'Program:exit'() {
        const [sideEffectImport] = sideEffectDemoImports;
        if (sideEffectImport !== undefined) {
          context.report({ node: sideEffectImport, messageId: 'demoDataPrimary' });
          return;
        }

        const invalidReference = demoReferences.find((node) => !isPermittedFallback(node));
        if (invalidReference !== undefined) {
          context.report({ node: invalidReference, messageId: 'demoDataPrimary' });
        }
      },
    };
  },
});
