import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { sourceDirectories, sourcePath } from '../shared/source-path.ts';

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PARAMETER = /^[A-Za-z0-9_-]+$/;
const RESERVED = new Set(['__tests__', '@types']);
const INTERCEPTING = /^(?:\((?:\.|\.\.|\.\.\.)\))+/;

function isKebab(value: string): boolean {
  return KEBAB.test(value);
}

function isAllowedSegment(segment: string): boolean {
  if (RESERVED.has(segment)) return true;
  if (isKebab(segment)) return true;
  if (segment.startsWith('_')) return isKebab(segment.slice(1));
  if (segment.startsWith('@')) return isKebab(segment.slice(1));
  const intercepting = INTERCEPTING.exec(segment);
  if (intercepting !== null) return isKebab(segment.slice(intercepting[0].length));
  if (segment.startsWith('(') && segment.endsWith(')')) return isKebab(segment.slice(1, -1));
  if (segment.startsWith('[[...') && segment.endsWith(']]')) {
    return PARAMETER.test(segment.slice(5, -2));
  }
  if (segment.startsWith('[...') && segment.endsWith(']')) {
    return PARAMETER.test(segment.slice(4, -1));
  }
  if (segment.startsWith('[') && segment.endsWith(']')) return PARAMETER.test(segment.slice(1, -1));
  return false;
}

function toKebab(value: string): string {
  return value
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replaceAll(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replaceAll(/[^A-Za-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .toLowerCase();
}

function suggest(segment: string): string {
  const intercepting = INTERCEPTING.exec(segment);
  if (intercepting !== null) {
    return `${intercepting[0]}${toKebab(segment.slice(intercepting[0].length))}`;
  }
  if (segment.startsWith('(') && segment.endsWith(')')) {
    return `(${toKebab(segment.slice(1, -1))})`;
  }
  const prefix = segment.startsWith('_') ? '_' : segment.startsWith('@') ? '@' : '';
  const kebab = toKebab(segment.slice(prefix.length));
  return kebab === '' ? 'directory' : `${prefix}${kebab}`;
}

export const requireKebabCaseDirectoriesRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-kebab-case-directories'),
      description:
        'Require every directory under `src` to be kebab-case, allowing framework route and private segments.',
    },
    schema: [],
    messages: {
      notKebabCase: 'The `{{name}}` directory must be kebab-case. Rename it to `{{suggestion}}`.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const path = sourcePath(context);
        if (path === null) return;
        const offending = sourceDirectories(path).find((segment) => !isAllowedSegment(segment));
        if (offending === undefined) return;
        context.report({
          node,
          messageId: 'notKebabCase',
          data: { name: offending, suggestion: suggest(offending) },
        });
      },
    };
  },
});
