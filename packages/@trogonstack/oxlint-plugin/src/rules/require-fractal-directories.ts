import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { sourceDirectories, sourcePath } from '../shared/source-path.ts';

type Scope = 'source' | 'app' | 'fractal';

const TESTS_DIRECTORY = '__tests__';
const APP_DIRECTORY = 'app';
const LIBS_DIRECTORY = 'libs';
const COMPONENTS_DIRECTORY = 'components';
const PRIVATE_DIRECTORY_PREFIX = '_';
const UNCONSTRAINED_SOURCE_DIRECTORIES: ReadonlySet<string> = new Set(['@types', 'polyfills']);
const CATEGORY_DIRECTORIES: readonly string[] = [
  'services',
  'storages',
  'schemas',
  COMPONENTS_DIRECTORY,
  'hooks',
  'contexts',
  'constants',
  'types',
  'styles',
  'assets',
  'i18n',
  'helpers',
  'server',
  TESTS_DIRECTORY,
];
const CATEGORY_CHILDREN: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['storages', new Set(['local', 'session', 'cookies', 'websql', 'indexeddb'])],
  ['i18n', new Set(['messages', 'datetime', 'list', 'numbers', 'plural', 'relative-time'])],
  ['server', new Set(['actions'])],
]);

function additionalDirectoriesOption(options: readonly unknown[]): readonly string[] {
  const option = options[0];
  if (typeof option === 'object' && option !== null && 'additionalDirectories' in option) {
    const { additionalDirectories } = option;
    if (
      Array.isArray(additionalDirectories) &&
      additionalDirectories.every((item) => typeof item === 'string')
    ) {
      return additionalDirectories;
    }
  }
  return [];
}

function categoryName(segment: string, scope: Scope): string | null {
  if (scope !== 'app' || segment === TESTS_DIRECTORY) return segment;
  return segment.startsWith(PRIVATE_DIRECTORY_PREFIX)
    ? segment.slice(PRIVATE_DIRECTORY_PREFIX.length)
    : null;
}

function unknownDirectoryIndex(
  directories: readonly string[],
  categories: ReadonlySet<string>,
): number | null {
  let scope: Scope = 'source';
  let index = 0;
  while (index < directories.length) {
    const segment = directories[index] ?? '';
    if (scope === 'app' && !segment.startsWith(PRIVATE_DIRECTORY_PREFIX)) {
      index += 1;
      continue;
    }
    if (scope === 'source' && segment === APP_DIRECTORY) {
      scope = 'app';
      index += 1;
      continue;
    }
    if (scope === 'source' && segment === LIBS_DIRECTORY) {
      scope = 'fractal';
      index += 2;
      continue;
    }
    if (scope === 'source' && UNCONSTRAINED_SOURCE_DIRECTORIES.has(segment)) return null;

    const name = categoryName(segment, scope);
    if (name === null || !categories.has(name)) return index;

    const child = directories[index + 1];
    if (child === undefined) return null;
    if (name === COMPONENTS_DIRECTORY) {
      scope = 'fractal';
      index += 2;
      continue;
    }
    const allowedChildren = CATEGORY_CHILDREN.get(name);
    return allowedChildren === undefined || allowedChildren.has(child) ? null : index + 1;
  }
  return null;
}

export const requireFractalDirectoriesRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-fractal-directories'),
      description:
        'Require every directory under `src` to follow the fractal directory pattern of ADR 5541831634.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          additionalDirectories: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unknownDirectory:
        'The `{{directory}}` directory is not allowed in `{{parent}}`. Use a directory defined by the fractal pattern.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const path = sourcePath(context);
        if (path === null) return;
        const directories = sourceDirectories(path);
        const categories = new Set([
          ...CATEGORY_DIRECTORIES,
          ...additionalDirectoriesOption(context.options),
        ]);
        const index = unknownDirectoryIndex(directories, categories);
        if (index === null) return;
        context.report({
          node,
          messageId: 'unknownDirectory',
          data: {
            directory: directories.slice(0, index + 1).join('/'),
            parent: ['src', ...directories.slice(0, index)].join('/'),
          },
        });
      },
    };
  },
});
