export const TESTS_DIRECTORY = '__tests__';

type Scope = 'source' | 'app' | 'fractal';

export interface FractalWalk {
  readonly fractalDirectory: readonly string[];
  readonly unknownIndex: number | null;
}

const APP_DIRECTORY = 'app';
const LIBS_DIRECTORY = 'libs';
const COMPONENTS_DIRECTORY = 'components';
const PRIVATE_DIRECTORY_PREFIX = '_';
const UNCONSTRAINED_SOURCE_DIRECTORIES: ReadonlySet<string> = new Set(['@types', 'polyfills']);
const CATEGORY_CHILDREN: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['storages', new Set(['local', 'session', 'cookies', 'websql', 'indexeddb'])],
  ['i18n', new Set(['messages', 'datetime', 'list', 'numbers', 'plural', 'relative-time'])],
  ['server', new Set(['actions'])],
]);

function categoryName(segment: string, scope: Scope): string | null {
  if (scope !== 'app' || segment === TESTS_DIRECTORY) return segment;
  return segment.startsWith(PRIVATE_DIRECTORY_PREFIX)
    ? segment.slice(PRIVATE_DIRECTORY_PREFIX.length)
    : null;
}

/**
 * Walks the src-relative directory segments of a file through the fractal pattern of ADR 5541831634.
 * Returns the nearest enclosing fractal directory (`[]` is `src`) and the index of the first directory the pattern does not allow.
 */
export function walkFractalDirectories(
  directories: readonly string[],
  categories: ReadonlySet<string>,
): FractalWalk {
  let scope: Scope = 'source';
  let index = 0;
  let fractalLength = 0;
  const finish = (unknownIndex: number | null): FractalWalk => ({
    fractalDirectory: directories.slice(0, fractalLength),
    unknownIndex,
  });
  while (index < directories.length) {
    const segment = directories[index] ?? '';
    if (scope === 'app' && !segment.startsWith(PRIVATE_DIRECTORY_PREFIX)) {
      index += 1;
      fractalLength = index;
      continue;
    }
    if (scope === 'source' && segment === APP_DIRECTORY) {
      scope = 'app';
      index += 1;
      fractalLength = index;
      continue;
    }
    if (scope === 'source' && segment === LIBS_DIRECTORY) {
      scope = 'fractal';
      index += 2;
      if (index <= directories.length) fractalLength = index;
      continue;
    }
    if (scope === 'source' && UNCONSTRAINED_SOURCE_DIRECTORIES.has(segment)) return finish(null);

    const name = categoryName(segment, scope);
    if (name === null || !categories.has(name)) return finish(index);

    const child = directories[index + 1];
    if (child === undefined) return finish(null);
    if (name === COMPONENTS_DIRECTORY) {
      scope = 'fractal';
      index += 2;
      fractalLength = index;
      continue;
    }
    const allowedChildren = CATEGORY_CHILDREN.get(name);
    return finish(allowedChildren === undefined || allowedChildren.has(child) ? null : index + 1);
  }
  return finish(null);
}

/** Returns the src-relative segments of the nearest fractal directory enclosing the given directory segments. */
export function nearestFractalDirectory(
  directories: readonly string[],
  categories: ReadonlySet<string>,
): readonly string[] {
  return walkFractalDirectories(directories, categories).fractalDirectory;
}
