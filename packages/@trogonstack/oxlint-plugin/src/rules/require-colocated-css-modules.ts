import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { importSourceVisitors } from '../shared/module-directives.ts';
import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import {
  resolveSourceImport,
  sourceDirectories,
  sourceFileName,
  sourcePath,
} from '../shared/source-path.ts';

const CSS_MODULE = /^(.+)\.module\.(?:css|scss|sass|less)$/u;
const QUERY_OR_HASH = /[?#].*$/u;
const CLIENT_SUFFIX = /\.client$/u;

function componentNames(fileName: string): readonly string[] {
  const dot = fileName.lastIndexOf('.');
  const base = dot === -1 ? fileName : fileName.slice(0, dot);
  return [base, base.replace(CLIENT_SUFFIX, '')];
}

export const requireColocatedCssModulesRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-colocated-css-modules'),
      description:
        'Require a CSS Module to be imported only by the component that owns it, from its sibling `[component name].module.[extension]` file.',
    },
    schema: [],
    messages: {
      foreignCssModule:
        'Import the CSS Module that sits next to this component, named `{{expected}}`. Move shared styles to `<fractalDir>/styles`.',
    },
  },
  createOnce(context) {
    return importSourceVisitors((node, source) => {
      const specifier = source.replace(QUERY_OR_HASH, '');
      if (!CSS_MODULE.test(specifier)) return;
      const importer = sourcePath(context);
      if (importer === null) return;

      const target = resolveSourceImport(
        importer,
        specifier,
        getTrogonstackSettings(context).sourceAliases,
      );
      if (target === null) return;

      const names = componentNames(sourceFileName(importer));
      const targetMatch = CSS_MODULE.exec(sourceFileName(target));
      const importerDirectory = sourceDirectories(importer);
      const targetDirectory = sourceDirectories(target);
      const isSibling =
        targetDirectory.length === importerDirectory.length &&
        targetDirectory.every((segment, index) => importerDirectory[index] === segment);
      if (isSibling && targetMatch?.[1] !== undefined && names.includes(targetMatch[1])) return;

      const extension = /\.([^.]+)$/u.exec(specifier)?.[1] ?? 'css';
      context.report({
        node,
        messageId: 'foreignCssModule',
        data: { expected: `${names[0]}.module.${extension}` },
      });
    });
  },
});
