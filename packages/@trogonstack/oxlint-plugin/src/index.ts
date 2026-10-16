import { eslintCompatPlugin } from '@oxlint/plugins';

import { noArbitraryZIndexRule } from './rules/no-arbitrary-z-index.ts';
import { noChainedTypeAssertionsRule } from './rules/no-chained-type-assertions.ts';
import { noConditionalEmptyObjectSpreadRule } from './rules/no-conditional-empty-object-spread.ts';
import { noDecorativeGridBackgroundRule } from './rules/no-decorative-grid-background.ts';
import { noDefensiveGuardSprawlRule } from './rules/no-defensive-guard-sprawl.ts';
import { noDemoDataPrimaryPathRule } from './rules/no-demo-data-primary-path.ts';
import { noDestructuredParametersRule } from './rules/no-destructured-parameters.ts';
import { noExcessiveRadiusRule } from './rules/no-excessive-radius.ts';
import { noGenericStatLabelRule } from './rules/no-generic-stat-label.ts';
import { noGradientTextRule } from './rules/no-gradient-text.ts';
import { noHiddenRevealDefaultRule } from './rules/no-hidden-reveal-default.ts';
import { noKnownValueWideningRule } from './rules/no-known-value-widening.ts';
import { noMarketingCopyRule } from './rules/no-marketing-copy.ts';
import { noModuleMockingRule } from './rules/no-module-mocking.ts';
import { noNestedCardsRule } from './rules/no-nested-cards.ts';
import { noObjectParametersRule } from './rules/no-object-parameters.ts';
import { noPlaceholderCopyRule } from './rules/no-placeholder-copy.ts';
import { noReflectApplyRule } from './rules/no-reflect-apply.ts';
import { noReflectGetRule } from './rules/no-reflect-get.ts';
import { noRuntimeTypeofRule } from './rules/no-runtime-typeof.ts';
import { noForbiddenTermInSymbolNamesRule } from './rules/no-shape-in-symbol-names.ts';
import { noSideStripeAccentRule } from './rules/no-side-stripe-accent.ts';
import { noUnjustifiedUseClientRule } from './rules/no-unjustified-use-client.ts';
import { noUnknownParametersRule } from './rules/no-unknown-parameters.ts';
import { noUnknownReturnsRule } from './rules/no-unknown-returns.ts';
import { noUnknownTypeAliasesRule } from './rules/no-unknown-type-aliases.ts';
import { noUnsafeDictionaryTypeRule } from './rules/no-unsafe-dictionary-type.ts';
import { noUselessMemoRule } from './rules/no-useless-memo.ts';
import { noWidenThenAssertRule } from './rules/no-widen-then-assert.ts';
import { requireEmptyStateActionRule } from './rules/require-empty-state-action.ts';
import { requireReducedMotionRule } from './rules/require-reduced-motion.ts';
import { requireSafetyCommentForTypeAssertionRule } from './rules/require-safety-comment-for-type-assertion.ts';

/** Trogon Stack Oxlint rules that reject low-evidence and low-signal implementation patterns. */
const trogonstackPlugin = eslintCompatPlugin({
  meta: { name: 'trogonstack' },
  rules: {
    'no-arbitrary-z-index': noArbitraryZIndexRule,
    'no-chained-type-assertions': noChainedTypeAssertionsRule,
    'no-conditional-empty-object-spread': noConditionalEmptyObjectSpreadRule,
    'no-decorative-grid-background': noDecorativeGridBackgroundRule,
    'no-defensive-guard-sprawl': noDefensiveGuardSprawlRule,
    'no-demo-data-primary-path': noDemoDataPrimaryPathRule,
    'no-destructured-parameters': noDestructuredParametersRule,
    'no-excessive-radius': noExcessiveRadiusRule,
    'no-generic-stat-label': noGenericStatLabelRule,
    'no-gradient-text': noGradientTextRule,
    'no-hidden-reveal-default': noHiddenRevealDefaultRule,
    'no-known-value-widening': noKnownValueWideningRule,
    'no-marketing-copy': noMarketingCopyRule,
    'no-module-mocking': noModuleMockingRule,
    'no-nested-cards': noNestedCardsRule,
    'no-object-parameters': noObjectParametersRule,
    'no-placeholder-copy': noPlaceholderCopyRule,
    'no-reflect-apply': noReflectApplyRule,
    'no-reflect-get': noReflectGetRule,
    'no-runtime-typeof': noRuntimeTypeofRule,
    'no-shape-in-symbol-names': noForbiddenTermInSymbolNamesRule,
    'no-side-stripe-accent': noSideStripeAccentRule,
    'no-unjustified-use-client': noUnjustifiedUseClientRule,
    'no-unknown-parameters': noUnknownParametersRule,
    'no-unknown-returns': noUnknownReturnsRule,
    'no-unknown-type-aliases': noUnknownTypeAliasesRule,
    'no-unsafe-dictionary-type': noUnsafeDictionaryTypeRule,
    'no-useless-memo': noUselessMemoRule,
    'no-widen-then-assert': noWidenThenAssertRule,
    'require-empty-state-action': requireEmptyStateActionRule,
    'require-reduced-motion': requireReducedMotionRule,
    'require-safety-comment-for-type-assertion': requireSafetyCommentForTypeAssertionRule,
  },
});

export default trogonstackPlugin;
