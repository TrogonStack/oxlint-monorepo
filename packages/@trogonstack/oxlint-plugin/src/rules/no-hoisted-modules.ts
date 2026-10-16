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

function displayDirectory(directory: readonly string[]): string {
  return ['src', ...directory].join('/');
}

export const noHoistedModulesRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('no-hoisted-modules'),
      description:
        'Disallow modules that sit in a fractal directory higher than the one every consumer lives in.',
    },
    schema: [],
    messages: {
      hoisted:
        'Only `{{users}}` uses this module. Move it into `{{target}}` instead of `{{owner}}`.',
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
        if (!isDeeper) return;

        context.report({
          node,
          messageId: 'hoisted',
          data: {
            users: target.join('/'),
            target: displayDirectory(target),
            owner: displayDirectory(owner),
          },
        });
      },
    };
  },
});
