// @flow
/**
 * TimedStylist: manages styles for timed animations.
 * @module stylist/timed-stylist
 */

import chroma from 'chroma-js'

import { parseStyle, stringifyStyle } from './common-stylist'

import type { BasicStyle, TransformStyle, Style, CSS } from '../flow-types'
import { calculateCurrentValue } from '../calculator'

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
          // $FlowFixMe: flow isn't playing nicely with disjoint types here
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
