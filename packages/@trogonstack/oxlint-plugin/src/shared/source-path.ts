const SOURCE_DIRECTORY = 'src';

export interface SourcePath {
  readonly root: string;
  readonly segments: readonly string[];
}

function splitPath(path: string): string[] {
  return path.replaceAll('\\', '/').split('/');
}

function normalizeSegments(segments: readonly string[]): string[] | null {
  const normalized: string[] = [];
  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (normalized.length === 0) return null;
      normalized.pop();
      continue;
    }
    normalized.push(segment);
  }
  return normalized;
}

/** Locates a file under the nearest enclosing `src` directory, returning its segments relative to it. */
export function sourcePath(filename: string): SourcePath | null {
  const parts = splitPath(filename);
  const index = parts.lastIndexOf(SOURCE_DIRECTORY);
  if (index === -1 || index === parts.length - 1) return null;
  const segments = normalizeSegments(parts.slice(index + 1));
  if (segments === null || segments.length === 0) return null;
  return { root: parts.slice(0, index + 1).join('/'), segments };
}

export function sourceDirectories(path: SourcePath): readonly string[] {
  return path.segments.slice(0, -1);
}

export function sourceFileName(path: SourcePath): string {
  return path.segments.at(-1) ?? '';
}

/** Resolves a relative or source-aliased import specifier against the importing file, or `null` for packages. */
export function resolveSourceImport(
  importer: SourcePath,
  specifier: string,
  sourceAliases: readonly string[],
): SourcePath | null {
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const segments = normalizeSegments([...sourceDirectories(importer), ...splitPath(specifier)]);
    return segments === null || segments.length === 0 ? null : { root: importer.root, segments };
  }

  const alias = sourceAliases.find((prefix) => specifier.startsWith(prefix));
  if (alias === undefined) return null;
  const segments = normalizeSegments(splitPath(specifier.slice(alias.length)));
  return segments === null || segments.length === 0 ? null : { root: importer.root, segments };
}
