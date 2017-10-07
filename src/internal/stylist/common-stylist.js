// @flow
/**
 * CommonStylist: provides utilities to help manage styles for other Stylists.
 * @module stylist/common-stylist
 */

import chroma from 'chroma-js'

import type {
  ColorStyle,
  NumberStyle,
  UnitStyle,
  BasicStyle,
  TransformStyle,
  Style,
} from '../flow-types'

import { createPackageString } from '../utils'

const BETWEEN_PAREN_REGEX: RegExp = /\(([^)]+)\)/;
const NUMBER_REGEX: RegExp = /(-)?\d+(\.\d+)?/;
const NON_NUMER_REGEX: RegExp = /\D+/;

export const isColorType = (subject: Object): boolean =>
  subject.ColorType;

export const isNumberType = (subject: Object): boolean =>
  subject.NumberType;

export const isTransformType = (subject: Object): boolean =>
  subject.TransformType;

export const isUnitType = (subject: Object): boolean =>
  subject.UnitType;

export const isColorString = (str: string): boolean => {
  let color;
  try {
    color = chroma(str);
  } catch (e) {
    color = false;
  }
  return !!color;
}

const isNumberStr = (str: string): boolean => (
  !isNaN(parseFloat(str))
  && !NON_NUMER_REGEX.test(str)
);

export const createColorStyle = (raw: string): ColorStyle => ({
  ColorType: true,
  value: chroma(raw).hex(),
});

export const createNumberStyle = (raw: string | number): NumberStyle => ({
  NumberType: true,
  value: parseFloat(raw),
});

const parseTransformName = (transform: string): string =>
  transform.slice(0, transform.indexOf('('));

const parseTransformStyle = (transform: string): BasicStyle =>
  parseBasicStyle(BETWEEN_PAREN_REGEX.exec(transform)[1]);

export const createUnitStyle = (raw: string): UnitStyle => ({
  UnitType: true,
  value: parseFloat(NUMBER_REGEX.exec(raw)[0]),
  unit: raw.slice(NUMBER_REGEX.exec(raw)[0].length),
});

export const createTransformStyle = (raw: string): TransformStyle => ({
  TransformType: true,
  names: raw.split(' ').map(parseTransformName),
  styles: raw.split(' ').map(parseTransformStyle),
});

const parseBasicStyle = (raw: string | number): BasicStyle => (
  typeof raw === 'number' ?
    createNumberStyle(raw)
  : isNumberStr(raw) ?
    createNumberStyle(raw)
  : isColorString(raw) ?
    createColorStyle(raw)
  :
    createUnitStyle(raw)
);

// TODO: actually check for unit vs defaulting to it
export const parseStyle = (raw: string | number): Style => (
  typeof raw === 'string' && raw.indexOf('(') > -1 ?
    createTransformStyle(raw)
  :
    parseBasicStyle(raw)
);

export const stringifyColor = (color: ColorStyle) => `${ chroma(color.value).hex() }`;

export const stringifyNumber = (number: NumberStyle) => `${ number.value }`;

export const stringifyUnit = (style: UnitStyle) => `${ style.value }${ style.unit }`;

export const stringifyTransform = (transform: TransformStyle) => transform.names
  .reduce((arr: Array<string>, name: string, index: number) => {
    const style: BasicStyle = transform.styles[index];
    return arr.concat(`${ name }(${ stringifyStyle(style) })`);
  }, [])
  .join(' ');

const stringifyBasic = (style: BasicStyle): string => (
  style.ColorType ?
    stringifyColor(style)
  : style.NumberType ?
    stringifyNumber(style)
  : style.UnitType ?
    stringifyUnit(style)
  :
    ''
);

export const stringifyStyle = (style: Style): string => (
  style.TransformType ?
    stringifyTransform(style)
  : // default: unknown style
    stringifyBasic(style)
);
