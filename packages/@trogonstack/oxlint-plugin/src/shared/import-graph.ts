import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { resolveSourceImport } from './source-path.ts';

import type { SourcePath } from './source-path.ts';

export const SOURCE_EXTENSIONS: readonly string[] = [
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',
  'mts',
  'cts',
];

const SOURCE_FILE = new RegExp(`\\.(?:${SOURCE_EXTENSIONS.join('|')})$`, 'u');
const JAVASCRIPT_EXTENSION = /\.(?:[mc]?js|jsx)$/u;
const IMPORT_SPECIFIER =
  /(?:\bimport\s+(?:[^'"`;]*?\s+from\s+)?|\bexport\s+[^'"`;]*?\s+from\s+|\bimport\s*\(\s*|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/gu;

export type ImportGraph = ReadonlyMap<string, ReadonlySet<string>>;

const graphs = new Map<string, ImportGraph>();

function listSourceFiles(directory: string, found: string[]): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) listSourceFiles(path, found);
    else if (entry.isFile() && SOURCE_FILE.test(entry.name)) found.push(path);
  }
}

function importSpecifiers(code: string): string[] {
  return [...code.matchAll(IMPORT_SPECIFIER)].map((match) => match[2] ?? '');
}

function candidates(path: string): string[] {
  const bases = JAVASCRIPT_EXTENSION.test(path)
    ? [path, path.replace(JAVASCRIPT_EXTENSION, '')]
    : [path];
  return bases.flatMap((base) => [
    base,
    ...SOURCE_EXTENSIONS.map((extension) => `${base}.${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => `${base}/index.${extension}`),
  ]);
}

function buildGraph(root: string, sourceAliases: readonly string[]): ImportGraph {
  const files: string[] = [];
  try {
    listSourceFiles(root, files);
  } catch {
    return new Map();
  }
  const known = new Set(files);
  const importedBy = new Map<string, Set<string>>();
  for (const file of files) {
    let code: string;
    try {
      code = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const segments = file.slice(root.length + 1).split('/');
    for (const specifier of importSpecifiers(code)) {
      const target = resolveSourceImport({ root, segments }, specifier, sourceAliases);
      if (target === null) continue;
      const resolved = candidates(join(root, ...target.segments).replaceAll('\\', '/')).find(
        (candidate) => known.has(candidate) && candidate !== file,
      );
      if (resolved === undefined) continue;
      const importers = importedBy.get(resolved) ?? new Set<string>();
      importers.add(file);
      importedBy.set(resolved, importers);
    }
  }
  return importedBy;
}

function normalizePath(path: string): string {
  return resolve(path).replaceAll('\\', '/');
}

/** Lists the files importing the given source file, as `src`-relative segments. The graph of a `src` root is built once per process. */
export function importersOf(
  file: SourcePath,
  sourceAliases: readonly string[],
): readonly (readonly string[])[] {
  const root = normalizePath(file.root);
  const key = [root, ...sourceAliases].join('\n');
  let graph = graphs.get(key);
  if (graph === undefined) {
    graph = buildGraph(root, sourceAliases);
    graphs.set(key, graph);
  }
  const importers = graph.get(`${root}/${file.segments.join('/')}`) ?? [];
  return [...importers].map((importer) => importer.slice(root.length + 1).split('/'));
}
