import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { nearestFractalDirectory, TESTS_DIRECTORY } from '../shared/fractal-directories.ts';
import { importersOf } from '../shared/import-graph.ts';
import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import { sourceDirectories, sourceFileName, sourcePath } from '../shared/source-path.ts';

const EXCLUDED_SOURCE_DIRECTORIES: ReadonlySet<string> = new Set(['libs', '@types', 'polyfills']);
const TEST_FILE = /\.(?:test|spec)\.[^.]+$/u;
const PRIVATE_DIRECTORY_PREFIX = '_';

function commonPrefix(paths: readonly (readonly string[])[]): readonly string[] {
  const [first = [], ...rest] = paths;
  const length = first.findIndex((segment, index) => rest.some((path) => path[index] !== segment));
  return first.slice(0, length === -1 ? first.length : length);
}

function isRouteFile(directories: readonly string[]): boolean {
  return (
    directories[0] === 'app' &&
    !directories.slice(1).some((segment) => segment.startsWith(PRIVATE_DIRECTORY_PREFIX))
  );
}

function isInside(directory: readonly string[], scope: readonly string[]): boolean {
  return scope.every((segment, index) => directory[index] === segment);
}

function visibilityScope(
  owner: readonly string[],
  categories: ReadonlySet<string>,
): readonly string[] {
  if (owner.length < 2) return owner;
  const category = owner.at(-2) ?? '';
  const name =
    owner[0] === 'app' && category.startsWith(PRIVATE_DIRECTORY_PREFIX)
      ? category.slice(PRIVATE_DIRECTORY_PREFIX.length)
      : category;
  const isNested = owner[0] === 'app' ? category !== name : owner.length > 1;
  return isNested && categories.has(name) ? owner.slice(0, -2) : owner;
}

function displayDirectory(directory: readonly string[]): string {
  return ['src', ...directory].join('/');
}

export const requireColocatedModulesRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('require-colocated-modules'),
      description:
        'Require modules to sit in the closest fractal directory that contains every consumer, neither higher nor lower.',
    },
    schema: [],
    messages: {
      hoisted:
        'Only `{{users}}` uses this module. Move it into `{{target}}` instead of `{{owner}}`.',
      buried:
        'This module is used outside `{{scope}}`. Move it into `{{target}}` instead of `{{owner}}`.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const path = sourcePath(context);
        if (path === null) return;
        const directories = sourceDirectories(path);
        const first = directories[0] ?? sourceFileName(path);
        if (EXCLUDED_SOURCE_DIRECTORIES.has(first) || isRouteFile(directories)) return;
        if (TEST_FILE.test(sourceFileName(path))) return;

        const settings = getTrogonstackSettings(context);
        const importers = importersOf(path, settings.sourceAliases).filter(
          (importer) => !TEST_FILE.test(importer.at(-1) ?? ''),
        );
        if (importers.length === 0) return;

        const categories = new Set([...settings.fractalDirectories, TESTS_DIRECTORY]);
        const owner = nearestFractalDirectory(directories, categories);
        const importerDirectories = importers.map((importer) =>
          nearestFractalDirectory(importer.slice(0, -1), categories),
        );
        const target = nearestFractalDirectory(commonPrefix(importerDirectories), categories);
        const isDeeper =
          target.length > owner.length &&
          owner.every((segment, index) => target[index] === segment);
        if (isDeeper) {
          context.report({
            node,
            messageId: 'hoisted',
            data: {
              users: target.join('/'),
              target: displayDirectory(target),
              owner: displayDirectory(owner),
            },
          });
          return;
        }

        const scope = visibilityScope(owner, categories);
        const escapes = importers.some((importer) => !isInside(importer.slice(0, -1), scope));
        if (!escapes) return;

        const buriedTarget = nearestFractalDirectory(
          commonPrefix([scope, ...importers.map((importer) => importer.slice(0, -1))]),
          categories,
        );
        context.report({
          node,
          messageId: 'buried',
          data: {
            scope: displayDirectory(scope),
            target: displayDirectory(buriedTarget),
            owner: displayDirectory(owner),
          },
        });
      },
    };
  },
});
