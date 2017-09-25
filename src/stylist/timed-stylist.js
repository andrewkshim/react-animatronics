import chroma from 'chroma-js'

import {
  isColorType,
  isNumberType,
  isTransformType,
  parseStyle,
  stringifyStyle,
} from './common-stylist'

const calculateNextTimedStyle = (startStyle, endStyle, easingPosition) => (
  isColorType(startStyle) ?
    {
      ...startStyle,
      value: chroma.mix(
        startStyle.value,
        endStyle.value,
        easingPosition,
      ),
    }
  : isNumberType(startStyle) ?
    {
      ...startStyle,
      value: startStyle.value + (
        (endStyle.value - startStyle.value) * easingPosition
      ),
    }
  : isTransformType(startStyle) ?
    {
      ...startStyle,
      styles: startStyle.styles.map(
        (style, index) => ({
          ...style,
          value: style.value + (
            (endStyle.styles[index].value - style.value) * easingPosition
          ),
        })
      ),
    }
  :
    {
      ...startStyle,
      value: startStyle.value + (
        (endStyle.value - startStyle.value) * easingPosition
      ),
    }
);

export const updateTimedRigStyles = ({
  rigRef,
  startStyles,
  endStyles,
  easingFn,
  duration,
  elapsedTime,
}) => {
  const normalizedDuration = duration === 0 ? elapsedTime : duration;
  const easingPosition = easingFn(elapsedTime / normalizedDuration);
  Object.keys(startStyles).forEach(styleName => {
    const updatedStyle = stringifyStyle(
      calculateNextTimedStyle(
        parseStyle(startStyles[styleName]),
        parseStyle(endStyles[styleName]),
        easingPosition,
      )
    );
    rigRef.style[styleName] = updatedStyle;
  });
};
