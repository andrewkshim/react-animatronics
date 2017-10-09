// @flow
/**
 * SpringFashionista: manages Fashions for spring animations.
 *
 * @module internal/fashionistas/spring-fashionista
 */

import chroma from 'chroma-js'

import type { Styles, BasicFashion } from '../flow-types'
import Constants from '../constants'
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
  start: BasicFashion,
  end: BasicFashion,
  springValue: number,
): BasicFashion => (
  start.isColorType && end.isColorType ?
    { ...start, value: chroma.mix(start.value, end.value, springValue) }
  : start.isNumberType && end.isNumberType ?
    { ...start, value: interpolateValue(start.value, end.value, springValue) }
  : start.isUnitType && end.isUnitType ?
    { ...start, value: interpolateValue(start.value, end.value, springValue) }
  :
    end
);

export const reconstructStyles = (
  startStyles: Styles,
  endStyles: Styles,
  styleNames: string[],
  springValues: number[],
): Styles =>
  styleNames.reduce(
    (reconstructed, name, index) => {
      const start = parseStyle(startStyles[name]);
      const end = parseStyle(endStyles[name]);
      const value = springValues[index];
      reconstructed[name] = stringifyFashion(
        start.isBasicType && end.isBasicType ?
          interpolateFashion(start, end, value)
        : start.isTransformType && end.isTransformType ?
          {
            ...start,
            styles: start.styles.map(
              (s: BasicFashion, i: number) => interpolateFashion(s, end.styles[i], value)
            ),
          }
        :
          end
      );
      return reconstructed;
    },
    {}
  );
