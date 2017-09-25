/**
 * Stylist: takes care of anything having to do with CSS styles.
 * @module stylist
 */

import chroma from 'chroma-js'

import {
  MS_PER_ANIMATION_FRAME,
  SECONDS_PER_ANIMATION_FRAME,
} from './constants'

import { createModuleString } from './utils'

const BETWEEN_PAREN_REGEX = /\(([^)]+)\)/;
const NUMBER_REGEX = /(-)?\d+(\.\d+)?/;
const NON_NUMER_REGEX = /\D+/;

export const COLOR_STYLE_TYPE = createModuleString('COLOR_STYLE_TYPE');
export const NUMBER_STYLE_TYPE = createModuleString('NUMBER_STYLE_TYPE');
export const TRANSFORM_STYLE_TYPE = createModuleString('TRANSFORM_STYLE_TYPE');
export const UNIT_STYLE_TYPE = createModuleString('UNIT_STYLE_TYPE');

const isColorType = subject => subject.type === COLOR_STYLE_TYPE;

const isNumberType = subject => subject.type === NUMBER_STYLE_TYPE;

const isTransformType = subject => subject.type === TRANSFORM_STYLE_TYPE;

const isUnitType = subject => subject.type === UNIT_STYLE_TYPE;

export const isColorString = str => {
  let color;
  try {
    color = chroma(str);
  } catch (e) {
    color = false;
  }
  return !!color;
}

const isNumber = possibleNum => (
  !isNaN(parseFloat(possibleNum))
  && !NON_NUMER_REGEX.test(possibleNum.toString())
);
const parseTransformName = transform => transform.slice(0, transform.indexOf('('))
const parseTransformStyle = transform => parseStyle(BETWEEN_PAREN_REGEX.exec(transform)[1]);

export const createColorStyle = style => ({
  type: COLOR_STYLE_TYPE,
  value: chroma(style).hex(),
});

export const createNumberStyle = style => ({
  type: NUMBER_STYLE_TYPE,
  value: parseFloat(style),
});

export const createTransformStyle = style => ({
  type: TRANSFORM_STYLE_TYPE,
  names: style.split(' ').map(parseTransformName),
  styles: style.split(' ').map(parseTransformStyle),
});

// TODO: clean up double-using exec
export const createUnitStyle = style => ({
  type: UNIT_STYLE_TYPE,
  value: parseFloat(NUMBER_REGEX.exec(style)[0]),
  unit: style.slice(NUMBER_REGEX.exec(style)[0].length),
});

// TODO: use styleName?
// TODO: actually check for unit vs defaulting to it
export const parseStyle = style => (
  (isNumber(style)) ?
    createNumberStyle(style)
  : (style.indexOf('(') > -1) ?
    createTransformStyle(style)
  : (isColorString(style)) ?
    createColorStyle(style)
  :
    createUnitStyle(style)
);

export const stringifyColorStyle = ({ value }) => `${ chroma(value).hex() }`;

export const stringifyNumberStyle = ({ value }) => `${ value }`;

export const stringifyTransformStyle = ({ names, styles }) => names
  .reduce((styleStrBuilder, name, index) => {
    const { value, unit } = styles[index];
    return styleStrBuilder.concat(`${ name }(${ value }${ unit ? unit : '' })`);
  }, [])
  .join(' ');

export const stringifyUnitStyle = ({ value, unit }) => `${ value }${ unit }`;

// TODO: don't default to unit style, throw instead?
export const stringifyStyle = style => (
  isColorType(style) ?
    stringifyColorStyle(style)
  : isNumberType(style) ?
    stringifyNumberStyle(style)
  : isTransformType(style) ?
    stringifyTransformStyle(style)
  :
    stringifyUnitStyle(style)
);

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

const createSpringState = ({ styleName, startStyle, endStyle }) => isTransformType(startStyle)
  ? {
    styleName,
    type: startStyle.type,
    names: startStyle.names,
    endStyles: endStyle.styles,
    currentStyles: startStyle.styles,
    currentVelocities: Object.keys(startStyle.styles).map(() => 0),
    actualStyles: startStyle.styles,
    actualVelocities: Object.keys(startStyle.styles).map(() => 0),
  } : {
    styleName,
    type: startStyle.type,
    endStyles: [endStyle],
    currentStyles: [startStyle],
    currentVelocities: [0],
    actualStyles: [startStyle],
    actualVelocities: [0],
  }
;

const calculateUpdatedSpringValue = (currentValue, updatedValue, percentageFrameCompleted) => {
  const completeDelta = updatedValue - currentValue;
  const currentDelta = completeDelta * percentageFrameCompleted;
  return currentValue + currentDelta;
}

const NON_NUMERIC_SPRING_STYLE_NAME = createModuleString('NON_NUMERIC_SPRING_STYLE');

const NON_NUMERIC_SPRING_STATE = createSpringState({
  styleName: NON_NUMERIC_SPRING_STYLE_NAME,
  startStyle: createNumberStyle(0),
  endStyle: createNumberStyle(1),
});

const calculateUpdatedVelocities = ({ currentStyles, endStyles, currentVelocities, stiffness, damping }) => {
  return currentVelocities.map((velocity, index) => {
    const currentValue = currentStyles[index].value;
    const endValue = endStyles[index].value;
    const spring = -stiffness * (currentValue - endValue);
    const damper = -damping * velocity;
    const acceleration = spring + damper;
    return velocity + (acceleration * SECONDS_PER_ANIMATION_FRAME);
  });
}

const calculateNextSpringState = ({ springState, stiffness, damping }) => {
  const { endStyles, currentVelocities } = springState;
  const { currentStyles } = isColorType(springState) ? NON_NUMERIC_SPRING_STATE : springState;
  const updatedVelocities = calculateUpdatedVelocities({
    currentStyles,
    endStyles,
    currentVelocities,
    stiffness,
    damping,
  });
  const updatedStyles = currentStyles.map((currentStyle, index) => {
    const endStyle = endStyles[index];
    const updatedVelocity = updatedVelocities[index];
    const updatedValue = currentStyle.value + (updatedVelocity * SECONDS_PER_ANIMATION_FRAME);
    return (
      isColorType(currentStyle) ?
        {
          ...currentStyle,
          value: chroma.mix(
            currentStyle.value,
            endStyle.value,
            value: updatedValue,
          ),
        }
      : isNumberType(currentStyle) ?
        {
          ...currentStyle,
          value: updatedValue,
        }
      : isTransformType(currentStyle) ?
        {
          ...currentStyle,
          value: updatedValue,
        }
      :
        {
          ...currentStyle,
          value: updatedValue,
        }
    );
  });
  return {
    ...springState,
    currentVelocities: updatedVelocities,
    currentStyles: updatedStyles,
  };
}

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

const isSpringAnimationDone = springStates => {
  return Object.keys(springStates)
    .reduce((velocities, styleName) => {
      const { actualVelocities } = springStates[styleName];
      return velocities.concat(actualVelocities);
    }, [])
    .every(v => Math.abs(v) < 0.01)
  ;
};

export const areAllSpringAnimationsDone = springStatesForRigs => {
  return Object.keys(springStatesForRigs)
    .reduce((result, rigName) => {
      const springStates = springStatesForRigs[rigName];
      return result.concat(isSpringAnimationDone(springStates));
    }, [])
    .every(isDone => isDone)
  ;
};

export const createFnUpdateSpringRigStyles = ({
  allStartStyles,
  allEndStyles,
  stiffness,
  damping,
}) => {

  const springStatesForRigs = Object.keys(allStartStyles).reduce((result, rigName) => {

    result[rigName] = Object.keys(allStartStyles[rigName]).reduce((states, styleName) => {

      states[styleName] = createSpringState({
        styleName,
        startStyle: parseStyle(allStartStyles[rigName][styleName]),
        endStyle: parseStyle(allEndStyles[rigName][styleName]),
      });

      return states;
    }, {});

    return result;
  }, {});

  let prevTime = Date.now();
  let isFirstIteration = true;
  let accumulatedTime = 0;

  const updateSpringRigStyles = ({ rigRef, rigName, styleNames }) => {

    const isDone = (
      !isFirstIteration
      && isSpringAnimationDone(springStatesForRigs[rigName])
    );

    if (isDone) {

      styleNames.forEach(styleName => {
        rigRef.style[styleName] = allEndStyles[rigName][styleName];
      });

    } else {

      const currentTime = Date.now();
      const elapsedTime = currentTime - prevTime;
      prevTime = currentTime;
      accumulatedTime += elapsedTime;

      const numFramesRemaining = Math.floor(accumulatedTime / MS_PER_ANIMATION_FRAME);
      const remainingTime = numFramesRemaining * MS_PER_ANIMATION_FRAME;
      const percentageFrameCompleted = (accumulatedTime - remainingTime) / MS_PER_ANIMATION_FRAME;

      styleNames.forEach(styleName => {
        for (let i = 0; i < numFramesRemaining; i++) {
          const currentSpringState = springStatesForRigs[rigName][styleName];
          springStatesForRigs[rigName][styleName] = calculateNextSpringState({
            stiffness,
            damping,
            springState: currentSpringState,
          });
        }

        const currentSpringState = springStatesForRigs[rigName][styleName];

        const updatedSpringState = calculateNextSpringState({
          stiffness,
          damping,
          springState: currentSpringState,
        });
        const actualSpringState = {
          ...currentSpringState,
          actualStyles: currentSpringState.currentStyles.map((updatedStyle, index) => {
            return {
              ...updatedStyle,
              value: calculateUpdatedSpringValue(
                currentSpringState.currentStyles[index],
                updatedStyle,
                percentageFrameCompleted,
              )
            };
          }),
          actualVelocities: updatedSpringState.currentVelocities.map((updatedVelocity, index) => {
            return calculateUpdatedSpringValue(
              currentSpringState.currentVelocities[index],
              updatedVelocity,
              percentageFrameCompleted,
            );
          })
        };
        springStatesForRigs[rigName][styleName] = actualSpringState;

        const updatedStyle = stringifyStyle(
          isTransformType(actualSpringState)
            ? {
                type: TRANSFORM_STYLE_TYPE,
                names: actualSpringState.names,
                styles: actualSpringState.actualStyles,
              }
            :
              actualSpringState.currentStyles[0],
        );

        rigRef.style[styleName] = updatedStyle;
      });

      accumulatedTime -= (numFramesRemaining * MS_PER_ANIMATION_FRAME);
    }
    const isAnimationDone = !isFirstIteration && areAllSpringAnimationsDone(springStatesForRigs);
    isFirstIteration = false;
    return isAnimationDone;
  }

  return updateSpringRigStyles;
}
