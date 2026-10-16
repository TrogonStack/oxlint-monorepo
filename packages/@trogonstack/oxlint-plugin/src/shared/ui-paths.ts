import type { ESTree } from '@oxlint/plugins';

import { findJSXAttribute } from './jsx.ts';
import {
  isBooleanLiteral,
  isStringLiteral,
  isUndefinedIdentifier,
  staticExpressionNullish,
  staticExpressionTruthiness,
  templateCookedText,
  unwrapStaticExpression,
} from './static-expression.ts';
import { patternMatches } from './text.ts';

type Node = ESTree.Node;
type Maybe<T> = T | null | undefined;

const ACTION_ELEMENT_NAMES: ReadonlySet<string> = new Set([
  'a',
  'button',
  'input',
  'select',
  'textarea',
]);
const FIELDSET_DISABLED_CONTROL_NAMES: ReadonlySet<string> = new Set([
  'button',
  'input',
  'select',
  'textarea',
]);
const NATIVE_DISABLED_ELEMENT_NAMES: ReadonlySet<string> = new Set([
  ...FIELDSET_DISABLED_CONTROL_NAMES,
  'fieldset',
]);
const MAX_STATIC_UI_PATHS = 64;

type ConditionKind = 'truthy' | 'nullish';

interface UiCondition {
  readonly key: string;
  readonly value: boolean;
}

interface UiPath {
  readonly text: string;
  readonly texts: readonly string[];
  readonly actionTexts: readonly string[];
  readonly hasUnusableActionText: boolean;
  readonly hasActionWording: boolean;
  readonly hasAction: boolean;
  readonly conditions: ReadonlyMap<string, boolean>;
}

interface FieldsetState {
  readonly path: UiPath;
  readonly firstLegendAvailable: boolean;
}

interface ConditionDescriptor {
  readonly key: string;
  readonly inverted: boolean;
  readonly subject: Maybe<Node>;
}

interface UiPathState {
  readonly actionWords: readonly string[];
  readonly conditionIds: WeakMap<Node, number>;
  nextConditionId: number;
}

/** The parts of a statically enumerated render path that rules inspect. */
export interface StaticUiPath {
  readonly texts: readonly string[];
  readonly actionTexts: readonly string[];
  readonly hasAction: boolean;
}

function openingElementName(opening: ESTree.JSXOpeningElement): string {
  return opening.name.type === 'JSXIdentifier' ? opening.name.name.toLowerCase() : '';
}

function isNativeElement(opening: ESTree.JSXOpeningElement, name: string): boolean {
  return opening.name.type === 'JSXIdentifier' && opening.name.name === name;
}

function isFragmentElement(opening: ESTree.JSXOpeningElement): boolean {
  return (
    opening.name.type === 'JSXMemberExpression' &&
    opening.name.object.type === 'JSXIdentifier' &&
    opening.name.object.name === 'React' &&
    opening.name.property.name === 'Fragment'
  );
}

function hasNonEmptyHref(opening: ESTree.JSXOpeningElement): boolean {
  const value = findJSXAttribute(opening, 'href')?.value;
  if (value === null || value === undefined) return false;
  if (isStringLiteral(value)) return value.value.trim().length > 0;
  if (value.type !== 'JSXExpressionContainer') return false;

  const expression = unwrapStaticExpression(value.expression);
  if (isStringLiteral(expression)) return expression.value.trim().length > 0;
  if (expression?.type === 'TemplateLiteral' && expression.expressions.length === 0) {
    return templateCookedText(expression).trim().length > 0;
  }
  return false;
}

function isNativeBooleanAttributePresent(attribute: ESTree.JSXAttribute | null): boolean {
  if (attribute === null) return false;
  if (attribute.value?.type !== 'JSXExpressionContainer') return true;
  return staticExpressionTruthiness(attribute.value.expression) !== false;
}

function isAriaDisabled(attribute: ESTree.JSXAttribute | null): boolean {
  if (attribute === null) return false;
  if (attribute.value === null) return true;

  const value: Maybe<Node> =
    attribute.value.type === 'JSXExpressionContainer'
      ? unwrapStaticExpression(attribute.value.expression)
      : attribute.value;
  if (isUndefinedIdentifier(value)) return false;
  if (value?.type === 'UnaryExpression' && value.operator === 'void') return false;
  if (value?.type === 'Literal') {
    return !(
      value.value === false ||
      value.value === 0 ||
      value.value === null ||
      value.value === 'false'
    );
  }

  return staticExpressionTruthiness(value) !== false;
}

function isHidden(opening: ESTree.JSXOpeningElement): boolean {
  return isNativeBooleanAttributePresent(findJSXAttribute(opening, 'hidden'));
}

function isDisabled(opening: ESTree.JSXOpeningElement): boolean {
  return (
    (NATIVE_DISABLED_ELEMENT_NAMES.has(openingElementName(opening)) &&
      isNativeBooleanAttributePresent(findJSXAttribute(opening, 'disabled'))) ||
    isAriaDisabled(findJSXAttribute(opening, 'aria-disabled'))
  );
}

function isNotHiddenInputType(value: unknown): boolean {
  return typeof value !== 'string' || value.toLowerCase() !== 'hidden';
}

function isVisibleFormControl(opening: ESTree.JSXOpeningElement, name: string): boolean {
  if (isHidden(opening)) return false;
  if (name !== 'input') return true;

  const type = findJSXAttribute(opening, 'type');
  if (type === null) return true;

  if (type.value?.type === 'Literal') return isNotHiddenInputType(type.value.value);
  if (type.value?.type !== 'JSXExpressionContainer') return true;

  const expression = unwrapStaticExpression(type.value.expression);
  if (isUndefinedIdentifier(expression)) return true;
  if (expression?.type === 'Literal') return isNotHiddenInputType(expression.value);
  if (expression?.type === 'TemplateLiteral' && expression.expressions.length === 0) {
    return templateCookedText(expression).toLowerCase() !== 'hidden';
  }

  return false;
}

function hasEnabledOnClick(opening: ESTree.JSXOpeningElement): boolean {
  if (isDisabled(opening) || isHidden(opening)) return false;

  const attribute = findJSXAttribute(opening, 'onClick');
  if (attribute === null) return false;

  const value = attribute.value;
  if (value === null || value.type === 'Literal') return false;

  if (value.type === 'JSXExpressionContainer') {
    const expression = unwrapStaticExpression(value.expression);
    return !(
      staticExpressionTruthiness(expression) === false ||
      expression?.type === 'Literal' ||
      expression?.type === 'ArrayExpression' ||
      expression?.type === 'ObjectExpression' ||
      expression?.type === 'JSXElement' ||
      expression?.type === 'JSXFragment'
    );
  }

  return false;
}

function isNativeDisabledFieldset(opening: ESTree.JSXOpeningElement): boolean {
  return (
    isNativeElement(opening, 'fieldset') &&
    isNativeBooleanAttributePresent(findJSXAttribute(opening, 'disabled'))
  );
}

function isUsableActionElement(
  opening: ESTree.JSXOpeningElement,
  disabledByFieldset: boolean,
): boolean {
  const name = openingElementName(opening);
  if (isDisabled(opening)) return false;
  if (disabledByFieldset && FIELDSET_DISABLED_CONTROL_NAMES.has(name)) return false;

  if (name === 'button') return !isHidden(opening);
  if (name === 'a')
    return !isHidden(opening) && (hasNonEmptyHref(opening) || hasEnabledOnClick(opening));
  if (name === 'input' || name === 'select' || name === 'textarea') {
    return isVisibleFormControl(opening, name);
  }
  return hasEnabledOnClick(opening);
}

function emptyUiPath(): UiPath {
  return {
    text: '',
    texts: [],
    actionTexts: [],
    hasUnusableActionText: false,
    hasActionWording: false,
    hasAction: false,
    conditions: new Map(),
  };
}

function textUiPath(text: string, state: UiPathState): UiPath {
  const hasActionWording = patternMatches(text, state.actionWords);
  return {
    ...emptyUiPath(),
    text,
    actionTexts: hasActionWording ? [text] : [],
    hasActionWording,
  };
}

function normalizeUiText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function joinUiText(left: string, right: string): string {
  return [left, right].filter(Boolean).join(' ');
}

function staticConditionKey(expression: Maybe<Node>): string | null {
  const subject = unwrapStaticExpression(expression);
  if (subject === null || subject === undefined) return null;

  if (subject.type === 'Identifier') return `identifier:${subject.name}`;
  if (subject.type === 'ThisExpression') return 'this';

  if (subject.type === 'Literal') {
    const value = subject.value;
    return `literal:${typeof value === 'bigint' ? `${value}n` : JSON.stringify(value)}`;
  }

  if (subject.type === 'MemberExpression') {
    const object = staticConditionKey(subject.object);
    if (object === null) return null;
    if (!subject.computed && subject.property.type === 'Identifier') {
      return `member:${object}.${subject.property.name}`;
    }
    const property = staticConditionKey(subject.property);
    return property === null ? null : `member:${object}[${property}]`;
  }

  if (subject.type === 'UnaryExpression') {
    const argument = staticConditionKey(subject.argument);
    return argument === null ? null : `${subject.type}:${subject.operator}(${argument})`;
  }

  if (subject.type === 'BinaryExpression' || subject.type === 'LogicalExpression') {
    const left = staticConditionKey(subject.left);
    const right = staticConditionKey(subject.right);
    if (left === null || right === null) return null;
    return `${subject.type}:${subject.operator}(${left},${right})`;
  }

  return null;
}

function conditionDescriptor(
  expression: Node,
  kind: ConditionKind,
  state: UiPathState,
): ConditionDescriptor {
  let subject = unwrapStaticExpression(expression);
  let inverted = false;

  if (kind === 'truthy') {
    while (subject?.type === 'UnaryExpression' && subject.operator === '!') {
      inverted = !inverted;
      subject = unwrapStaticExpression(subject.argument);
    }
  }

  const staticKey = staticConditionKey(subject);
  if (staticKey !== null) return { key: `${kind}:${staticKey}`, inverted, subject };

  let id = state.conditionIds.get(expression);
  if (id === undefined) {
    id = state.nextConditionId;
    state.nextConditionId += 1;
    state.conditionIds.set(expression, id);
  }
  return { key: `${kind}:expression:${id}`, inverted: false, subject };
}

function conditionValue(descriptor: ConditionDescriptor, value: boolean): boolean {
  return descriptor.inverted ? !value : value;
}

function impliedTruthyConjunctionConditions(
  expression: Maybe<Node>,
  state: UiPathState,
): UiCondition[] {
  const subject = unwrapStaticExpression(expression);
  if (subject?.type === 'LogicalExpression' && subject.operator === '&&') {
    return [
      ...impliedTruthyConjunctionConditions(subject.left, state),
      ...impliedTruthyConjunctionConditions(subject.right, state),
    ];
  }

  if (subject?.type === 'BinaryExpression' && subject.operator === '===') {
    const leftBoolean = unwrapStaticExpression(subject.left);
    const rightBoolean = unwrapStaticExpression(subject.right);
    if (isBooleanLiteral(leftBoolean)) {
      const descriptor = conditionDescriptor(subject.right, 'truthy', state);
      return [{ key: descriptor.key, value: conditionValue(descriptor, leftBoolean.value) }];
    }
    if (isBooleanLiteral(rightBoolean)) {
      const descriptor = conditionDescriptor(subject.left, 'truthy', state);
      return [{ key: descriptor.key, value: conditionValue(descriptor, rightBoolean.value) }];
    }
  }

  if (subject === null || subject === undefined) return [];
  const descriptor = conditionDescriptor(subject, 'truthy', state);
  return [{ key: descriptor.key, value: conditionValue(descriptor, true) }];
}

function hasTruthyImplications(expression: Maybe<Node>): boolean {
  const subject = unwrapStaticExpression(expression);
  if (subject?.type === 'LogicalExpression' && subject.operator === '&&') return true;
  if (subject?.type !== 'BinaryExpression' || subject.operator !== '===') return false;
  return (
    isBooleanLiteral(unwrapStaticExpression(subject.left)) ||
    isBooleanLiteral(unwrapStaticExpression(subject.right))
  );
}

function uiCondition(
  expression: Node,
  kind: ConditionKind,
  value: boolean,
  state: UiPathState,
): UiCondition[] {
  const descriptor = conditionDescriptor(expression, kind, state);
  const condition: UiCondition = {
    key: descriptor.key,
    value: conditionValue(descriptor, value),
  };

  if (kind !== 'truthy' || !condition.value || !hasTruthyImplications(descriptor.subject)) {
    return [condition];
  }

  return [condition, ...impliedTruthyConjunctionConditions(descriptor.subject, state)];
}

function mergeUiConditions(
  left: ReadonlyMap<string, boolean> | undefined,
  right: Iterable<readonly [string, boolean]> | undefined,
): Map<string, boolean> | null {
  const conditions = new Map(left ?? []);
  for (const [key, value] of right ?? []) {
    if (conditions.has(key) && conditions.get(key) !== value) return null;
    conditions.set(key, value);
  }
  return conditions;
}

function withUiCondition(
  paths: readonly UiPath[],
  conditionsToMerge: readonly UiCondition[],
): UiPath[] {
  const merged: UiPath[] = [];
  for (const path of paths) {
    const conditions = mergeUiConditions(
      path.conditions,
      conditionsToMerge.map((condition): [string, boolean] => [condition.key, condition.value]),
    );
    if (conditions !== null) merged.push({ ...path, conditions });
  }
  return uniqueUiPaths(merged);
}

function sortedConditions(path: UiPath): [string, boolean][] {
  return [...path.conditions].toSorted(([left], [right]) => left.localeCompare(right));
}

function uiPathKey(path: UiPath): string {
  const text = normalizeUiText(path.text);
  const texts = path.texts.map(normalizeUiText).filter(Boolean);
  const actionTexts = path.actionTexts.map(normalizeUiText).filter(Boolean);
  const conditions = sortedConditions(path);
  return `${path.hasAction}:${path.hasUnusableActionText}:${path.hasActionWording}:${text}\u0000${texts.join('\u0001')}\u0000${actionTexts.join('\u0001')}\u0000${conditions.map(([name, value]) => `${name}:${value}`).join('\u0001')}`;
}

function uniqueUiPaths(paths: readonly UiPath[]): UiPath[] {
  const seen = new Set<string>();
  const unique: UiPath[] = [];

  const orderedPaths = paths.toSorted(
    (left, right) =>
      Number(left.hasAction) - Number(right.hasAction) ||
      Number(left.hasActionWording) - Number(right.hasActionWording) ||
      left.actionTexts.length - right.actionTexts.length,
  );
  for (const path of orderedPaths) {
    const key = uiPathKey(path);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      text: normalizeUiText(path.text),
      texts: path.texts.map(normalizeUiText).filter(Boolean),
      actionTexts: path.actionTexts.map(normalizeUiText).filter(Boolean),
      hasUnusableActionText: path.hasUnusableActionText,
      hasActionWording: path.hasActionWording,
      hasAction: path.hasAction,
      conditions: new Map(sortedConditions(path)),
    });
    if (unique.length >= MAX_STATIC_UI_PATHS) break;
  }

  return unique;
}

function combineUiPaths(left: UiPath, right: UiPath): UiPath | null {
  const conditions = mergeUiConditions(left.conditions, right.conditions);
  if (conditions === null) return null;
  return {
    text: joinUiText(left.text, right.text),
    texts: [...left.texts, ...right.texts],
    actionTexts: [...left.actionTexts, ...right.actionTexts],
    hasUnusableActionText: left.hasUnusableActionText || right.hasUnusableActionText,
    hasActionWording: left.hasActionWording || right.hasActionWording,
    hasAction: left.hasAction || right.hasAction,
    conditions,
  };
}

function combineUiPathGroups(groups: readonly (readonly UiPath[])[]): UiPath[] {
  let paths: UiPath[] = [emptyUiPath()];

  for (const group of groups) {
    const combined: UiPath[] = [];
    for (const left of paths) {
      for (const right of group) {
        const path = combineUiPaths(left, right);
        if (path === null) continue;
        combined.push(path);
        if (combined.length >= MAX_STATIC_UI_PATHS) break;
      }
      if (combined.length >= MAX_STATIC_UI_PATHS) break;
    }
    paths = uniqueUiPaths(combined);
  }

  return paths;
}

function isPotentialActionElement(opening: ESTree.JSXOpeningElement): boolean {
  return (
    ACTION_ELEMENT_NAMES.has(openingElementName(opening)) ||
    findJSXAttribute(opening, 'onClick') !== null
  );
}

function isNamedActionElement(opening: ESTree.JSXOpeningElement): boolean {
  return ACTION_ELEMENT_NAMES.has(openingElementName(opening));
}

function staticUiExpressionPaths(
  input: Maybe<Node>,
  disabledByFieldset: boolean,
  state: UiPathState,
): UiPath[] {
  const expression = unwrapStaticExpression(input);
  if (expression === null || expression === undefined) return [emptyUiPath()];

  if (expression.type === 'Literal') {
    if (typeof expression.value !== 'string') return [emptyUiPath()];
    return [textUiPath(expression.value, state)];
  }

  if (expression.type === 'TemplateLiteral') {
    if (expression.expressions.length > 0) return [emptyUiPath()];
    return [textUiPath(templateCookedText(expression), state)];
  }

  if (expression.type === 'JSXElement' || expression.type === 'JSXFragment') {
    return staticUiPaths(expression, disabledByFieldset, state);
  }

  if (expression.type === 'ConditionalExpression') {
    const truthiness = staticExpressionTruthiness(expression.test);
    if (truthiness === true)
      return staticUiExpressionPaths(expression.consequent, disabledByFieldset, state);
    if (truthiness === false)
      return staticUiExpressionPaths(expression.alternate, disabledByFieldset, state);
    return uniqueUiPaths([
      ...withUiCondition(
        staticUiExpressionPaths(expression.consequent, disabledByFieldset, state),
        uiCondition(expression.test, 'truthy', true, state),
      ),
      ...withUiCondition(
        staticUiExpressionPaths(expression.alternate, disabledByFieldset, state),
        uiCondition(expression.test, 'truthy', false, state),
      ),
    ]);
  }

  if (expression.type === 'LogicalExpression') {
    if (expression.operator === '&&') {
      const truthiness = staticExpressionTruthiness(expression.left);
      if (truthiness === false) return [emptyUiPath()];
      if (truthiness === true)
        return staticUiExpressionPaths(expression.right, disabledByFieldset, state);
      return uniqueUiPaths([
        ...withUiCondition([emptyUiPath()], uiCondition(expression.left, 'truthy', false, state)),
        ...withUiCondition(
          staticUiExpressionPaths(expression.right, disabledByFieldset, state),
          uiCondition(expression.left, 'truthy', true, state),
        ),
      ]);
    }

    if (expression.operator === '||') {
      const truthiness = staticExpressionTruthiness(expression.left);
      if (truthiness === true)
        return staticUiExpressionPaths(expression.left, disabledByFieldset, state);
      if (truthiness === false)
        return staticUiExpressionPaths(expression.right, disabledByFieldset, state);
      return uniqueUiPaths([
        ...withUiCondition(
          staticUiExpressionPaths(expression.left, disabledByFieldset, state),
          uiCondition(expression.left, 'truthy', true, state),
        ),
        ...withUiCondition(
          staticUiExpressionPaths(expression.right, disabledByFieldset, state),
          uiCondition(expression.left, 'truthy', false, state),
        ),
      ]);
    }

    const nullish = staticExpressionNullish(expression.left);
    if (nullish === true)
      return staticUiExpressionPaths(expression.right, disabledByFieldset, state);
    if (nullish === false)
      return staticUiExpressionPaths(expression.left, disabledByFieldset, state);
    return uniqueUiPaths([
      ...withUiCondition(
        staticUiExpressionPaths(expression.left, disabledByFieldset, state),
        uiCondition(expression.left, 'nullish', false, state),
      ),
      ...withUiCondition(
        staticUiExpressionPaths(expression.right, disabledByFieldset, state),
        uiCondition(expression.left, 'nullish', true, state),
      ),
    ]);
  }

  if (expression.type === 'ArrayExpression') {
    return combineUiPathGroups(
      expression.elements.map((element) =>
        staticUiExpressionPaths(element, disabledByFieldset, state),
      ),
    );
  }

  return [emptyUiPath()];
}

function uniqueFieldsetStates(states: readonly FieldsetState[]): FieldsetState[] {
  const seen = new Set<string>();
  const unique: FieldsetState[] = [];

  for (const fieldsetState of states) {
    const key = `${fieldsetState.firstLegendAvailable}:${uiPathKey(fieldsetState.path)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(fieldsetState);
    if (unique.length >= MAX_STATIC_UI_PATHS) break;
  }

  return unique;
}

function withFieldsetCondition(
  states: readonly FieldsetState[],
  condition: readonly UiCondition[],
): FieldsetState[] {
  return uniqueFieldsetStates(
    states.flatMap((fieldsetState) =>
      withUiCondition([fieldsetState.path], condition).map((path) => ({ ...fieldsetState, path })),
    ),
  );
}

function staticDisabledFieldsetSequenceStates(
  children: readonly Maybe<Node>[],
  disabledByFieldset: boolean,
  firstLegendAvailable: boolean,
  state: UiPathState,
): FieldsetState[] {
  let fieldsetStates: FieldsetState[] = [{ path: emptyUiPath(), firstLegendAvailable }];

  for (const child of children) {
    const combined: FieldsetState[] = [];
    for (const fieldsetState of fieldsetStates) {
      for (const childState of staticDisabledFieldsetNodeStates(
        child,
        disabledByFieldset,
        fieldsetState.firstLegendAvailable,
        state,
      )) {
        const path = combineUiPaths(fieldsetState.path, childState.path);
        if (path !== null) {
          combined.push({ path, firstLegendAvailable: childState.firstLegendAvailable });
        }
        if (combined.length >= MAX_STATIC_UI_PATHS) break;
      }
      if (combined.length >= MAX_STATIC_UI_PATHS) break;
    }
    fieldsetStates = uniqueFieldsetStates(combined);
  }

  return fieldsetStates;
}

function staticDisabledFieldsetChildrenPaths(
  children: readonly Maybe<Node>[],
  disabledByFieldset: boolean,
  state: UiPathState,
): UiPath[] {
  return staticDisabledFieldsetSequenceStates(children, disabledByFieldset, true, state).map(
    (fieldsetState) => fieldsetState.path,
  );
}

function staticDisabledFieldsetNodeStates(
  node: Maybe<Node>,
  disabledByFieldset: boolean,
  firstLegendAvailable: boolean,
  state: UiPathState,
): FieldsetState[] {
  if (node === null || node === undefined) return [{ path: emptyUiPath(), firstLegendAvailable }];

  if (node.type === 'JSXFragment') {
    return staticDisabledFieldsetSequenceStates(
      node.children,
      disabledByFieldset,
      firstLegendAvailable,
      state,
    );
  }

  if (node.type === 'JSXExpressionContainer') {
    return staticDisabledFieldsetExpressionStates(
      node.expression,
      disabledByFieldset,
      firstLegendAvailable,
      state,
    );
  }

  if (node.type === 'JSXElement' && isNativeElement(node.openingElement, 'legend')) {
    return uniqueFieldsetStates(
      staticUiPaths(node, firstLegendAvailable ? disabledByFieldset : true, state).map((path) => ({
        path,
        firstLegendAvailable: false,
      })),
    );
  }

  if (node.type === 'JSXElement' && isFragmentElement(node.openingElement)) {
    return staticDisabledFieldsetSequenceStates(
      node.children,
      disabledByFieldset,
      firstLegendAvailable,
      state,
    );
  }

  return uniqueFieldsetStates(
    staticUiPaths(node, true, state).map((path) => ({ path, firstLegendAvailable })),
  );
}

function staticDisabledFieldsetExpressionStates(
  input: Maybe<Node>,
  disabledByFieldset: boolean,
  firstLegendAvailable: boolean,
  state: UiPathState,
): FieldsetState[] {
  const expression = unwrapStaticExpression(input);
  if (expression === null || expression === undefined) {
    return [{ path: emptyUiPath(), firstLegendAvailable }];
  }

  const recurse = (next: Maybe<Node>): FieldsetState[] =>
    staticDisabledFieldsetExpressionStates(next, disabledByFieldset, firstLegendAvailable, state);

  if (expression.type === 'JSXElement' || expression.type === 'JSXFragment') {
    return staticDisabledFieldsetNodeStates(
      expression,
      disabledByFieldset,
      firstLegendAvailable,
      state,
    );
  }

  if (expression.type === 'ConditionalExpression') {
    const truthiness = staticExpressionTruthiness(expression.test);
    if (truthiness === true) return recurse(expression.consequent);
    if (truthiness === false) return recurse(expression.alternate);
    return uniqueFieldsetStates([
      ...withFieldsetCondition(
        recurse(expression.consequent),
        uiCondition(expression.test, 'truthy', true, state),
      ),
      ...withFieldsetCondition(
        recurse(expression.alternate),
        uiCondition(expression.test, 'truthy', false, state),
      ),
    ]);
  }

  if (expression.type === 'LogicalExpression') {
    if (expression.operator === '&&') {
      const truthiness = staticExpressionTruthiness(expression.left);
      if (truthiness === false) return [{ path: emptyUiPath(), firstLegendAvailable }];
      if (truthiness === true) return recurse(expression.right);
      return uniqueFieldsetStates([
        ...withFieldsetCondition(
          [{ path: emptyUiPath(), firstLegendAvailable }],
          uiCondition(expression.left, 'truthy', false, state),
        ),
        ...withFieldsetCondition(
          recurse(expression.right),
          uiCondition(expression.left, 'truthy', true, state),
        ),
      ]);
    }

    if (expression.operator === '||') {
      const truthiness = staticExpressionTruthiness(expression.left);
      if (truthiness === true) return recurse(expression.left);
      if (truthiness === false) return recurse(expression.right);
      return uniqueFieldsetStates([
        ...withFieldsetCondition(
          recurse(expression.left),
          uiCondition(expression.left, 'truthy', true, state),
        ),
        ...withFieldsetCondition(
          recurse(expression.right),
          uiCondition(expression.left, 'truthy', false, state),
        ),
      ]);
    }

    const nullish = staticExpressionNullish(expression.left);
    if (nullish === true) return recurse(expression.right);
    if (nullish === false) return recurse(expression.left);
    return uniqueFieldsetStates([
      ...withFieldsetCondition(
        recurse(expression.left),
        uiCondition(expression.left, 'nullish', false, state),
      ),
      ...withFieldsetCondition(
        recurse(expression.right),
        uiCondition(expression.left, 'nullish', true, state),
      ),
    ]);
  }

  if (expression.type === 'ArrayExpression') {
    return staticDisabledFieldsetSequenceStates(
      expression.elements,
      disabledByFieldset,
      firstLegendAvailable,
      state,
    );
  }

  return uniqueFieldsetStates(
    staticUiExpressionPaths(expression, true, state).map((path) => ({
      path,
      firstLegendAvailable,
    })),
  );
}

function finalizeStaticElementPaths(
  paths: readonly UiPath[],
  hasOwnAction: boolean,
  state: UiPathState,
  includeActionText = true,
): UiPath[] {
  return uniqueUiPaths(
    paths.map((path) => {
      const text = normalizeUiText(path.text);
      const countsAsActionText = text !== '' && includeActionText && !path.hasUnusableActionText;
      return {
        text,
        texts: text ? [...path.texts, text] : path.texts,
        actionTexts: countsAsActionText ? [...path.actionTexts, text] : path.actionTexts,
        hasUnusableActionText: path.hasUnusableActionText,
        hasActionWording:
          path.hasActionWording || (countsAsActionText && patternMatches(text, state.actionWords)),
        hasAction: path.hasAction || hasOwnAction,
        conditions: path.conditions,
      };
    }),
  );
}

function staticUiPaths(
  node: Maybe<Node>,
  disabledByFieldset: boolean,
  state: UiPathState,
): UiPath[] {
  if (node === null || node === undefined) return [emptyUiPath()];

  if (node.type === 'JSXText') return [textUiPath(node.value, state)];

  if (node.type === 'JSXExpressionContainer') {
    return staticUiExpressionPaths(node.expression, disabledByFieldset, state);
  }

  if (node.type === 'JSXFragment') {
    return combineUiPathGroups(
      node.children.map((child) => staticUiPaths(child, disabledByFieldset, state)),
    );
  }

  if (node.type !== 'JSXElement') return [emptyUiPath()];

  const opening = node.openingElement;
  if (isHidden(opening)) return [emptyUiPath()];

  const hasOwnAction =
    isPotentialActionElement(opening) && isUsableActionElement(opening, disabledByFieldset);
  if (hasOwnAction) return [{ ...emptyUiPath(), hasAction: true }];

  if (isNamedActionElement(opening)) {
    const childPaths = combineUiPathGroups(
      node.children.map((child) => staticUiPaths(child, disabledByFieldset, state)),
    );
    return finalizeStaticElementPaths(
      childPaths.map((path) => ({
        ...path,
        actionTexts: [],
        hasUnusableActionText: true,
        hasActionWording: false,
      })),
      false,
      state,
      false,
    );
  }

  const childPaths = isNativeDisabledFieldset(opening)
    ? staticDisabledFieldsetChildrenPaths(node.children, disabledByFieldset, state)
    : combineUiPathGroups(
        node.children.map((child) => staticUiPaths(child, disabledByFieldset, state)),
      );
  return finalizeStaticElementPaths(childPaths, false, state);
}

/** Enumerates the text and action outcomes a JSX subtree can statically render. */
export function getStaticUiPaths(
  node: Maybe<Node>,
  actionWords: readonly string[] = [],
): StaticUiPath[] {
  const state: UiPathState = { actionWords, conditionIds: new WeakMap(), nextConditionId: 0 };
  return staticUiPaths(node, false, state).map(({ texts, actionTexts, hasAction }) => ({
    texts,
    actionTexts,
    hasAction,
  }));
}
