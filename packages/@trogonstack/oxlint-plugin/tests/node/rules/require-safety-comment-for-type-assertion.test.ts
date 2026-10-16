import { RuleTester } from 'oxlint/plugins-dev';

import { requireSafetyCommentForTypeAssertionRule } from '../../../src/rules/require-safety-comment-for-type-assertion.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'missingSafetyComment' };

tester.run(
  'trogonstack/require-safety-comment-for-type-assertion',
  requireSafetyCommentForTypeAssertionRule,
  {
    valid: [
      'const values = [1, 2] as const;',
      "const value = <const>{ id: 'one' };",
      '// SAFETY: The parser established the UserId invariant.\nconst id = value as UserId;',
      'function parse(): UserId {\n// SAFETY: Validation above established the UserId invariant.\nreturn value as UserId;\n}',
      'const id = /* SAFETY: Validation established the invariant. */ value as UserId;',
      '// SAFETY: The parser established the UserId invariant.\nexport const id = value as UserId;',
      '// SAFETY: The parser established the UserId invariant.\nexport let id = value as UserId;',
      '// SAFETY: The parser established the UserId invariant.\nexport default value as UserId;',
      '// SAFETY: Validation established the UserId invariant.\nif (isUser(value as UserId)) run();',
    ],
    invalid: [
      {
        code: '// SAFETY: Unrelated.\nfunction run() {\nif (isUser(value as UserId)) start();\n}',
        errors: [error],
      },
      {
        code: '// SAFETY: Unrelated.\nclass Store {\nload() {\nwhile (next(value as UserId)) step();\n}\n}',
        errors: [error],
      },
      {
        code: '// SAFETY: Unrelated.\nfunction run() {\nfor (const id of value as UserId[]) start(id);\n}',
        errors: [error],
      },
      { code: 'export const id = value as UserId;', errors: [error] },
      {
        code: '// SAFETY: Unrelated.\nconst other = 1;\nexport const id = value as UserId;',
        errors: [error],
      },
      { code: 'const id = value as UserId;', errors: [error] },
      { code: 'const id = <UserId>value;', errors: [error] },
      { code: 'const id = value as UserId; // SAFETY: Too late.', errors: [error] },
      {
        code: '// This cast seems fine.\nconst id = value as UserId;',
        errors: [error],
      },
    ],
  },
);
