// @flow
/**
 * SpringFashionista: manages Fashions for spring animations.
 *
 * @module internal/fashionistas/spring
 */

import type { Styles, Fashion, CompositeFashion } from '../flow-types'

import chroma from 'chroma-js'

import {
  parseStyle,
  stringifyFashion,
  pluckTransforms,
} from './common'

import {
  TRANSFORM,
} from '../constants'

export const interpolateValue = (
  currentValue: number,
  endValue: number,
  progress: number,
): number => {
  const delta: number = endValue - currentValue;
  return currentValue + (delta * progress);
}

export const interpolateFashion = (
  from: Fashion,
  to: Fashion,
  springValue: number
): Fashion => {
  return from.isColorType && to.isColorType ?
    { ...from, value: chroma.mix(from.value, to.value, springValue) }
  : from.isNumberType && to.isNumberType ?
    { ...from, value: interpolateValue(from.value, to.value, springValue) }
  : from.isUnitType && to.isUnitType ?
    { ...from, value: interpolateValue(from.value, to.value, springValue) }
  :
    to
};

const interpolateCompositeFashion = (
  from: CompositeFashion,
  to: CompositeFashion,
  springValue: number
): Fashion => {
  return {
    ...from,
    styles: from.styles.map(
      (f: Fashion, i: number) => {
        const t: Fashion = to.styles[i];
        return (f.isCompositeType && t.isCompositeType) ? (
          interpolateCompositeFashion(f, t, springValue)
        ) : (
          interpolateFashion(f, t, springValue)
        );
      }
    ),
  };
}

export const constructStyles = (
  fromStyles: Styles,
  toStyles: Styles,
  styleNames: string[],
  springValues: number[],
  transformations: string[],
): Styles => {
  return styleNames.reduce(
    (constructed, styleName, index) => {
      const rawFrom = fromStyles[styleName];
      const rawTo = toStyles[styleName];

      const from = styleName !== TRANSFORM
        ? rawFrom
        // $FlowFixMe: need to tell flow that "rawFrom" will always be an Object at this point
        : pluckTransforms(rawFrom, transformations);

      const to = styleName !== TRANSFORM
        ? rawTo
        // $FlowFixMe: need to tell flow that "rawTo" will always be an Object at this point
        : pluckTransforms(rawTo, transformations);

      const fromFashion: Fashion = parseStyle(from, styleName);
      const toFashion: Fashion = parseStyle(to, styleName);
      const value = springValues[index];

      constructed[styleName] = stringifyFashion(
        fromFashion.isBasicType && toFashion.isBasicType ?
          interpolateFashion(fromFashion, toFashion, value)
        : fromFashion.isCompositeType && toFashion.isCompositeType ?
          interpolateCompositeFashion(fromFashion, toFashion, value)
        :
          toFashion
      );
      return constructed;
    },
    {}
  );
};
