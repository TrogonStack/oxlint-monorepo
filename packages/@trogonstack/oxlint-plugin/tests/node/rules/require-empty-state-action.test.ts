import { RuleTester } from 'oxlint/plugins-dev';

import { requireEmptyStateActionRule } from '../../../src/rules/require-empty-state-action.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });

tester.run('trogonstack/require-empty-state-action', requireEmptyStateActionRule, {
  valid: [
    {
      code: 'export function View() { return <section><p>No invoices</p><button>Create invoice</button></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices. Clear filter to see more.</p></section>; }',
    },
    {
      code: 'export function View() { return <section><p>Nothing found</p><a href="/settings">Open settings</a></section>; }',
    },
    {
      code: 'export function View() { return <section><div onClick={() => retry()}><p>0 results</p></div></section>; }',
    },
    {
      code: 'export function View() { return <p>No action required.</p>; }',
    },
    {
      code: 'export function View() { return <div className="empty-state"><p><span>No invoices</span></p><button>Retry</button></div>; }',
    },
    {
      code: 'export function View() { return <div className="empty-state"><p><span>No invoices.</span><span>Create an invoice to begin.</span></p></div>; }',
    },
    {
      code: "export function View() { return <section>{false && 'No invoices'}</section>; }",
    },
    {
      code: 'export function View() { return <section>{undefined && <p>No invoices</p>}</section>; }',
    },
    {
      code: 'export function View() { return <section>{void 0 && <p>No invoices</p>}</section>; }',
    },
    {
      code: 'export function View() { return <section>{!true && <p>No invoices</p>}{!!false && <p>No invoices</p>}{-0 && <p>No invoices</p>}</section>; }',
    },
    {
      code: "export function View() { return <section>{'No action required' || 'No invoices'}</section>; }",
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><button disabled={false}>Retry</button></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><button aria-disabled="false">Retry</button></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><input hidden={false} /></section>; }',
    },
    {
      code: 'export function View() { return <div>{empty && <p>No invoices</p>}{empty && <button>Retry</button>}</div>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><fieldset disabled><legend><button>Retry</button></legend></fieldset></section>; }',
    },
    {
      code: 'export function View() { return <div>{items.length === 0 && <p>No invoices</p>}{items.length === 0 && <button>Retry</button>}</div>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><fieldset aria-disabled="true"><button>Retry</button></fieldset></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><fieldset disabled><><legend><button>Retry</button></legend></></fieldset></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><fieldset disabled><React.Fragment><legend><button>Retry</button></legend></React.Fragment></fieldset></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><Fieldset disabled><button>Retry</button></Fieldset></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><div onClick={undefined}><button>Retry</button></div></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><a disabled href="/retry">Retry</a></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><a onClick={() => act()}>Go</a></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><div disabled onClick={() => act()}>Go</div></section>; }',
    },
    {
      code: 'export function View() { return <div>{a && b && <p>No invoices</p>}{a && <button>Retry</button>}</div>; }',
    },
    {
      code: 'export function View() { return <div>{a && !b && <p>No invoices</p>}{a && <button>Retry</button>}</div>; }',
    },
    {
      code: 'export function View() { return <div>{a && b ? <p>No invoices</p> : null}{a && <button>Retry</button>}</div>; }',
    },
    {
      code: 'export function View() { return <div>{a && (b && c) && <p>No invoices</p>}{c && <button>Retry</button>}</div>; }',
    },
    {
      code: 'export function View() { return <section>{empty === true && <p>No invoices</p>}{empty && <button>Retry</button>}</section>; }',
    },
    {
      code: 'export function View() { return <section>{empty === false && <p>No invoices</p>}{!empty && <button>Retry</button>}</section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><button disabled={void 0}>Go</button></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><button aria-disabled={void 0}>Retry</button></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><button disabled>Retry</button>Create an invoice to begin.</section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><a href={`/retry`}>Go</a></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p>{(<button>Go</button> as unknown as JSX.Element)}</section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p>{(<button>Go</button> satisfies JSX.Element)}</section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><button aria-disabled={(false as boolean)}>Retry</button></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><a href={("/retry" as string)}>Go</a></section>; }',
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><input type={("text" as const)} /></section>; }',
    },
  ],
  invalid: [
    {
      code: 'export function View() { return <section><p>No invoices</p></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: "export function View() { return <section>{empty ? 'Nothing found' : 'No invoices'}</section>; }",
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><div className="empty-state"><p>No invoices</p></div><footer><button>Create invoice</button></footer></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><button disabled>Retry</button></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><a>Open settings</a></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><input type="hidden" value="retry" /></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><button disabled="false">Retry</button></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><input hidden="false" /></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><div hidden><button>Retry</button></div></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section>{empty ? <p>No invoices</p> : <button>Retry</button>}</section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No <strong>invoices</strong></p></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: "export function View() { return <div className=\"empty-state\"><p>{empty ? 'No invoices' : 'Create an invoice'}</p></div>; }",
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: "export function View() { return <div className=\"empty-state\"><p>{empty ? 'No invoices' : 'Loaded'}</p>{!empty && <button>Retry</button>}</div>; }",
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><fieldset disabled><button>Retry</button></fieldset></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <div>{empty && <p>No invoices</p>}<fieldset disabled>{empty && <legend>Info</legend>}<legend><button>Retry</button></legend></fieldset></div>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><fieldset disabled><Legend><button>Retry</button></Legend></fieldset></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'const Fragment = ({ children }) => <div>{children}</div>; export function View() { return <section><p>No invoices</p><fieldset disabled><Fragment><legend><button>Retry</button></legend></Fragment></fieldset></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><Button disabled>Retry</Button></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><div onClick>Go</div></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><div onClick={true}>Go</div></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><div onClick="handler">Go</div></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><div onClick={void 0}>Go</div></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><div onClick={false && retry}>Go</div></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><div onClick={true ? false : retry}>Go</div></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><div onClick={false ? retry : false}>Go</div></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p><div onClick={undefined ?? false}>Go</div></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>No invoices</p>{a0 ? <button>Retry</button> : null}{a1 ? <button>Retry</button> : null}{a2 ? <button>Retry</button> : null}{a3 ? <button>Retry</button> : null}{a4 ? <button>Retry</button> : null}{a5 ? <button>Retry</button> : null}{a6 ? <button>Retry</button> : null}</section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: "export function View() { return <section><p>No invoices</p>{a0 ? 'Retry' : null}{a1 ? 'Retry' : null}{a2 ? 'Retry' : null}{a3 ? 'Retry' : null}{a4 ? 'Retry' : null}{a5 ? 'Retry' : null}{a6 ? 'Retry' : null}</section>; }",
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p><>No invoices</></p></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><button disabled>No invoices</button></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <div>{a && b && <p>No invoices</p>}{!a && <button>Retry</button>}</div>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>{("No invoices" as string)}</p></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>{("No invoices" satisfies string)}</p></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
    {
      code: 'export function View() { return <section><p>{("No invoices"!)}</p></section>; }',
      errors: [{ messageId: 'emptyStateAction' }],
    },
  ],
});
