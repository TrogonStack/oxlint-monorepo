import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { importSourceVisitors } from '../shared/module-directives.ts';
import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import {
  isSourceDirectory,
  resolveSourceImport,
  sourceDirectories,
  sourcePath,
} from '../shared/source-path.ts';

export const requireImportLocalityRule = defineRule({
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      url: ruleDocsUrl('require-import-locality'),
      description:
        'Require relative imports for files in the importing directory or below it, instead of a source alias.',
    },
    schema: [],
    messages: {
      useRelative:
        "This file is in the importing file's directory or below it. Use the relative import `{{suggestion}}` instead of a source alias.",
    },
  },
  createOnce(context) {
    return importSourceVisitors((node, source) => {
      const { sourceAliases } = getTrogonstackSettings(context);
      if (!sourceAliases.some((alias) => source.startsWith(alias))) return;
      const importer = sourcePath(context);
      if (importer === null) return;
      const target = resolveSourceImport(importer, source, sourceAliases);
      if (target === null) return;

      const directory = sourceDirectories(importer);
      const isInside = directory.every((segment, index) => target.segments[index] === segment);
      if (!isInside) return;
      const rest = target.segments.slice(directory.length);
      if (rest.length === 0 && !isSourceDirectory(target)) return;

      const suggestion = rest.length === 0 ? '.' : `./${rest.join('/')}`;
      const quote = context.sourceCode.getText(node)[0] ?? "'";
      context.report({
        node,
        messageId: 'useRelative',
        data: { suggestion },
        fix: (fixer) => fixer.replaceText(node, `${quote}${suggestion}${quote}`),
      });
    });
  },
});
