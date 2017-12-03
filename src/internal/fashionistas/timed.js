// @flow
/**
 * TimedFashionista: manages Fashions for timed animations.
 *
 * @module internal/fashionistas/timed
 */

import type { Fashion, Styles } from '../flow-types'

import chroma from 'chroma-js'

import {
  parseStyle,
  stringifyFashion,
  pluckTransforms,
} from './common'

import { TRANSFORM } from '../constants'

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
  : startFashion.isCompositeType && endFashion.isCompositeType ?
    {
      ...startFashion,
      styles: endFashion.styles.map(
        (to: Fashion, index: number): Fashion => {
          // Flow isn't playing nicely with disjoint types here. I'd expect it to know
          // that startFashion isCompositeType, but flow isn't recognizing it as such.
          // There might be an issue with detecting disjoint types via multiple conditions.
          // $FlowFixMe
          const from: Fashion = startFashion.styles[index];
          return calculateFashion(from, to, progress);
        }
      )
    }
  :
    endFashion
);

export const constructStyles = (
  fromStyles: Styles,
  toStyles: Styles,
  progress: number,
  transformations: string[] = [],
): Styles =>
  Object.keys(fromStyles).reduce(
    (currentStyles: Styles, styleName: string) => {
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

      const startFashion: Fashion = parseStyle(from, styleName);
      const endFashion: Fashion = parseStyle(to, styleName);

      currentStyles[styleName] = stringifyFashion(
        calculateFashion(startFashion, endFashion, progress)
      );
      return currentStyles;
    },
    {}
  );
