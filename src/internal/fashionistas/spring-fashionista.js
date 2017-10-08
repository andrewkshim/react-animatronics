/**
 * SpringFashionista: manages Fashions for spring animations.
 *
 * @module fashionistas/spring-fashionista
 */

import chroma from 'chroma-js'

import Constants from '../constants'

import { parseStyle, stringifyStyle } from './common-fashionista'

export const interpolateValue = (currentValue: number, endValue: number, progress: number): number => {
  const delta = endValue - currentValue;
  return currentValue + (delta * progress);
}

export const reconstructCSS = (startStyles, endStyles, styleNames, springValues) =>
  styleNames.reduce(
    (reconstructed, name, index) => {
      const start = parseStyle(startStyles[name]);
      const end = parseStyle(endStyles[name]);
      const value = springValues[index];
      reconstructed[name] = stringifyStyle(
        start.isBasicType && end.isBasicType ?
          interpolateStyle(start, end, value)
        : start.isTransformType && end.isTransformType ?
          {
            ...start,
            styles: start.styles.map(
              (s, i) => interpolateStyle(s, end.styles[i], value)
            ),
          }
        :
          end
      );
      return reconstructed;
    },
    {}
  );

export const interpolateStyle = (start, end, springValue) =>
  start.isColorType ?
    { ...start, value: chroma.mix(start.value, end.value, springValue) }
  : start.isNumberType ?
    { ...start, value: interpolateValue(start.value, end.value, springValue) }
  : start.isUnitType ?
    { ...start, value: interpolateValue(start.value, end.value, springValue) }
  :
    end;
