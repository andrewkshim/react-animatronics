// @flow
/**
 * CommonFashionista: provides utilities to help manage Fashions
 * (which are * object-representations of CSS styles).
 *
 * @module internal/fashionistas/common
 */

import Debug from 'debug'
import chroma from 'chroma-js'

import type {
  ColorFashion,
  CompositeFashion,
  Fashion,
  NumberFashion,
  StaticFashion,
  UnitFashion,
} from '../flow-types'

import {
  makeError,
} from '../utils'

import {
  BOX_SHADOW,
  TRANSFORM,
} from '../constants'

const BETWEEN_PAREN_REGEX: RegExp = /\(([^)]+)\)/;
const ALL_COMMAS_REGEX: RegExp = /, /g;
const NUMBER_REGEX: RegExp = /(-)?\d+(\.\d+)?/;
const NON_NUMER_REGEX: RegExp = /\D+/;
const EMPTY_UNIT: string = '0px';

const debug = Debug('react-animatronics:fashionistas:common');

export const isColorString = (str: string): boolean => {
  let color;
  try {
    color = chroma(str);
  } catch (e) {
    color = false;
  }
  return !!color;
}

// replace decimals otherwise it'll get caught by the NON_NUMBER_REGEX
export const isNumberString = (str: string): boolean => (
  !isNaN(parseFloat(str))
  && !NON_NUMER_REGEX.test(str.replace('.', ''))
);

// FIXME: can have false positives
export const isUnitString = (str: string): boolean => (
  NUMBER_REGEX.test(str)
);

export const createColorFashion = (raw: string): ColorFashion => ({
  isBasicType: true,
  isColorType: true,
  value: chroma(raw).hex(),
});

export const createStaticFashion = (raw: string): StaticFashion => ({
  isBasicType: true,
  isStaticType: true,
  value: raw,
});

export const createNumberFashion = (raw: string|number): NumberFashion => ({
  isBasicType: true,
  isNumberType: true,
  value: parseFloat(raw),
});

// EXPERIMENT: Perhaps departing from implicit returns since they make
// debugging more difficult.
export const createUnitFashion = (raw: string): UnitFashion => {
  debug('creating unit fashion for "%s"', raw);
  return {
    isBasicType: true,
    isUnitType: true,
    value: parseFloat(NUMBER_REGEX.exec(raw)[0]),
    unit: raw.slice(NUMBER_REGEX.exec(raw)[0].length),
  }
};

const parseTransformName = (transform: string): string =>
  transform.slice(0, transform.indexOf('('));

const parseTransformStyle = (transform: string): Fashion =>
  parseStyle(BETWEEN_PAREN_REGEX.exec(transform)[1]);

const normalizeRawTransform = (raw: string): string[] => raw
  .replace(ALL_COMMAS_REGEX, ',')
  .split(' ');

export const createTransformFashion = (raw: string): CompositeFashion => ({
  isCompositeType: true,
  names: normalizeRawTransform(raw).map(parseTransformName),
  styles: normalizeRawTransform(raw).map(parseTransformStyle),
});

/**
 * @param raw - e.g. "6px 12px" (margin/padding shorthand)
 * @returns CompositeFashion
 */
export const createSpacingFashion = (raw: string, name: string): CompositeFashion => {
  const segments = raw.split(' ');
  const numSegments = segments.filter(s => !!s).length;
  if (numSegments < 1 || numSegments > 4) {
    throw makeError(
      `Received an invalid style for ${ name || "margin/padding" }: "${ raw }".`,
      `Margins/paddings should have between 1 to 4 values (no less than 1 and`,
      `no more than 4).`
    );
  }
  const parsed = segments.map(createUnitFashion);
  return {
    isCompositeType: true,
    styles: numSegments === 1 ?
      [parsed[0], parsed[0], parsed[0], parsed[0]]
    : numSegments === 2 ?
      [parsed[0], parsed[1], parsed[0], parsed[1]]
    : numSegments === 3 ?
      [parsed[0], parsed[1], parsed[2], parsed[1]]
    : // numSegments === 4
      [parsed[0], parsed[1], parsed[2], parsed[3]]
  };
};

export const createCommaFashion = (raw: string, name: ?string): CompositeFashion => ({
  isCompositeType: true,
  isCommaType: true,
  styles: raw.replace(ALL_COMMAS_REGEX, ',').split(',').map(style => parseStyle(style, name)),
});

export const createBoxShadowFashion = (raw: string): CompositeFashion => {
  const segments = raw.split(' ');
  const numSegments = segments.filter(s => !!s).length;
  if (numSegments < 3 || numSegments > 5) {
    throw makeError(
      `Received an invalid style for box-shadow: "${ raw }".`,
      `Box-shadows should have between 3 to 5 values:`,
      `https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow`
    );
  }

  // Possible formats:
    // offset-x | offset-y | color
    // offset-x | offset-y | blur-radius | color
    // offset-x | offset-y | blur-radius | spread-radius | color
    // inset | offset-x | offset-y | color
  // Target format:
    // offset-x | offset-y | blur-radius | spread-radius | color

  return {
    isCompositeType: true,
    styles: numSegments === 3 ?
      [
        createUnitFashion(segments[0]),
        createUnitFashion(segments[1]),
        createUnitFashion(EMPTY_UNIT),
        createUnitFashion(EMPTY_UNIT),
        createColorFashion(segments[2])
      ]
    : (numSegments === 4 && segments[0] === 'inset') ?
      [
        createStaticFashion(segments[0]),
        createUnitFashion(segments[1]),
        createUnitFashion(segments[2]),
        createColorFashion(segments[3])
      ]
    : (numSegments === 4) ?
      [
        createUnitFashion(segments[0]),
        createUnitFashion(segments[1]),
        createUnitFashion(segments[2]),
        createUnitFashion(EMPTY_UNIT),
        createColorFashion(segments[3])
      ]
    : // numSegments === 5
      [
        createUnitFashion(segments[0]),
        createUnitFashion(segments[1]),
        createUnitFashion(segments[2]),
        createUnitFashion(segments[3]),
        createColorFashion(segments[4])
      ]
  };
}

export const parseStyle = (raw: string|number, name: ?string): Fashion => {
  return typeof raw === 'number' ?
    createNumberFashion(raw)
  : isColorString(raw) ?
    createColorFashion(raw)
  : typeof raw === 'string' && name === TRANSFORM ?
    createTransformFashion(raw)
  : typeof raw === 'string' && raw.includes(',') ?
    createCommaFashion(raw, name)
  : name === BOX_SHADOW ?
    createBoxShadowFashion(raw)
  : typeof name === 'string' && (name.includes('margin') || name.includes('padding')) ?
    createSpacingFashion(raw, name)
  : isNumberString(raw) ?
    createNumberFashion(raw)
  : isUnitString(raw) ?
    createUnitFashion(raw)
  :
    createStaticFashion(raw)
};

export const stringifyColor = (color: ColorFashion) => `${ chroma(color.value).hex() }`;

export const stringifyNumber = (number: NumberFashion) => `${ number.value }`;

export const stringifyUnit = (style: UnitFashion) => `${ style.value }${ style.unit }`;

export const stringifyComposite = (composite: CompositeFashion) => composite.styles
  .reduce((arr: string[], style: Fashion, index: number) => {
    const name: ?string = composite.names && composite.names[index];
    return arr.concat(
      name
        ? `${ name }(${ stringifyFashion(style) })`
        : stringifyFashion(style)
    );
  }, [])
  .join(composite.isCommaType ? ', ' : ' ');

const stringifyBasic = (style: Fashion): string => (
  style.isColorType ?
    stringifyColor(style)
  : style.isNumberType ?
    stringifyNumber(style)
  : style.isUnitType ?
    stringifyUnit(style)
  :
    ''
);

export const stringifyFashion = (style: Fashion): string => (
  style.isCompositeType ?
    stringifyComposite(style)
  : // default: unknown style
    stringifyBasic(style)
);

export const haveConvertibleUnits = (rawA: string, rawB: string, styleName: string): boolean => {
  if (styleName === TRANSFORM) return true;
  const fashionA = parseStyle(rawA, styleName);
  const fashionB = parseStyle(rawB, styleName);
  return (!fashionA.unit || !fashionB.unit)
    ? false
    : fashionA.unit !== fashionB.unit;
};
