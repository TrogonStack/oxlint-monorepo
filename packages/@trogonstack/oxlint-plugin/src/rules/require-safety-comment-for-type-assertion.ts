import { defineRule } from '@oxlint/plugins';

import type { ESTree, SourceCode } from '@oxlint/plugins';
import { ruleDocsUrl } from '../shared/docs.ts';

type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion;

const commentOwnerKinds = new Set([
  'MethodDefinition',
  'PropertyDefinition',
  'TSPropertySignature',
]);

function isCommentOwner(node: ESTree.Node): boolean {
  return commentOwnerKinds.has(node.type) || /(?:Statement|Declaration)$/u.test(node.type);
}

function isConstAssertion(node: TypeAssertion): boolean {
  return (
    node.typeAnnotation.type === 'TSTypeReference' &&
    node.typeAnnotation.typeName.type === 'Identifier' &&
    node.typeAnnotation.typeName.name === 'const'
  );
}

function hasSafetyComment(sourceCode: SourceCode, node: TypeAssertion): boolean {
  let current: ESTree.Node = node;
  while (true) {
    if (
      sourceCode
        .getCommentsBefore(current)
        .some((comment) => comment.end <= node.start && /\bSAFETY\s*:/u.test(comment.value))
    ) {
      return true;
    }
    const parentType = current.parent.type;
    if (parentType === 'ExportNamedDeclaration' || parentType === 'ExportDefaultDeclaration') {
      current = current.parent;
      continue;
    }
    if (isCommentOwner(current) || parentType === 'Program') return false;
    current = current.parent;
  }
}

/** Require every non-const type assertion to state the invariant TypeScript cannot express. */
export const requireSafetyCommentForTypeAssertionRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-safety-comment-for-type-assertion'),
      description:
        'Require a nearby SAFETY comment for every TypeScript type assertion except const assertions.',
    },
    messages: {
      missingSafetyComment:
        'This type assertion has no `SAFETY:` justification. State the checked invariant immediately before the assertion or its containing statement.',
    },
  },
  createOnce(context) {
    const checkAssertion = (node: TypeAssertion) => {
      if (isConstAssertion(node) || hasSafetyComment(context.sourceCode, node)) return;
      context.report({ node, messageId: 'missingSafetyComment' });
    };

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
});
