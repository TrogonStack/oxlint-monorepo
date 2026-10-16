import { defineRule } from '@oxlint/plugins';

import { ruleDocsUrl } from '../shared/docs.ts';
import { getTrogonstackSettings } from '../shared/plugin-settings.ts';
import { sourceDirectories, sourcePath } from '../shared/source-path.ts';

const APP_DIRECTORY = 'app';
const DYNAMIC_SEGMENT = /^\[{1,2}(?:\.\.\.)?([^\]]+)\]{1,2}$/u;

export const requireLocaleRouteParameterRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      url: ruleDocsUrl('require-locale-route-parameter'),
      description:
        'Require the `[locale]` dynamic segment for internationalized routes under `src/app`.',
    },
    schema: [],
    messages: {
      wrongParameter: 'The `{{segment}}` route segment must be named `[locale]`.',
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const path = sourcePath(context);
        if (path === null) return;
        const directories = sourceDirectories(path);
        if (directories[0] !== APP_DIRECTORY) return;
        const aliases = getTrogonstackSettings(context).localeParameterAliases;
        for (const segment of directories.slice(1)) {
          const name = DYNAMIC_SEGMENT.exec(segment)?.[1];
          if (name !== undefined && aliases.includes(name)) {
            context.report({ node, messageId: 'wrongParameter', data: { segment } });
            return;
          }
        }
      },
    };
  },
});
