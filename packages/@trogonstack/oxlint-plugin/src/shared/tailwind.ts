export interface ClassToken {
  readonly variants: readonly string[];
  readonly base: string;
  readonly important: boolean;
}

function splitVariants(token: string): string[] {
  const segments: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < token.length; index += 1) {
    const character = token.charAt(index);
    if (character === '[' || character === '(') {
      depth += 1;
    } else if (character === ']' || character === ')') {
      depth = Math.max(0, depth - 1);
    } else if (character === ':' && depth === 0) {
      segments.push(token.slice(start, index));
      start = index + 1;
    }
  }

  segments.push(token.slice(start));
  return segments;
}

/** Splits a Tailwind class into its variants, base utility, and important modifier. */
export function parseClassToken(item: string): ClassToken {
  let token = item.trim();
  let important = false;
  if (token.endsWith('!')) {
    important = true;
    token = token.slice(0, -1);
  }
  if (token.startsWith('!')) {
    important = true;
    token = token.slice(1);
  }

  const segments = splitVariants(token);
  let base = segments.at(-1) ?? '';
  if (base.startsWith('!')) {
    important = true;
    base = base.slice(1);
  }
  return { variants: segments.slice(0, -1), base, important };
}

export function classBase(item: string): string {
  return parseClassToken(item).base;
}
