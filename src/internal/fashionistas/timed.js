// @flow
/**
 * TimedFashionista: manages Fashions for timed animations.
 *
 * @module internal/fashionistas/timed
 */

import chroma from 'chroma-js'

import { parseStyle, stringifyFashion } from './common'

import type { TransformFashion, Fashion, Styles } from '../flow-types'

export const calculateCurrentValue = (
  startValue: number,
  endValue: number,
  progress: number,
): number =>
  startValue + (endValue - startValue) * progress;

const calculateBasic = (startFashion: Fashion, endFashion: Fashion, progress: number): Fashion => (
  startFashion.isColorType && endFashion.isColorType ?
    {
      ...startFashion,
      value: chroma.mix(startFashion.value, endFashion.value, progress),
    }
  : startFashion.isNumberType && endFashion.isNumberType ?
    {
      ...startFashion,
      value: calculateCurrentValue(startFashion.value, endFashion.value, progress),
    }
  : startFashion.isUnitType && endFashion.isUnitType ?
    {
      ...startFashion,
      value: calculateCurrentValue(startFashion.value, endFashion.value, progress),
    }
  :
    endFashion
);

const calculateFashion = (startFashion: Fashion, endFashion: Fashion, progress: number): Fashion => (
  startFashion.isBasicType && endFashion.isBasicType ?
    calculateBasic(startFashion, endFashion, progress)
  : startFashion.isTransformType && endFashion.isTransformType ?
    {
      ...startFashion,
      styles: endFashion.styles.map(
        (to: Fashion, index: number): Fashion => {
          // Flow isn't playing nicely with disjoint types here. I'd expect it to know
          // that startFashion isTransformType, but flow isn't recognizing it as such.
          // There might be an issue with detecting disjoint types via multiple conditions.
          // $FlowFixMe
          const from: Fashion = startFashion.styles[index];
          return calculateBasic(from, to, progress);
        }),
    }
  :
    endFashion
);

export const constructStyles = (
  fromStyles: Styles,
  toStyles: Styles,
  progress: number,
): Styles =>
  Object.keys(fromStyles).reduce(
    (currentStyles: Styles, styleName: string) => {
      const startFashion: Fashion = parseStyle(fromStyles[styleName], styleName);
      const endFashion: Fashion = parseStyle(toStyles[styleName], styleName);
      currentStyles[styleName] = stringifyFashion(
        calculateFashion(startFashion, endFashion, progress)
      );
      return currentStyles;
    },
    {}
  );
