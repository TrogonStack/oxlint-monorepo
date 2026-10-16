import { RuleTester } from 'oxlint/plugins-dev';

import { noDefensiveGuardSprawlRule } from '../../../src/rules/no-defensive-guard-sprawl.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } });
const error = { messageId: 'guardSprawl' };

tester.run('trogonstack/no-defensive-guard-sprawl', noDefensiveGuardSprawlRule, {
  valid: [
    "function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }",
    'function parseUser(input) { if (!isRecord(input)) return null; if (input.id == null) return null; return { id: input.id }; }',
    "function assertPayload(input) { if (!isRecord(input)) throw new Error('bad'); if (input.id == null) throw new Error('bad'); if (input.email == null) throw new Error('bad'); }",
    {
      name: 'maxGuards option raises the limit',
      code: 'function parseUser(input) { if (!isRecord(input)) return null; if (input.id == null) return null; if (input.email == null) return null; return input; }',
      options: [{ maxGuards: 3 }],
    },
    "class Service { assertUserPayload(input) { if (!isRecord(input)) throw new Error('bad'); if (input.id == null) throw new Error('bad'); if (input.email == null) throw new Error('bad'); } }",
    "class Service { static validateUser(input) { if (!isRecord(input)) throw new Error('bad'); if (input.id == null) throw new Error('bad'); if (input.email == null) throw new Error('bad'); } }",
    "class Service { assertUser = (input) => { if (!isRecord(input)) throw new Error('bad'); if (input.id == null) throw new Error('bad'); if (input.email == null) throw new Error('bad'); }; }",
    "class Service { #isValid(input) { if (!isRecord(input)) throw new Error('bad'); if (input.id == null) throw new Error('bad'); if (input.email == null) throw new Error('bad'); } }",
    "const target = {}; target.isValid = function (input) { if (!isRecord(input)) throw new Error('bad'); if (input.id == null) throw new Error('bad'); if (input.email == null) throw new Error('bad'); };",
  ],
  invalid: [
    {
      code: "const handlers = { [isValid]: function (input) { if (!isRecord(input)) throw new Error('bad'); if (input.id == null) throw new Error('bad'); if (input.email == null) throw new Error('bad'); } };",
      errors: [error],
    },
    {
      code: "class Service { [assertUser](input) { if (!isRecord(input)) throw new Error('bad'); if (input.id == null) throw new Error('bad'); if (input.email == null) throw new Error('bad'); } }",
      errors: [error],
    },
    {
      code: 'function parseUser(input) { if (!isRecord(input)) return null; if (input.id == null) return null; if (input.email == null) return null; return { id: input.id, email: input.email }; }',
      errors: [error],
    },
    {
      code: "const normalizeUser = (input) => { if (input == null) return null; if (input.id == null) return null; if (typeof input.name === 'undefined') return null; return input; };",
      errors: [error],
    },
    {
      code: 'function parseUser(input) { if (!isRecord(input)) return null; if (input.id == null) return null; return input; }',
      options: [{ maxGuards: 1 }],
      errors: [error],
    },
    {
      code: "class Service { parseUser(input) { if (!isRecord(input)) throw new Error('bad'); if (input.id == null) throw new Error('bad'); if (input.email == null) throw new Error('bad'); } }",
      errors: [error],
    },
  ],
});
