// @flow
/**
 * SpringFashionista: manages Fashions for spring animations.
 *
 * @module internal/fashionistas/spring-fashionista
 */

import chroma from 'chroma-js'

import type { Styles, BasicFashion } from '../flow-types'
import { parseStyle, stringifyFashion } from './common-fashionista'

export const interpolateValue = (
  currentValue: number,
  endValue: number,
  progress: number,
): number => {
  const delta: number = endValue - currentValue;
  return currentValue + (delta * progress);
}

export const interpolateFashion = (
  from: BasicFashion,
  to: BasicFashion,
  springValue: number,
): BasicFashion => (
  from.isColorType && to.isColorType ?
    { ...from, value: chroma.mix(from.value, to.value, springValue) }
  : from.isNumberType && to.isNumberType ?
    { ...from, value: interpolateValue(from.value, to.value, springValue) }
  : from.isUnitType && to.isUnitType ?
    { ...from, value: interpolateValue(from.value, to.value, springValue) }
  :
    to
);

export const reconstructStyles = (
  fromStyles: Styles,
  toStyles: Styles,
  styleNames: string[],
  springValues: number[],
): Styles =>
  styleNames.reduce(
    (reconstructed, name, index) => {
      const from = parseStyle(fromStyles[name]);
      const to = parseStyle(toStyles[name]);
      const value = springValues[index];
      reconstructed[name] = stringifyFashion(
        from.isBasicType && to.isBasicType ?
          interpolateFashion(from, to, value)
        : from.isTransformType && to.isTransformType ?
          {
            ...from,
            styles: from.styles.map(
              (s: BasicFashion, i: number) => interpolateFashion(s, to.styles[i], value)
            ),
          }
        :
          to
      );
      return reconstructed;
    },
    {}
  );
