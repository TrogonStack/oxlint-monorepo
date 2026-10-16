import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';

type FunctionNode = ESTree.ArrowFunctionExpression | ESTree.Function;
type FunctionKind = 'component' | 'hook' | 'other';

const COMPONENT_NAME = /^[A-Z].*[a-z]/u;
const HOOK_NAME = /^use[A-Z]/u;
const JSX_FILE = /\.[cm]?[jt]sx$/u;
const COMPONENT_WRAPPERS: ReadonlySet<string> = new Set(['memo', 'forwardRef']);

function isComponentWrapper(call: ESTree.CallExpression): boolean {
  const callee = call.callee;
  if (callee.type === 'Identifier') return COMPONENT_WRAPPERS.has(callee.name);
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'React' &&
    callee.property.type === 'Identifier' &&
    COMPONENT_WRAPPERS.has(callee.property.name)
  );
}

function bindingName(node: FunctionNode): string | null {
  if (node.type === 'FunctionDeclaration') return node.id?.name ?? null;

  let current: ESTree.Node = node;
  let parent = current.parent;
  while (
    parent?.type === 'CallExpression' &&
    parent.arguments[0] === current &&
    isComponentWrapper(parent)
  ) {
    current = parent;
    parent = current.parent;
  }

  if (
    parent?.type === 'VariableDeclarator' &&
    parent.init === current &&
    parent.id.type === 'Identifier'
  ) {
    return parent.id.name;
  }
  return null;
}

function destructuredPattern(parameter: ESTree.ParamPattern): ESTree.ParamPattern | null {
  if (parameter.type === 'ObjectPattern') return parameter;
  if (parameter.type === 'AssignmentPattern' && parameter.left.type === 'ObjectPattern') {
    return parameter;
  }
  return null;
}

export const noDestructuredParametersRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-destructured-parameters'),
      description:
        'Disallow destructured function parameters; accept `props` in React components and hooks, and `args` elsewhere.',
    },
    schema: [],
    messages: {
      destructuredProps:
        'Do not destructure parameters in a React component or hook. Accept the object as `props` and read fields from it.',
      destructuredArgs:
        'Do not destructure parameters. Accept the object as `args` and read fields from it.',
      componentPropsName: 'The first parameter of a React component must be named `props`.',
    },
  },
  createOnce(context) {
    const functionKind = (node: FunctionNode): FunctionKind => {
      const name = bindingName(node);
      if (name === null) return 'other';
      if (HOOK_NAME.test(name)) return 'hook';
      if (COMPONENT_NAME.test(name) && JSX_FILE.test(context.filename)) return 'component';
      return 'other';
    };

    const check = (node: FunctionNode) => {
      const kind = functionKind(node);
      for (const parameter of node.params) {
        if (destructuredPattern(parameter) !== null) {
          context.report({
            node: parameter,
            messageId: kind === 'other' ? 'destructuredArgs' : 'destructuredProps',
          });
        }
      }

      const parameter = node.params[0];
      const first = parameter?.type === 'AssignmentPattern' ? parameter.left : parameter;
      if (kind === 'component' && first?.type === 'Identifier' && first.name !== 'props') {
        context.report({ node: first, messageId: 'componentPropsName' });
      }
    };

    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
    };
  },
});
