#!/usr/bin/env node
//MISE description="Lint every rule doc example with the built plugin"
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);

const packageDir = fileURLToPath(new URL('../../../../', import.meta.url));
const docsDir = join(packageDir, 'docs/rules');
const pluginPath = join(packageDir, 'dist/index.js');
const oxlintPath = join(packageDir, 'node_modules/.bin/oxlint');

const extensions: Record<string, string> = { ts: 'ts', tsx: 'tsx', js: 'js', jsx: 'jsx' };
const labelPattern = /^(Invalid|Valid)\b.*:$/;
const filenamePattern = /^\/\/ (\S+\.(?:ts|tsx|js|jsx))$/;

interface Example {
  rule: string;
  kind: 'Invalid' | 'Valid';
  line: number;
  language: string;
  code: string;
  options: unknown;
  settings: unknown;
}

interface Diagnostic {
  code?: string;
  message: string;
}

function parseAttributes(info: string): Record<string, string> {
  return Object.fromEntries(
    [...info.matchAll(/(\w+)='([^']*)'/g)].map(([, key, value]) => [key, value]),
  );
}

function parseExamples(rule: string, markdown: string, problems: string[]): Example[] {
  const lines = markdown.split('\n');
  const start = lines.indexOf('## Examples');
  if (start === -1) {
    problems.push(`${rule}: missing "## Examples" section`);
    return [];
  }
  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
  const section = lines.slice(start + 1, end === -1 ? undefined : end);
  const where = (index: number) => `${rule}.md:${start + 2 + index}`;

  const examples: Example[] = [];
  let kind: Example['kind'] | undefined;
  for (let index = 0; index < section.length; index++) {
    const line = section[index];
    const label = labelPattern.exec(line);
    if (label) {
      kind = label[1] as Example['kind'];
      continue;
    }
    if (!line.startsWith('```')) {
      continue;
    }
    const info = line.slice(3).trim();
    const close = section.indexOf('```', index + 1);
    if (close === -1) {
      problems.push(`${where(index)}: unterminated code fence`);
      break;
    }
    const code = `${section.slice(index + 1, close).join('\n')}\n`;
    const language = info.split(/\s+/)[0];
    const attributes = parseAttributes(info);
    const parsed: Record<string, unknown> = {};
    for (const key of ['options', 'settings']) {
      if (attributes[key] === undefined) {
        continue;
      }
      try {
        parsed[key] = JSON.parse(attributes[key]);
      } catch {
        problems.push(`${where(index)}: ${key} attribute is not valid JSON`);
      }
    }
    if (!kind) {
      problems.push(
        `${where(index)}: code block is not preceded by an "Invalid...:" or "Valid...:" label`,
      );
    } else if (!(language in extensions)) {
      problems.push(`${where(index)}: unsupported fence language "${language}"`);
    } else {
      examples.push({
        rule,
        kind,
        line: start + 2 + index,
        language,
        code,
        options: parsed.options,
        settings: parsed.settings,
      });
    }
    index = close;
  }

  if (!examples.some((example) => example.kind === 'Invalid')) {
    problems.push(`${rule}: no Invalid example`);
  }
  if (!examples.some((example) => example.kind === 'Valid')) {
    problems.push(`${rule}: no Valid example`);
  }
  return examples;
}

async function lint(example: Example, dir: string): Promise<Diagnostic[]> {
  await mkdir(dir, { recursive: true });
  const config = join(dir, '.oxlintrc.json');
  const ruleName = `trogonstack/${example.rule}`;
  await writeFile(
    config,
    JSON.stringify({
      jsPlugins: [pluginPath],
      categories: { correctness: 'off' },
      rules: { [ruleName]: example.options === undefined ? 'error' : ['error', example.options] },
      settings: { trogonstack: example.settings ?? {} },
    }),
  );
  const lines = example.code.split('\n');
  const files: Array<{ filename: string; lines: string[] }> = [];
  for (const line of lines) {
    const filename = filenamePattern.exec(line)?.[1];
    if (filename !== undefined && (files.length > 0 || line === lines[0])) {
      files.push({ filename, lines: [line] });
    } else if (files.length === 0) {
      files.push({ filename: `example.${extensions[example.language]}`, lines: [line] });
    } else {
      files[files.length - 1].lines.push(line);
    }
  }
  await Promise.all(
    files.map(async ({ filename, lines: content }) => {
      const file = join(dir, filename);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, content.join('\n'));
    }),
  );

  let stdout: string;
  try {
    ({ stdout } = await run(oxlintPath, ['-c', config, '--format', 'json', dir], { cwd: dir }));
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string };
    if (!failure.stdout) {
      throw new Error(`oxlint failed to run: ${failure.stderr ?? String(error)}`, { cause: error });
    }
    stdout = failure.stdout;
  }
  return (JSON.parse(stdout) as { diagnostics: Diagnostic[] }).diagnostics;
}

function judge(example: Example, diagnostics: Diagnostic[]): string | undefined {
  const reports = diagnostics.filter(
    (diagnostic) => diagnostic.code === `trogonstack(${example.rule})`,
  );
  const others = diagnostics.filter(
    (diagnostic) => diagnostic.code !== `trogonstack(${example.rule})`,
  );
  if (others.length > 0) {
    return `unexpected parse or tool error: ${others.map((diagnostic) => diagnostic.message).join('; ')}`;
  }
  if (example.kind === 'Invalid' && reports.length === 0) {
    return 'Invalid example produced no report';
  }
  if (example.kind === 'Valid' && reports.length > 0) {
    return `Valid example was reported: ${reports.map((diagnostic) => diagnostic.message).join('; ')}`;
  }
  return undefined;
}

if (!existsSync(pluginPath)) {
  console.error('dist/index.js is missing. Run "pnpm run build" before checking rule examples.');
  process.exit(1);
}

const problems: string[] = [];
const files = (await readdir(docsDir)).filter((file) => file.endsWith('.md')).toSorted();
const examples = (
  await Promise.all(
    files.map(async (file) => {
      const rule = file.slice(0, -'.md'.length);
      return parseExamples(rule, await readFile(join(docsDir, file), 'utf8'), problems);
    }),
  )
).flat();

const workDir = await mkdtemp(join(tmpdir(), 'oxlint-rule-examples-'));
try {
  const results = await Promise.all(
    examples.map(async (example, index) => {
      const failure = judge(example, await lint(example, join(workDir, String(index))));
      return failure && `docs/rules/${example.rule}.md:${example.line}: ${failure}`;
    }),
  );
  problems.push(...results.filter((result) => result !== undefined));
} finally {
  await rm(workDir, { recursive: true, force: true });
}

if (problems.length > 0) {
  console.error(
    `Rule examples are invalid:\n${problems.map((problem) => `- ${problem}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(`Checked ${examples.length} rule examples.`);
