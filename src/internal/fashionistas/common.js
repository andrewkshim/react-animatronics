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
  CalcFashion,
  ColorFashion,
  CompositeFashion,
  Fashion,
  NumberFashion,
  StaticFashion,
  UnitFashion,
} from '../flow-types'

import {
  ALL_COMMAS_REGEX,
  NUMBER_REGEX,
  NON_NUMER_REGEX,
  makeError,
} from '../utils'

import {
  BOX_SHADOW,
  TRANSFORM,
  TRANSFORM_DELIMITER,
} from '../constants'

const EMPTY_UNIT: string = '0px';

const debug = Debug('react-animatronics:fashionistas:common');

const isCommaString = (str: string): boolean => {
  return (
    typeof str === 'string'
    && str.includes(',')
    && !str.includes('rgb')
    && !str.includes('hsl')
  );
}

export const isColorString = (str: string): boolean => {
  let color;
  try {
    color = chroma(str);
  } catch (e) {
    color = false;
  }
  return !!color;
}

// NOTE: replace decimals and negative signs otherwise it'll get caught by the
// NON_NUMBER_REGEX
// TODO: why is the NON_NUMBER_REGEX check in here?
export const isNumberString = (str: string): boolean => (
  !isNaN(parseFloat(str))
  && !NON_NUMER_REGEX.test(str.replace('.', '').replace('-', ''))
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
  };
};

export const createCalcFashion = (raw: string): CalcFashion => {
  debug('creating calc fashion fro "%s"', raw);
  return {
    isBasicType: true,
    isCalcType: true,
    value: raw,
  };
};

export const parseTransformName = (transform: string): string => {
  return transform.slice(0, transform.indexOf('('));
};

// TODO: Better function names

const removeLastChar = (str: string) => {
  return str.substr(0, str.length - 1);
};

const butLast = (array: any[]) => {
  return array.slice(0, array.length - 1);
}

const last = (array: any[]) => {
  return array[array.length - 1];
}

// FIXME: Lots of imperative code here, there must be a better way.  To goal is
// to correctly split any valid CSS transforms, which can have nested parens
// e.g. "translateX(100px) translateY(calc((100% - 40px) * -1))"
export const splitTransforms = (transforms: string) => {
  let openParenCount = 0;
  const startingCharIndexes = [];
  const chars = transforms.split('');
  const splits = [];
  for (let i = 0; i < chars.length; ++i) {
    const c = chars[i];
    if (c === ' ') {
      continue;
    } else if (startingCharIndexes.length === 0) {
      startingCharIndexes.push(i);
    } else if (c === '(') {
      openParenCount += 1;
    } else if (c === ')') {
      if (openParenCount === 1) {
        splits.push(
          chars
            .slice(startingCharIndexes.pop(), i + 1)
            .join('')
        );
        openParenCount -= 1;
      } else if (openParenCount > 1) {
        openParenCount -= 1;
      }
    }
  }
  return splits;
}

/**
 * @param string value e.g. "translateX(100x)", "translateY(calc(100% - 40px))"
 * @returns string e.g. "100px", "calc(100% - 40px)"
 */
export const parseInnerTransformValue = (value: string): string => {
  const [_, ...inner] = value.split('(');
  return butLast(inner)
    .concat(removeLastChar(last(inner)))
    .join('(');
}

const parseTransformStyle = (transform: string): Fashion => {
  return parseStyle(parseInnerTransformValue(transform));
}

export const createTransformFashion = (raw: string): CompositeFashion => ({
  isCompositeType: true,
  names: splitTransforms(raw).map(parseTransformName),
  styles: splitTransforms(raw).map(parseTransformStyle),
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
  styles: raw
    .split(',')
    .map(s => s.trim())
    .map(style => parseStyle(style, name)),
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
  : isNumberString(raw) ?
    createNumberFashion(raw)
  : typeof raw === 'string' && name === TRANSFORM ?
    createTransformFashion(raw)
  : typeof raw === 'string' && (raw.includes('calc') || raw.includes('matrix')) ?
    createCalcFashion(raw)
  : typeof name === 'string' && (name.includes('margin') || name.includes('padding')) ?
    createSpacingFashion(raw, name)
  : isCommaString(raw) ?
    createCommaFashion(raw, name)
  : name === BOX_SHADOW ?
    createBoxShadowFashion(raw)
  : isColorString(raw) ?
    createColorFashion(raw)
  : isUnitString(raw) ?
    createUnitFashion(raw)
  :
    createStaticFashion(raw)
};

export const stringifyCalc = (calc: CalcFashion) => calc.value;

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

const stringifyBasic = (fashion: Fashion): string => {
  debug('stringifying basic fashion %o', fashion);
  return fashion.isColorType ?
    stringifyColor(fashion)
  : fashion.isNumberType ?
    stringifyNumber(fashion)
  : fashion.isUnitType ?
    stringifyUnit(fashion)
  : fashion.isCalcType ?
    stringifyCalc(fashion)
  :
    ''
};

export const stringifyFashion = (style: Fashion): string => (
  style.isCompositeType ?
    stringifyComposite(style)
  : // default: unknown style
    stringifyBasic(style)
);

// IMPROVE: By default, all "transforms" will be converted, even if they have
// the same units. We can be more efficient about this, but it's unclear if
// that's worth it right now.
export const haveConvertibleUnits = (
  rawA: string,
  rawB: string,
  styleName: string
): boolean => {
  if (styleName === TRANSFORM) return true;
  const fashionA = parseStyle(rawA, styleName);
  const fashionB = parseStyle(rawB, styleName);
  return (fashionA.isCalcType || fashionB.isCalcType) ?
    true
  : (fashionA.unit && fashionB.unit) ?
    fashionA.unit !== fashionB.unit
  :
    false
};

const lastChar = (s: string) => s[s.length - 1];

export const separateTransformNames = (transform: string) => {
  const separated = splitTransforms(transform)
    .map(parseTransformName);
  return separated;
}

export const parseTransformsSeparately = (transforms: string) => {
  return splitTransforms(transforms)
    .sort()
    .reduce((result, transform) => {
      const name = parseTransformName(transform);
      result[name] = transform;
      return result;
    }, {})
};

export const pluckTransforms = (
  styles: Object,
  transformations: string[]
) => {
  return Object.keys(styles)
    .map(transformName => {
      return transformations.includes(transformName) ? styles[transformName] : '';
    })
    .filter(t => !!t)
    .join(' ');
}
