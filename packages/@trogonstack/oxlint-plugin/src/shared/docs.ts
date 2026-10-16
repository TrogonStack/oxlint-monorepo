const RULE_DOCS_BASE_URL =
  'https://github.com/TrogonStack/oxlint-monorepo/blob/main/packages/@trogonstack/oxlint-plugin/docs/rules';

export function ruleDocsUrl(ruleName: string): string {
  return `${RULE_DOCS_BASE_URL}/${ruleName}.md`;
}
