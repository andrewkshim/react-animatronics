// @flow
/**
 * CommonStylist: provides utilities to help manage styles for other Stylists.
 * @module stylists/common-stylist
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
  isBasicType: true,
  isColorType: true,
  value: chroma(raw).hex(),
});

export const createNumberStyle = (raw: string | number): NumberStyle => ({
  isBasicType: true,
  isNumberType: true,
  value: parseFloat(raw),
});

export const createUnitStyle = (raw: string): UnitStyle => ({
  isBasicType: true,
  isUnitType: true,
  value: parseFloat(NUMBER_REGEX.exec(raw)[0]),
  unit: raw.slice(NUMBER_REGEX.exec(raw)[0].length),
});

const parseTransformName = (transform: string): string =>
  transform.slice(0, transform.indexOf('('));

const parseTransformStyle = (transform: string): BasicStyle =>
  parseBasicStyle(BETWEEN_PAREN_REGEX.exec(transform)[1]);

export const createTransformStyle = (raw: string): TransformStyle => ({
  isTransformType: true,
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
  style.isColorType ?
    stringifyColor(style)
  : style.isNumberType ?
    stringifyNumber(style)
  : style.isUnitType ?
    stringifyUnit(style)
  :
    ''
);

export const stringifyStyle = (style: Style): string => (
  style.isTransformType ?
    stringifyTransform(style)
  : // default: unknown style
    stringifyBasic(style)
);
