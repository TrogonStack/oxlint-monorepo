import { defineRule } from '@oxlint/plugins';

import type { ESTree } from '@oxlint/plugins';

import { getStaticClassPaths } from '../shared/class-paths.ts';
import { getJSXExpression, isInsideJSXAttributeValue, isJSXAttributeNamed } from '../shared/jsx.ts';
import { isStringLiteral, staticTemplateValue } from '../shared/static-expression.ts';
import {
  getPropertyName,
  getPropertyValue,
  splitClasses,
  styleObjectProperties,
} from '../shared/style-object.ts';
import { ruleDocsUrl } from '../shared/docs.ts';

type MotionKind = 'animation' | 'transition';

interface ClassToken {
  readonly variants: readonly string[];
  readonly base: string;
  readonly important: boolean;
}

interface ClassMotion {
  readonly kind: MotionKind;
  readonly variants: readonly string[];
  readonly important: boolean;
}

interface MediaBlock {
  readonly start: number;
  readonly end: number;
  readonly contentStart: number;
  readonly content: string;
  readonly skipsSources: boolean;
  readonly sourceScope: string;
  readonly reducedMotionScope: string | null;
  readonly isTopLevel: boolean;
  readonly hasNestedConditional: boolean;
}

interface Segment {
  readonly value: string;
  readonly offset: number;
}

interface LayerBlock {
  readonly start: number;
  readonly end: number;
}

interface CssDeclaration {
  readonly kind: MotionKind;
  readonly value: string;
  readonly important: boolean;
  readonly position: number;
}

interface CssMotionRule extends CssDeclaration {
  readonly selector: string;
  readonly mediaScope: string;
  readonly isLayered: boolean;
  readonly hasNestedSelector: boolean;
}

const ANIMATION_RE = /^animate-/;
const TRANSITION_RE = /^transition(?:-|$)/;
const MOTION_STYLE_PROPERTIES: ReadonlySet<string> = new Set([
  'animation',
  'animationName',
  'transition',
]);

function classToken(item: string): ClassToken {
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

  const segments = token.split(':');
  let base = segments.at(-1) ?? '';
  if (base.startsWith('!')) {
    important = true;
    base = base.slice(1);
  }
  return { variants: segments.slice(0, -1), base, important };
}

function variantScope(variants: readonly string[]): string[] {
  return variants.filter((variant) => variant !== 'motion-reduce' && variant !== 'motion-safe');
}

function fallbackMatches(source: ClassMotion, fallback: ClassMotion): boolean {
  const sourceScope = variantScope(source.variants);
  const fallbackScope = variantScope(fallback.variants);
  return (
    sourceScope.length === fallbackScope.length &&
    sourceScope.every((variant, index) => fallbackScope[index] === variant)
  );
}

function classFallbackOverrides(source: ClassMotion, fallback: ClassMotion): boolean {
  return !source.important || fallback.important;
}

function classMotionNeedsFallback(value: string): boolean {
  const sources: ClassMotion[] = [];
  const fallbacks: ClassMotion[] = [];

  for (const item of splitClasses(value)) {
    const token = classToken(item);
    if (token.variants.includes('motion-reduce')) {
      if (token.base === 'animate-none') {
        fallbacks.push({
          kind: 'animation',
          variants: token.variants,
          important: token.important,
        });
      }
      if (token.base === 'transition-none') {
        fallbacks.push({
          kind: 'transition',
          variants: token.variants,
          important: token.important,
        });
      }
    }

    if (token.variants.includes('motion-safe')) continue;

    if (ANIMATION_RE.test(token.base) && token.base !== 'animate-none') {
      sources.push({ kind: 'animation', variants: token.variants, important: token.important });
    }
    if (TRANSITION_RE.test(token.base) && token.base !== 'transition-none') {
      sources.push({ kind: 'transition', variants: token.variants, important: token.important });
    }
  }

  return sources.some(
    (source) =>
      !fallbacks.some(
        (fallback) =>
          fallback.kind === source.kind &&
          fallbackMatches(source, fallback) &&
          classFallbackOverrides(source, fallback),
      ),
  );
}

function isStaticNone(value: string | number | null): boolean {
  return typeof value === 'string' && value.trim().toLowerCase() === 'none';
}

function isStaticMotionValue(value: string | number | null): boolean {
  return typeof value === 'string' && value.trim().length > 0 && !isStaticNone(value);
}

function styleHasMotion(expression: ESTree.Node | null): boolean {
  return styleObjectProperties(expression).some((property) => {
    const name = getPropertyName(property);
    if (name === null || !MOTION_STYLE_PROPERTIES.has(name)) return false;

    return isStaticMotionValue(getPropertyValue(property));
  });
}

function isUnescapedCssQuote(value: string, index: number, quote: string): boolean {
  if (value[index] !== quote) return false;

  let backslashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) {
    backslashCount += 1;
  }
  return backslashCount % 2 === 0;
}

function findClosingBrace(value: string, openingBrace: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let index = openingBrace; index < value.length; index += 1) {
    const character = value.charAt(index);
    if (quote !== null) {
      if (isUnescapedCssQuote(value, index, quote)) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return value.length - 1;
}

function splitTopLevelMediaList(header: string): string[] {
  const queries: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < header.length; index += 1) {
    if (header[index] === '(') {
      depth += 1;
    } else if (header[index] === ')') {
      depth = Math.max(0, depth - 1);
    } else if (header[index] === ',' && depth === 0) {
      queries.push(header.slice(start, index).trim());
      start = index + 1;
    }
  }

  const last = header.slice(start).trim();
  if (last) queries.push(last);
  return queries;
}

function hasPositiveMotionPreference(query: string, preference: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized || /\bnot\b/.test(normalized)) return false;
  return new RegExp(`\\(\\s*prefers-reduced-motion\\s*:\\s*${preference}\\s*\\)`, 'i').test(
    normalized,
  );
}

function isNoPreferenceOnly(header: string): boolean {
  if (/\bor\b/i.test(header)) return false;
  const queries = splitTopLevelMediaList(header);
  return (
    queries.length > 0 &&
    queries.every((query) => hasPositiveMotionPreference(query, 'no-preference'))
  );
}

function normalizeMediaScope(scope: string): string {
  return scope
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*:\s*/g, ':')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');
}

function reducedMotionMediaScope(header: string): string | null {
  const queries = splitTopLevelMediaList(header);
  const [query] = queries;
  if (queries.length !== 1 || query === undefined || /\b(?:not|or)\b/i.test(header)) return null;

  const preference = /\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/gi;
  const matches = [...query.matchAll(preference)];
  if (matches.length !== 1) return null;

  let scope = query.replace(preference, ' ').trim();
  scope = scope
    .replace(/^(?:and\s+)+/i, '')
    .replace(/(?:\s+and)+$/i, '')
    .replace(/\band\s+and\b/gi, 'and');
  if (/prefers-reduced-motion/i.test(scope)) return null;
  return normalizeMediaScope(scope);
}

function maskCssQuotedStrings(value: string): string {
  let masked = '';
  let quote: string | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const character = value.charAt(index);
    if (quote !== null) {
      if (isUnescapedCssQuote(value, index, quote)) quote = null;
      masked += character === '\n' ? '\n' : ' ';
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      masked += ' ';
      continue;
    }
    masked += character;
  }

  return masked;
}

function braceDepthBefore(value: string, end: number): number {
  let depth = 0;
  let quote: string | null = null;

  for (let index = 0; index < end; index += 1) {
    const character = value.charAt(index);
    if (quote !== null) {
      if (isUnescapedCssQuote(value, index, quote)) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth = Math.max(0, depth - 1);
    }
  }

  return depth;
}

function motionMediaBlocks(value: string): MediaBlock[] {
  const blocks: MediaBlock[] = [];
  const mediaExpression = /@media\s*([^{}]+)\{/gi;
  const scan = maskCssQuotedStrings(value);

  for (let match = mediaExpression.exec(scan); match !== null; match = mediaExpression.exec(scan)) {
    const header = match[1] ?? '';
    const openingBrace = match.index + match[0].lastIndexOf('{');
    const closingBrace = findClosingBrace(scan, openingBrace);
    const reducedMotionScope = reducedMotionMediaScope(header);
    blocks.push({
      start: match.index,
      end: closingBrace + 1,
      contentStart: openingBrace + 1,
      content: value.slice(openingBrace + 1, closingBrace),
      skipsSources: isNoPreferenceOnly(header),
      sourceScope: reducedMotionScope ?? normalizeMediaScope(header),
      reducedMotionScope,
      isTopLevel: braceDepthBefore(scan, match.index) === 0,
      hasNestedConditional: /@(media|supports|container|layer|scope|starting-style)\b/i.test(
        maskCssQuotedStrings(value.slice(openingBrace + 1, closingBrace)),
      ),
    });
    mediaExpression.lastIndex = closingBrace + 1;
  }

  return blocks;
}

function outsideMotionMediaSegments(value: string, blocks: readonly MediaBlock[]): Segment[] {
  let cursor = 0;
  const segments: Segment[] = [];
  for (const block of blocks) {
    if (cursor < block.start) {
      segments.push({ value: value.slice(cursor, block.start), offset: cursor });
    }
    cursor = block.end;
  }
  if (cursor < value.length) segments.push({ value: value.slice(cursor), offset: cursor });
  return segments;
}

function layerBlocks(value: string): LayerBlock[] {
  const blocks: LayerBlock[] = [];
  const layerExpression = /@layer(?:\s+[^{};]+)?\s*\{/gi;
  const scan = maskCssQuotedStrings(value);

  for (let match = layerExpression.exec(scan); match !== null; match = layerExpression.exec(scan)) {
    const openingBrace = match.index + match[0].lastIndexOf('{');
    const closingBrace = findClosingBrace(scan, openingBrace);
    blocks.push({ start: match.index, end: closingBrace + 1 });
    layerExpression.lastIndex = closingBrace + 1;
  }

  return blocks;
}

function isInsideLayer(position: number, blocks: readonly LayerBlock[]): boolean {
  return blocks.some((block) => position >= block.start && position < block.end);
}

function hasNestedCssBlocks(value: string): boolean {
  let depth = 0;
  let quote: string | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const character = value.charAt(index);
    if (quote !== null) {
      if (isUnescapedCssQuote(value, index, quote)) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '{') {
      depth += 1;
      if (depth > 1) return true;
    } else if (character === '}') {
      depth = Math.max(0, depth - 1);
    }
  }

  return false;
}

function cssDeclarations(value: string, offset = 0): CssDeclaration[] {
  const declarations: CssDeclaration[] = [];
  const declaration = /(?:^|[;{\s])\s*(animation(?:-name)?|transition)\s*:\s*([^;{}]+)/gi;
  const scan = maskCssQuotedStrings(value);

  for (let match = declaration.exec(scan); match !== null; match = declaration.exec(scan)) {
    const rawValue = (match[2] ?? '').trim();
    declarations.push({
      kind: (match[1] ?? '').startsWith('animation') ? 'animation' : 'transition',
      value: rawValue.replace(/\s*!important\s*$/i, '').trim(),
      important: /\s*!important\s*$/i.test(rawValue),
      position: offset + match.index,
    });
  }

  return declarations;
}

function isNoneMotionListItem(value: string): boolean {
  return /^none(?:\s|$)/i.test(value.trim());
}

function hasDeclaredMotion(value: string): boolean {
  return value.split(',').some((item) => !isNoneMotionListItem(item));
}

function disablesDeclaredMotion(value: string): boolean {
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 && items.every(isNoneMotionListItem);
}

function cssMotionRules(
  value: string,
  offset: number,
  mediaScope: string,
  layers: readonly LayerBlock[],
): CssMotionRule[] {
  const rules: CssMotionRule[] = [];
  const ruleExpression = /([^{}]+)\{([^{}]*)\}/g;
  const scan = maskCssQuotedStrings(value);

  for (let match = ruleExpression.exec(scan); match !== null; match = ruleExpression.exec(scan)) {
    const openingBrace = match.index + match[0].indexOf('{');
    const closingBrace = match.index + match[0].length - 1;
    const selector = value.slice(match.index, openingBrace).trim();
    if (!selector || selector.startsWith('@')) continue;

    const bodyOffset = offset + openingBrace + 1;
    for (const declaration of cssDeclarations(
      value.slice(openingBrace + 1, closingBrace),
      bodyOffset,
    )) {
      rules.push({
        selector,
        mediaScope,
        isLayered: isInsideLayer(declaration.position, layers),
        hasNestedSelector: braceDepthBefore(scan, match.index) > 0,
        ...declaration,
      });
    }
  }

  if (rules.length === 0) {
    return cssDeclarations(value, offset).map((declaration) => ({
      selector: '*',
      mediaScope,
      isLayered: isInsideLayer(declaration.position, layers),
      hasNestedSelector: hasNestedCssBlocks(scan),
      ...declaration,
    }));
  }

  return rules;
}

function normalizeSelector(selector: string): string {
  let normalized = '';
  let depth = 0;
  let quote: string | null = null;
  let pendingWhitespace = false;

  for (let index = 0; index < selector.length; index += 1) {
    const character = selector.charAt(index);
    if (quote !== null) {
      normalized += character;
      if (isUnescapedCssQuote(selector, index, quote)) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      if (pendingWhitespace && normalized && !/[>+~]$/.test(normalized)) normalized += ' ';
      pendingWhitespace = false;
      quote = character;
      normalized += character;
      continue;
    }
    if (character === '[' || character === '(') {
      if (pendingWhitespace && normalized && !/[>+~]$/.test(normalized)) normalized += ' ';
      pendingWhitespace = false;
      depth += 1;
      normalized += character;
      continue;
    }
    if (character === ']' || character === ')') {
      depth = Math.max(0, depth - 1);
      normalized += character;
      continue;
    }
    if (depth === 0 && /\s/.test(character)) {
      pendingWhitespace = true;
      continue;
    }
    if (depth === 0 && (character === '>' || character === '+' || character === '~')) {
      normalized = normalized.trimEnd();
      normalized += character;
      pendingWhitespace = false;
      continue;
    }
    if (pendingWhitespace && normalized && !/[>+~]$/.test(normalized)) normalized += ' ';
    pendingWhitespace = false;
    normalized += character;
  }

  return normalized.trim();
}

function selectorsMatch(sourceSelector: string, fallbackSelector: string): boolean {
  const sourceSelectors = sourceSelector.split(',').map(normalizeSelector).filter(Boolean);
  const fallbackSelectors = new Set(
    fallbackSelector.split(',').map(normalizeSelector).filter(Boolean),
  );
  return sourceSelectors.every((source) => fallbackSelectors.has(source));
}

function stripCssComments(value: string): string {
  let stripped = '';
  let quote: string | null = null;
  let inComment = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value.charAt(index);
    if (inComment) {
      if (character === '*' && value[index + 1] === '/') {
        stripped += '  ';
        index += 1;
        inComment = false;
      } else {
        stripped += character === '\n' ? '\n' : ' ';
      }
      continue;
    }
    if (quote !== null) {
      stripped += character;
      if (isUnescapedCssQuote(value, index, quote)) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      stripped += character;
      continue;
    }
    if (character === '/' && value[index + 1] === '*') {
      stripped += '  ';
      index += 1;
      inComment = true;
      continue;
    }
    stripped += character;
  }

  return stripped;
}

function fallbackOverrides(source: CssMotionRule, fallback: CssMotionRule): boolean {
  if (source.important !== fallback.important) return fallback.important;
  return fallback.position > source.position;
}

function cssStringNeedsFallback(value: string): boolean {
  const text = stripCssComments(value);
  const blocks = motionMediaBlocks(text);
  const layers = layerBlocks(text);
  const sources = outsideMotionMediaSegments(text, blocks)
    .flatMap(({ value: segment, offset }) => cssMotionRules(segment, offset, '', layers))
    .concat(
      blocks
        .filter((block) => !block.skipsSources)
        .flatMap((block) =>
          cssMotionRules(block.content, block.contentStart, block.sourceScope, layers),
        ),
    )
    .filter((rule) => hasDeclaredMotion(rule.value));
  const fallbacks = blocks
    .filter(
      (block) =>
        block.isTopLevel && !block.hasNestedConditional && block.reducedMotionScope !== null,
    )
    .flatMap((block) =>
      cssMotionRules(block.content, block.contentStart, block.reducedMotionScope ?? '', layers),
    )
    .filter(
      (rule) => disablesDeclaredMotion(rule.value) && !rule.isLayered && !rule.hasNestedSelector,
    );

  return sources.some(
    (source) =>
      !fallbacks.some(
        (fallback) =>
          fallback.kind === source.kind &&
          !source.isLayered &&
          !source.hasNestedSelector &&
          fallback.mediaScope === source.mediaScope &&
          selectorsMatch(source.selector, fallback.selector) &&
          fallbackOverrides(source, fallback),
      ),
  );
}

export const requireReducedMotionRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      url: ruleDocsUrl('require-reduced-motion'),
      description:
        'Require a type-matched reduced-motion fallback when static UI code declares motion.',
    },
    schema: [],
    messages: {
      reducedMotion:
        'Motion needs a type-matched reduced-motion fallback such as motion-reduce:animate-none, motion-reduce:transition-none, or prefers-reduced-motion.',
    },
  },
  createOnce(context) {
    let usesReducedMotionHook = false;
    const candidates: ESTree.Node[] = [];

    return {
      before() {
        usesReducedMotionHook = false;
        candidates.length = 0;
      },
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'useReducedMotion') {
          usesReducedMotionHook = true;
        }
      },
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, 'className')) {
          if (getStaticClassPaths(node).some(classMotionNeedsFallback)) candidates.push(node);
        }

        if (isJSXAttributeNamed(node, 'style') && styleHasMotion(getJSXExpression(node))) {
          candidates.push(node);
        }
      },
      Literal(node) {
        if (isInsideJSXAttributeValue(node)) return;

        if (isStringLiteral(node) && cssStringNeedsFallback(node.value)) candidates.push(node);
      },
      TemplateLiteral(node) {
        if (isInsideJSXAttributeValue(node)) return;

        const value = staticTemplateValue(node);
        if (value !== null && value !== '' && cssStringNeedsFallback(value)) candidates.push(node);
      },
      'Program:exit'() {
        if (usesReducedMotionHook) return;

        for (const node of candidates) {
          context.report({ node, messageId: 'reducedMotion' });
        }
      },
    };
  },
});
