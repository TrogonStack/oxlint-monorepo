#!/usr/bin/env node
//MISE description="Regenerate the README rules table and validate rule docs (--check to verify only)"
import { readdir, readFile, writeFile } from 'node:fs/promises';

import { format } from 'oxfmt';

import plugin from '../../../../src/index.ts';
import { ruleDocsUrl } from '../../../../src/shared/docs.ts';

const START_MARKER = '<!-- rules:start -->';
const END_MARKER = '<!-- rules:end -->';
const readmeUrl = new URL('../../../../README.md', import.meta.url);
const docsDirUrl = new URL('../../../../docs/rules/', import.meta.url);

const rules = Object.entries(plugin.rules).toSorted(([left], [right]) => left.localeCompare(right));

async function validateRuleDocs(): Promise<string[]> {
  const docFiles = new Set((await readdir(docsDirUrl)).filter((file) => file.endsWith('.md')));
  const ruleFiles = new Set(rules.map(([name]) => `${name}.md`));

  const orphanProblems = [...docFiles]
    .toSorted()
    .filter((file) => !ruleFiles.has(file))
    .map((file) => `docs/rules/${file} has no matching rule`);

  const ruleProblems = await Promise.all(
    rules.map(async ([name, rule]) => {
      const problems: string[] = [];
      const file = `docs/rules/${name}.md`;
      const docs = rule.meta?.docs;
      const expectedUrl = ruleDocsUrl(name);
      if (docs?.url !== expectedUrl) {
        problems.push(`${name}: meta.docs.url must be ${expectedUrl}`);
      }

      if (!docFiles.has(`${name}.md`)) {
        problems.push(`${name}: missing ${file}`);
        return problems;
      }

      const lines = (await readFile(new URL(`${name}.md`, docsDirUrl), 'utf8')).split('\n');
      const headingIndex = lines.findIndex((line) => line.startsWith('# '));
      if (lines[headingIndex] !== `# trogonstack/${name}`) {
        problems.push(`${file}: first heading must be "# trogonstack/${name}"`);
        return problems;
      }

      const summary = lines.slice(headingIndex + 1).find((line) => line.trim() !== '');
      if (summary !== docs?.description) {
        problems.push(`${file}: summary line must equal meta.docs.description`);
      }
      return problems;
    }),
  );

  return [...orphanProblems, ...ruleProblems.flat()];
}

const docProblems = await validateRuleDocs();
if (docProblems.length > 0) {
  console.error(
    `Rule docs are invalid:\n${docProblems.map((problem) => `- ${problem}`).join('\n')}`,
  );
  process.exit(1);
}

const rows = rules.map(
  ([name, rule]) =>
    `| [\`trogonstack/${name}\`](docs/rules/${name}.md) | ${rule.meta?.docs?.description ?? ''} |`,
);

const table = ['| Rule | Description |', '| --- | --- |', ...rows].join('\n');

const readme = await readFile(readmeUrl, 'utf8');
const start = readme.indexOf(START_MARKER);
const end = readme.indexOf(END_MARKER);
if (start === -1 || end < start) {
  throw new Error(`README.md must contain ${START_MARKER} followed by ${END_MARKER}`);
}

const { code: synced, errors } = await format(
  'README.md',
  `${readme.slice(0, start + START_MARKER.length)}\n\n${table}\n\n${readme.slice(end)}`,
);
if (errors.length > 0) {
  throw new Error(
    `oxfmt failed to format README.md: ${errors.map((error) => error.message).join(', ')}`,
  );
}

if (process.argv.includes('--check')) {
  if (synced !== readme) {
    console.error('README.md rule list is out of date. Run `pnpm run docs` to regenerate it.');
    process.exit(1);
  }
} else {
  await writeFile(readmeUrl, synced);
}
