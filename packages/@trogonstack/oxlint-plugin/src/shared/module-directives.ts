import type { ESTree } from '@oxlint/plugins';

import { isStringLiteral } from './static-expression.ts';

/** Tells whether a statement is the given string directive, such as `'use client'`. */
export function isDirective(statement: ESTree.Node | undefined, value: string): boolean {
  return (
    statement?.type === 'ExpressionStatement' &&
    statement.expression.type === 'Literal' &&
    statement.expression.value === value
  );
}

export type ImportSourceVisitors = {
  ImportDeclaration: (node: ESTree.ImportDeclaration) => void;
  ExportNamedDeclaration: (node: ESTree.ExportNamedDeclaration) => void;
  ExportAllDeclaration: (node: ESTree.ExportAllDeclaration) => void;
  ImportExpression: (node: ESTree.ImportExpression) => void;
};

/** Builds visitors that report every static module source: imports, re-exports and string `import()` calls. */
export function importSourceVisitors(
  onSource: (node: ESTree.Node, source: string) => void,
): ImportSourceVisitors {
  return {
    ImportDeclaration(node) {
      onSource(node.source, node.source.value);
    },
    ExportNamedDeclaration(node) {
      if (node.source) onSource(node.source, node.source.value);
    },
    ExportAllDeclaration(node) {
      onSource(node.source, node.source.value);
    },
    ImportExpression(node) {
      if (isStringLiteral(node.source)) onSource(node.source, node.source.value);
    },
  };
}
