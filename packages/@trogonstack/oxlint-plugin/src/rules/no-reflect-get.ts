import { defineRule } from '@oxlint/plugins';

import { isGlobalReflectMethodCall } from '../shared/reflect-method.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

/** Ban Reflect.get, which bypasses ordinary property access and useful type evidence. */
export const noReflectGetRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('no-reflect-get'),
      description:
        'Disallow Reflect.get; use typed property access or parse dynamic input into a domain type.',
    },
    messages: {
      reflectGet:
        'Replace `Reflect.get` with typed property access. Parse dynamic input into a named domain type before reading it.',
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === 'Super' || node.callee.type === 'V8IntrinsicExpression') return;
        if (isGlobalReflectMethodCall(context.sourceCode, node.callee, 'get')) {
          context.report({ node, messageId: 'reflectGet' });
        }
      },
    };
  },
});
