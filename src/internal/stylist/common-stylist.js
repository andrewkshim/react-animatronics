/**
 * CommonStylist: provides utilities to help manage styles for other Stylists.
 * @module stylist/common-stylist
 */

import chroma from 'chroma-js'

import { createPackageString } from '../utils'

const BETWEEN_PAREN_REGEX = /\(([^)]+)\)/;
const NUMBER_REGEX = /(-)?\d+(\.\d+)?/;
const NON_NUMER_REGEX = /\D+/;

export const COLOR_STYLE_TYPE = createPackageString('COLOR_STYLE_TYPE');
export const NUMBER_STYLE_TYPE = createPackageString('NUMBER_STYLE_TYPE');
export const TRANSFORM_STYLE_TYPE = createPackageString('TRANSFORM_STYLE_TYPE');
export const UNIT_STYLE_TYPE = createPackageString('UNIT_STYLE_TYPE');

export const isColorType = subject => subject.type === COLOR_STYLE_TYPE;

export const isNumberType = subject => subject.type === NUMBER_STYLE_TYPE;

export const isTransformType = subject => subject.type === TRANSFORM_STYLE_TYPE;

export const isUnitType = subject => subject.type === UNIT_STYLE_TYPE;

export const isColorString = str => {
  let color;
  try {
    color = chroma(str);
  } catch (e) {
    color = false;
  }
  return !!color;
}

const isNumber = possibleNum => (
  !isNaN(parseFloat(possibleNum))
  && !NON_NUMER_REGEX.test(possibleNum.toString())
);
const parseTransformName = transform => transform.slice(0, transform.indexOf('('))
const parseTransformStyle = transform => parseStyle(BETWEEN_PAREN_REGEX.exec(transform)[1]);

export const createColorStyle = style => ({
  type: COLOR_STYLE_TYPE,
  value: chroma(style).hex(),
});

export const createNumberStyle = style => ({
  type: NUMBER_STYLE_TYPE,
  value: parseFloat(style),
});

export const createTransformStyle = style => ({
  type: TRANSFORM_STYLE_TYPE,
  names: style.split(' ').map(parseTransformName),
  styles: style.split(' ').map(parseTransformStyle),
});

// TODO: clean up double-using exec
export const createUnitStyle = style => ({
  type: UNIT_STYLE_TYPE,
  value: parseFloat(NUMBER_REGEX.exec(style)[0]),
  unit: style.slice(NUMBER_REGEX.exec(style)[0].length),
});

// TODO: actually check for unit vs defaulting to it
export const parseStyle = style => (
  (isNumber(style)) ?
    createNumberStyle(style)
  : (style.indexOf('(') > -1) ?
    createTransformStyle(style)
  : (isColorString(style)) ?
    createColorStyle(style)
  :
    createUnitStyle(style)
);

export const stringifyColorStyle = ({ value }) => `${ chroma(value).hex() }`;

export const stringifyNumberStyle = ({ value }) => `${ value }`;

export const stringifyTransformStyle = ({ names, styles }) => names
  .reduce((styleStrBuilder, name, index) => {
    const { value, unit } = styles[index];
    return styleStrBuilder.concat(`${ name }(${ value }${ unit ? unit : '' })`);
  }, [])
  .join(' ');

export const stringifyUnitStyle = ({ value, unit }) => `${ value }${ unit }`;

// TODO: don't default to unit style, throw instead?
export const stringifyStyle = style => (
  isColorType(style) ?
    stringifyColorStyle(style)
  : isNumberType(style) ?
    stringifyNumberStyle(style)
  : isTransformType(style) ?
    stringifyTransformStyle(style)
  :
    stringifyUnitStyle(style)
);
