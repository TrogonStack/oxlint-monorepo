import { RuleTester } from 'oxlint/plugins-dev';

import { noForbiddenTermInSymbolNamesRule } from '../../../src/rules/no-shape-in-symbol-names.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = (name: string) => ({ messageId: 'forbiddenSymbolName', data: { name } });

tester.run('trogonstack/no-shape-in-symbol-names', noForbiddenTermInSymbolNamesRule, {
  valid: [
    'const user = { id: 1 };',
    'type UserResponse = { id: string };',
    'class Box { #size = 1; }',
    'const sha = 1; const sap = 2; const hape = 3;',
    "const label = 'shape';",
    'const label = `shape`;',
    '// shape\nconst user = 1;',
    'const view = <Circle size={1} />;',
    'function parse(input: User): Result { return input; }',
  ],
  invalid: [
    { code: 'const shape = 1;', errors: [error('shape')] },
    { code: 'const Shape = 1;', errors: [error('Shape')] },
    { code: 'const SHAPE = 1;', errors: [error('SHAPE')] },
    { code: 'const SHAPE_KEY = 1;', errors: [error('SHAPE_KEY')] },
    { code: 'const userShape = { id: 1 };', errors: [error('userShape')] },
    { code: 'const shaped = 1;', errors: [error('shaped')] },
    { code: 'const reshape = 1;', errors: [error('reshape')] },
    { code: 'const sHaPe = 1;', errors: [error('sHaPe')] },
    { code: 'type ResponseShape = { id: string };', errors: [error('ResponseShape')] },
    { code: 'interface UserShape { id: string }', errors: [error('UserShape')] },
    { code: 'enum ShapeKind { Round }', errors: [error('ShapeKind')] },
    { code: 'enum Kind { RoundShape }', errors: [error('RoundShape')] },
    { code: 'function parseShape() {}', errors: [error('parseShape')] },
    { code: 'function parse(shape: User) {}', errors: [error('shape')] },
    { code: 'const handle = (shape) => shape;', errors: [error('shape'), error('shape')] },
    { code: 'class ShapeBox {}', errors: [error('ShapeBox')] },
    { code: 'class Box { #shape = 1; }', errors: [error('shape')] },
    { code: 'class Box { shape = 1; }', errors: [error('shape')] },
    { code: 'class Box { getShape() {} }', errors: [error('getShape')] },
    { code: 'const user = { shape: 1 };', errors: [error('shape')] },
    { code: 'const { shape } = user;', errors: [error('shape')] },
    { code: 'const { shape: renamed } = user;', errors: [error('shape')] },
    { code: 'const value = user.shape;', errors: [error('shape')] },
    { code: 'import { shape } from "module";', errors: [error('shape')] },
    { code: 'import { shape as alias } from "module";', errors: [error('shape')] },
    { code: 'const view = <Shape />;', errors: [error('Shape')] },
    { code: 'const view = <Shape></Shape>;', errors: [error('Shape'), error('Shape')] },
    { code: 'const view = <Circle shape="round" />;', errors: [error('shape')] },
    { code: 'type Mapped = { [Shape in Keys]: string };', errors: [error('Shape')] },
    { code: 'function identity<Shape>(value: Shape) {}', errors: [error('Shape'), error('Shape')] },
    {
      code: 'label: for (;;) { break label; }\nshapeLoop: for (;;) {}',
      errors: [error('shapeLoop')],
    },
    {
      code: 'const firstShape = 1; const secondShape = 2;',
      errors: [error('firstShape'), error('secondShape')],
    },
  ],
});
