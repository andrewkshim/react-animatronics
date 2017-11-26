// @flow
/**
 * SpringFashionista: manages Fashions for spring animations.
 *
 * @module internal/fashionistas/spring
 */

import chroma from 'chroma-js'

import type { Styles, Fashion } from '../flow-types'
import { parseStyle, stringifyFashion } from './common'

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
  springValue: number,
): Fashion => (
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
    (reconstructed, styleName, index) => {
      const from = parseStyle(fromStyles[styleName], styleName);
      const to = parseStyle(toStyles[styleName], styleName);
      const value = springValues[index];
      reconstructed[styleName] = stringifyFashion(
        from.isBasicType && to.isBasicType ?
          interpolateFashion(from, to, value)
        : from.isTransformType && to.isTransformType ?
          {
            ...from,
            styles: from.styles.map(
              (s: Fashion, i: number) => interpolateFashion(s, to.styles[i], value)
            ),
          }
        :
          to
      );
      return reconstructed;
    },
    {}
  );
