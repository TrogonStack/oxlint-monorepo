import { RuleTester } from 'oxlint/plugins-dev';

import { noDestructuredParametersRule } from '../../../src/rules/no-destructured-parameters.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const props = { messageId: 'destructuredProps' };
const args = { messageId: 'destructuredArgs' };
const name = { messageId: 'componentPropsName' };

tester.run('trogonstack/no-destructured-parameters', noDestructuredParametersRule, {
  valid: [
    { code: 'function Button(props: ButtonProps) { return <button />; }', filename: 'button.tsx' },
    { code: 'const Button = (props) => <button />;', filename: 'button.tsx' },
    { code: 'function useThing(props: Options) { return props; }', filename: 'use-thing.ts' },
    { code: 'function load(args: LoadArgs) { return args; }', filename: 'load.ts' },
    { code: 'function load([first, second]) { return first; }', filename: 'load.js' },
    { code: 'function load([first, second] = []) { return first; }', filename: 'load.js' },
    { code: 'items.map((item) => item.id);', filename: 'list.ts' },
    { code: 'function load(value) { return value; }', filename: 'load.ts' },
    { code: 'const render = (p) => p;', filename: 'render.tsx' },
    { code: 'const useThing = (value) => value;', filename: 'use-thing.ts' },
    { code: 'const MAX_ITEMS = (args) => args;', filename: 'max.tsx' },
    { code: 'type Handler = ({ id }: Input) => void;', filename: 'types.ts' },
    { code: 'declare function load({ id }: Input): void;', filename: 'types.ts' },
    { code: 'interface Api { load({ id }: Input): void }', filename: 'types.ts' },
    { code: 'const Button = memo((props: Props) => <button />);', filename: 'button.tsx' },
  ],
  invalid: [
    {
      code: 'function Button(input = {}) { return <button />; }',
      filename: 'button.tsx',
      errors: [name],
    },
    { code: 'function load({ id }) { return id; }', filename: 'load.ts', errors: [args] },
    { code: 'const load = function ({ id }) { return id; };', filename: 'load.ts', errors: [args] },
    { code: 'const load = ({ id }) => id;', filename: 'load.ts', errors: [args] },
    { code: 'function load({ id }: LoadArgs) { return id; }', filename: 'load.ts', errors: [args] },
    { code: 'function load({ id } = {}) { return id; }', filename: 'load.ts', errors: [args] },
    {
      code: 'function load({ id }: LoadArgs = defaults) { return id; }',
      filename: 'load.ts',
      errors: [args],
    },
    { code: 'function load(first, { id }) { return id; }', filename: 'load.ts', errors: [args] },
    {
      code: 'function load({ id }, { name }) { return id; }',
      filename: 'load.ts',
      errors: [args, args],
    },
    { code: 'items.map(({ id }) => id);', filename: 'list.ts', errors: [args] },
    { code: 'items.map(function ({ id }) { return id; });', filename: 'list.ts', errors: [args] },
    { code: 'class Store { load({ id }) { return id; } }', filename: 'store.ts', errors: [args] },
    {
      code: 'const store = { load({ id }) { return id; } };',
      filename: 'store.ts',
      errors: [args],
    },
    { code: 'class Store { constructor({ id }) {} }', filename: 'store.ts', errors: [args] },
    { code: 'const MAX_ITEMS = ({ id }) => id;', filename: 'max.tsx', errors: [args] },
    {
      code: 'function Button({ label }) { return <button>{label}</button>; }',
      filename: 'button.tsx',
      errors: [props],
    },
    {
      code: 'function Button({ label }: ButtonProps) { return <button>{label}</button>; }',
      filename: 'button.tsx',
      errors: [props],
    },
    {
      code: 'const Button = ({ label }: ButtonProps) => <button>{label}</button>;',
      filename: 'button.tsx',
      errors: [props],
    },
    {
      code: 'const Button = function ({ label }) { return <button>{label}</button>; };',
      filename: 'button.jsx',
      errors: [props],
    },
    {
      code: 'const Button = ({ label } = {}) => <button>{label}</button>;',
      filename: 'button.tsx',
      errors: [props],
    },
    {
      code: 'const Button = memo(({ label }) => <button>{label}</button>);',
      filename: 'button.tsx',
      errors: [props],
    },
    {
      code: 'const Button = React.memo(({ label }) => <button>{label}</button>);',
      filename: 'button.tsx',
      errors: [props],
    },
    {
      code: 'const Button = forwardRef(({ label }, ref) => <button ref={ref}>{label}</button>);',
      filename: 'button.tsx',
      errors: [props],
    },
    {
      code: 'const Button = React.forwardRef(function ({ label }, ref) { return <button ref={ref}>{label}</button>; });',
      filename: 'button.tsx',
      errors: [props],
    },
    {
      code: 'const Button = memo(forwardRef(({ label }, ref) => <button ref={ref}>{label}</button>));',
      filename: 'button.tsx',
      errors: [props],
    },
    {
      code: 'function useThing({ id }) { return id; }',
      filename: 'use-thing.ts',
      errors: [props],
    },
    {
      code: 'const useThing = ({ id }: Options) => id;',
      filename: 'use-thing.ts',
      errors: [props],
    },
    {
      code: 'const useThing = ({ id } = {}) => id;',
      filename: 'use-thing.tsx',
      errors: [props],
    },
    {
      code: 'function Button({ label }) { return label; }',
      filename: 'button.ts',
      errors: [args],
    },
    {
      code: 'const Button = ({ label }) => label;',
      filename: 'button.js',
      errors: [args],
    },
    {
      code: 'function Button(p) { return <button />; }',
      filename: 'button.tsx',
      errors: [name],
    },
    {
      code: 'const Button = (p: ButtonProps) => <button />;',
      filename: 'button.tsx',
      errors: [name],
    },
    {
      code: 'const Button = memo((p) => <button />);',
      filename: 'button.tsx',
      errors: [name],
    },
    {
      code: 'const Button = forwardRef((p, ref) => <button ref={ref} />);',
      filename: 'button.tsx',
      errors: [name],
    },
  ],
});
