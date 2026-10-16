import { RuleTester } from 'oxlint/plugins-dev';

import { noUnjustifiedUseClientRule } from '../../../src/rules/no-unjustified-use-client.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'unjustified' };

tester.run('trogonstack/no-unjustified-use-client', noUnjustifiedUseClientRule, {
  valid: [
    '"use client";\nimport * as React from "react";\nexport function View() { React.useState(false); return <button />; }',
    '"use client";\nimport React from "react";\nexport function View() { React.useState(false); return <button />; }',
    '"use client";\nimport React from "react";\nexport function View() { React["useState"](false); return <button />; }',
    '"use client";\nexport function View() { return <button onClick={() => null}>Save</button>; }',
    '"use client";\nimport { useEffect as effect } from "react";\nexport function View() { effect(() => {}, []); return <button />; }',
    '"use client";\nimport { usePathname } from "next/navigation";\nexport function View() { return <p>{usePathname()}</p>; }',
    '"use client";\nexport function View() { return <p>{window.location.pathname}</p>; }',
    '"use client";\nimport { useWorkspace } from "./use-workspace";\nexport function View() { const workspace = useWorkspace(); return <p>{workspace.name}</p>; }',
    '"use client";\nexport function View() { return <p>{globalThis["localStorage"].getItem("theme")}</p>; }',
    'export function View() { return <section>Server only</section>; }',
    '"use client";\nimport { useWorkspace } from "./use-workspace";\nexport const workspace = useWorkspace satisfies unknown;',
  ],
  invalid: [
    {
      code: '"use client";\nexport function View() { return <section>Read only</section>; }',
      errors: [error],
    },
    {
      code: '"use client";\nexport function View() { const state = props.state; return <section>{state}</section>; }',
      errors: [error],
    },
    {
      code: '"use client";\nimport { useState } from "react";\nexport function View() { return <section>Static</section>; }',
      errors: [error],
    },
    {
      code: '"use client";\nexport function View() { return <p online="yes">Status</p>; }',
      errors: [error],
    },
    {
      code: '"use client";\nimport { useWorkspace } from "./use-workspace";\nconst config = { useWorkspace: false };\nexport function View() { return <p>{String(config.useWorkspace)}</p>; }',
      errors: [error],
    },
    {
      code: '"use client";\nconst settings = { window: "server" };\nexport function View() { return <p>{settings.window}</p>; }',
      errors: [error],
    },
    {
      code: '"use client";\nexport function View({ window }) { return <p>{window.location}</p>; }',
      errors: [error],
    },
    {
      code: '"use client";\nimport type { AppRouterInstance } from "next/navigation";\nexport function View(): AppRouterInstance | null { return null; }',
      errors: [error],
    },
    {
      code: '"use client";\nimport { useWorkspace } from "./use-workspace";\ntype Workspace = ReturnType<typeof useWorkspace>;\nexport function View(): Workspace | null { return null; }',
      errors: [error],
    },
  ],
});
