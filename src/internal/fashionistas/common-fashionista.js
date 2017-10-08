// @flow
/**
 * CommonFashionista: provides utilities to help manage Fashions
 * (which are * object-representations of CSS styles).
 *
 * @module fashionistas/common-fashionista
 */

import chroma from 'chroma-js'

import type {
  ColorFashion,
  NumberFashion,
  UnitFashion,
  BasicFashion,
  TransformFashion,
  Fashion,
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

export const createColorFashion = (raw: string): ColorFashion => ({
  isBasicType: true,
  isColorType: true,
  value: chroma(raw).hex(),
});

export const createNumberFashion = (raw: string | number): NumberFashion => ({
  isBasicType: true,
  isNumberType: true,
  value: parseFloat(raw),
});

export const createUnitFashion = (raw: string): UnitFashion => ({
  isBasicType: true,
  isUnitType: true,
  value: parseFloat(NUMBER_REGEX.exec(raw)[0]),
  unit: raw.slice(NUMBER_REGEX.exec(raw)[0].length),
});

const parseTransformName = (transform: string): string =>
  transform.slice(0, transform.indexOf('('));

const parseTransformStyle = (transform: string): BasicFashion =>
  parseBasicStyle(BETWEEN_PAREN_REGEX.exec(transform)[1]);

export const createTransformFashion = (raw: string): TransformFashion => ({
  isTransformType: true,
  names: raw.split(' ').map(parseTransformName),
  styles: raw.split(' ').map(parseTransformStyle),
});

export const parseBasicStyle = (raw: string | number): BasicFashion => (
  typeof raw === 'number' ?
    createNumberFashion(raw)
  : isNumberStr(raw) ?
    createNumberFashion(raw)
  : isColorString(raw) ?
    createColorFashion(raw)
  :
    createUnitFashion(raw)
);

export const parseStyle = (raw: string | number): Fashion => (
  typeof raw === 'string' && raw.indexOf('(') > -1 ?
    createTransformFashion(raw)
  :
    parseBasicStyle(raw)
);

export const stringifyColor = (color: ColorFashion) => `${ chroma(color.value).hex() }`;

export const stringifyNumber = (number: NumberFashion) => `${ number.value }`;

export const stringifyUnit = (style: UnitFashion) => `${ style.value }${ style.unit }`;

export const stringifyTransform = (transform: TransformFashion) => transform.names
  .reduce((arr: Array<string>, name: string, index: number) => {
    const style: BasicFashion = transform.styles[index];
    return arr.concat(`${ name }(${ stringifyFashion(style) })`);
  }, [])
  .join(' ');

const stringifyBasic = (style: BasicFashion): string => (
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
  style.isTransformType ?
    stringifyTransform(style)
  : // default: unknown style
    stringifyBasic(style)
);
