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

const REGEX_PRECEDERS = new Set([
  '',
  '(',
  ',',
  '=',
  ':',
  '[',
  '!',
  '&',
  '|',
  '?',
  '{',
  '}',
  ';',
  '+',
  '-',
  '*',
  '%',
  '<',
  '>',
  '~',
  '^',
]);
const REGEX_KEYWORDS =
  /(?:^|[^\w$])(?:return|typeof|case|do|else|in|of|void|delete|throw|new|yield|await)$/u;
const MASK = 'x';

function skipLineComment(code: string, start: number): number {
  const end = code.indexOf('\n', start);
  return end === -1 ? code.length : end;
}

function skipBlockComment(code: string, start: number): number {
  const end = code.indexOf('*/', start + 2);
  return end === -1 ? code.length : end + 2;
}

function skipRegex(code: string, start: number): number {
  let index = start + 1;
  let inClass = false;
  while (index < code.length) {
    const char = code[index];
    if (char === '\n') return index;
    if (char === '\\') index += 2;
    else if (char === '[') {
      inClass = true;
      index += 1;
    } else if (char === ']') {
      inClass = false;
      index += 1;
    } else if (char === '/' && !inClass) return index + 1;
    else index += 1;
  }
  return index;
}

function blank(text: string): string {
  return text.replace(/[^\n]/gu, ' ');
}

function maskCode(code: string): string {
  const out: string[] = [];
  const templates: number[] = [];
  let last = '';
  let index = 0;

  function emit(text: string): void {
    out.push(text);
  }

  function scanTemplateBody(): void {
    emit('`');
    index += 1;
    while (index < code.length) {
      const char = code[index];
      if (char === '\\') {
        emit(MASK.repeat(Math.min(2, code.length - index)));
        index += 2;
      } else if (char === '`') {
        emit('`');
        index += 1;
        return;
      } else if (char === '$' && code[index + 1] === '{') {
        emit('${');
        index += 2;
        templates.push(1);
        return;
      } else {
        emit(char === '\n' ? '\n' : MASK);
        index += 1;
      }
    }
  }

  while (index < code.length) {
    const char = code[index] ?? '';
    const next = code[index + 1];
    if (char === '/' && next === '/') {
      const end = skipLineComment(code, index);
      emit(blank(code.slice(index, end)));
      index = end;
    } else if (char === '/' && next === '*') {
      const end = skipBlockComment(code, index);
      emit(blank(code.slice(index, end)));
      index = end;
    } else if (char === "'" || char === '"') {
      let end = index + 1;
      while (end < code.length && code[end] !== char && code[end] !== '\n') {
        end += code[end] === '\\' ? 2 : 1;
      }
      const closed = code[end] === char;
      emit(`${char}${MASK.repeat(end - index - 1)}${closed ? char : ''}`);
      index = Math.min(closed ? end + 1 : end, code.length);
      last = char;
    } else if (char === '`') {
      scanTemplateBody();
      last = '`';
    } else if (char === '{' && templates.length > 0) {
      templates[templates.length - 1] = (templates.at(-1) ?? 0) + 1;
      emit(char);
      index += 1;
      last = char;
    } else if (char === '}' && templates.length > 0) {
      const depth = (templates.at(-1) ?? 1) - 1;
      if (depth === 0) {
        templates.pop();
        emit('}');
        index += 1;
        scanTemplateBody();
        last = '`';
      } else {
        templates[templates.length - 1] = depth;
        emit(char);
        index += 1;
        last = char;
      }
    } else if (
      char === '/' &&
      (REGEX_PRECEDERS.has(last) || REGEX_KEYWORDS.test(out.join('').slice(-12)))
    ) {
      const end = skipRegex(code, index);
      emit(`/${MASK.repeat(Math.max(0, end - index - 2))}/`);
      index = end;
      last = ')';
    } else {
      emit(char);
      index += 1;
      if (!/\s/u.test(char)) last = char;
    }
  }
  return out.join('');
}

function importSpecifiers(code: string): string[] {
  const masked = maskCode(code);
  return [...masked.matchAll(IMPORT_SPECIFIER)].map((match) => {
    const length = (match[2] ?? '').length;
    const start = match.index + match[0].length - length - 1;
    return code.slice(start, start + length);
  });
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
