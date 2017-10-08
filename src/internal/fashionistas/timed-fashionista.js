// @flow
/**
 * TimedFashionista: manages Fashions for timed animations.
 * @module fashionistas/timed-fashionista
 */

import chroma from 'chroma-js'

import { parseStyle, stringifyStyle } from './common-fashionista'

import type { BasicStyle, TransformStyle, Style, CSS } from '../flow-types'

export const calculateCurrentValue = (
  startValue: number,
  endValue: number,
  progress: number,
): number =>
  startValue + (endValue - startValue) * progress;

const calculateBasic = (startStyle: BasicStyle, endStyle: BasicStyle, progress: number): BasicStyle => (
  startStyle.isColorType && endStyle.isColorType ?
    {
      ...startStyle,
      value: chroma.mix(startStyle.value, endStyle.value, progress),
    }
  : startStyle.isNumberType && endStyle.isNumberType ?
    {
      ...startStyle,
      value: calculateCurrentValue(startStyle.value, endStyle.value, progress),
    }
  : startStyle.isUnitType && endStyle.isUnitType ?
    {
      ...startStyle,
      value: calculateCurrentValue(startStyle.value, endStyle.value, progress),
    }
  :
    endStyle
);

const calculateStyle = (startStyle: Style, endStyle: Style, progress: number): Style => (
  startStyle.isBasicType && endStyle.isBasicType ?
    calculateBasic(startStyle, endStyle, progress)
  : startStyle.isTransformType && endStyle.isTransformType ?
    {
      ...startStyle,
      styles: endStyle.styles.map(
        (end: BasicStyle, index: number): BasicStyle => {
          // Flow isn't playing nicely with disjoint types here. I'd expect it to know
          // that startStyle isTransformStyle, but flow isn't recognizing it as such.
          // There might be an issue with detecting disjoint types via multiple conditions.
          // $FlowFixMe
          const start: BasicStyle = startStyle.styles[index];
          return calculateBasic(start, end, progress);
        }),
    }
  :
    endStyle
);

export const constructStyles = (
  startStyles: CSS,
  endStyles: CSS,
  progress: number,
): CSS =>
  Object.keys(startStyles).reduce(
    (currentStyles: CSS, styleName: string) => {
      const startStyle: Style = parseStyle(startStyles[styleName]);
      const endStyle: Style = parseStyle(endStyles[styleName]);
      currentStyles[styleName] = stringifyStyle(
        calculateStyle(startStyle, endStyle, progress)
      );
      return currentStyles;
    },
    {}
  );
