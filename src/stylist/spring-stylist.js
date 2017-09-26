/**
 * SpringStylist: manages styles for spring animations.
 * @module stylist/spring-stylist
 */

import {
  MS_PER_ANIMATION_FRAME,
  SECONDS_PER_ANIMATION_FRAME,
} from '../constants'

import {
  createNumberStyle,
  isColorType,
  isNumberType,
  isTransformType,
  parseStyle,
  stringifyStyle,
} from './common-stylist'

const createTransformSpringState = (startTransformStyle, endTransformStyle) => {
  const { styles: startStyles, names, type } = startTransformStyle;
  const { styles: endStyles } = endTransformStyle;
  const startVelocities = Object.keys(startStyles).map(() => 0);
  return {
    actualStyles: startStyles,
    actualVelocities: startVelocities,
    currentStyles: startStyles,
    currentVelocities: startVelocities,
    endStyles: endStyles,
    names,
    type,
  };
};

const createGenericSpringState = (startStyle, endStyle) => {
  const { type } = startStyle;

  // normalizing into an array so we can treat this and the TransformSpringStates similarly
  const startVelocities = [0];
  const startStyles = [startStyle];
  const endStyles = [endStyle];

  return {
    actualStyles: startStyles,
    actualVelocities: startVelocities,
    currentStyles: startStyles,
    currentVelocities: startVelocities,
    endStyles,
    type,
  };
}

const createSpringState = (startStyle, endStyle) => isTransformType(startStyle)
  ? createTransformSpringState(startStyle, endStyle)
  : createGenericSpringState(startStyle, endStyle)
;

const calculateUpdatedSpringValue = (currentValue, updatedValue, percentageFrameCompleted) => {
  const completeDelta = updatedValue - currentValue;
  const currentDelta = completeDelta * percentageFrameCompleted;
  return currentValue + currentDelta;
}

const NON_NUMERIC_SPRING_STATE = createSpringState(
  createNumberStyle(0),
  createNumberStyle(1),
);

const calculateUpdatedVelocity = (currentVelocity, currentValue, endValue, stiffness, damping) => {
  const spring = -stiffness * (currentValue - endValue);
  const damper = -damping * currentVelocity;
  const acceleration = spring + damper;
  return currentVelocity + (acceleration * SECONDS_PER_ANIMATION_FRAME);
};

const calculateUpdatedStyleValue = (currentStyle, updatedVelocity) =>
  currentStyle.value + (updatedVelocity * SECONDS_PER_ANIMATION_FRAME);

const constructUpdatedStyle = (currentStyle, endStyle, updatedVelocity) => (
  isColorType(currentStyle) ?
    {
      ...currentStyle,
      value: chroma.mix(
        currentStyle.value,
        endStyle.value,
        calculateUpdatedStyleValue(currentStyle, updatedVelocity),
      ),
    }
  : isNumberType(currentStyle) ?
    {
      ...currentStyle,
      value: calculateUpdatedStyleValue(currentStyle, updatedVelocity),
    }
  : isTransformType(currentStyle) ?
    {
      ...currentStyle,
      value: calculateUpdatedStyleValue(currentStyle, updatedVelocity),
    }
  :
    {
      ...currentStyle,
      value: calculateUpdatedStyleValue(currentStyle, updatedVelocity),
    }
);

const calculateNextSpringState = (springState, stiffness, damping) => {
  const { endStyles, currentVelocities } = springState;
  const { currentStyles } = isColorType(springState)
    ? NON_NUMERIC_SPRING_STATE
    : springState
  ;
  const updatedVelocities = currentVelocities.map(
    (velocity, index) => calculateUpdatedVelocity(
      velocity,
      currentStyles[index].value,
      endStyles[index].value,
      stiffness,
      damping,
    )
  );
  const updatedStyles = currentStyles.map(
    (currentStyle, index) => constructUpdatedStyle(
      currentStyle,
      endStyles[index],
      updatedVelocities[index],
    )
  );
  return {
    ...springState,
    currentVelocities: updatedVelocities,
    currentStyles: updatedStyles,
  };
}

const hasVelocityStopped = velocity => Math.abs(velocity) < 0.01;

const getActualVelocities = springState => springState.actualVelocities;

const isSpringAnimationDone = springStates =>
  Object.keys(springStates)
    .reduce(
      (velocities, styleName) =>
        velocities.concat(getActualVelocities(springStates[styleName])),
      [],
    )
    .every(hasVelocityStopped)
;

export const areAllSpringAnimationsDone = springStatesForRigs =>
  Object.keys(springStatesForRigs)
    .reduce(
      (result, componentName) =>
        result.concat(isSpringAnimationDone(springStatesForRigs[componentName])),
      []
    )
    .every(isDone => isDone)
;

const createInitialSpringStates = (startStyles, endStyles) =>
  Object.keys(startStyles).reduce(
    (states, styleName) => ({
      ...states,
      [styleName]: createSpringState(
        parseStyle(startStyles[styleName]),
        parseStyle(endStyles[styleName]),
      )
    }),
    {}
  )
;

const calculateActualSpringState = (
  currentSpringState,
  updatedSpringState,
  percentageFrameCompleted,
) => ({
  ...currentSpringState,
  actualStyles: updatedSpringState.currentStyles.map(
    (updatedStyle, index) => ({
      ...updatedStyle,
      value: calculateUpdatedSpringValue(
        currentSpringState.currentStyles[index],
        updatedStyle,
        percentageFrameCompleted,
      )
    })
  ),
  actualVelocities: updatedSpringState.currentVelocities.map(
    (updatedVelocity, index) => (
      calculateUpdatedSpringValue(
        currentSpringState.currentVelocities[index],
        updatedVelocity,
        percentageFrameCompleted,
      )
    )
  ),
});

const getUpdatedStyleString = actualSpringState =>
  stringifyStyle(
    isTransformType(actualSpringState)
      ? {
          type: TRANSFORM_STYLE_TYPE,
          names: actualSpringState.names,
          styles: actualSpringState.actualStyles,
        }
      :
        actualSpringState.currentStyles[0]
  )
;

const updateStyleForRig = (
  styleName,
  setComponentStyle,
  springStates,
  numFramesRemaining,
  percentageFrameCompleted,
  stiffness,
  damping,
) => {
  for (let i = 0; i < numFramesRemaining; i++) {
    const currentSpringState = springStates[styleName];
    springStates[styleName] = calculateNextSpringState(
      currentSpringState,
      stiffness,
      damping,
    );
  }

  const currentSpringState = springStates[styleName];
  const updatedSpringState = calculateNextSpringState(
    currentSpringState,
    stiffness,
    damping,
  );
  const actualSpringState = calculateActualSpringState(
    currentSpringState,
    updatedSpringState,
    percentageFrameCompleted,
  );
  const updatedStyleString = getUpdatedStyleString(actualSpringState);

  springStates[styleName] = actualSpringState;
  setComponentStyle({ [styleName]: updatedStyleString });
}

// Credit for most of this logic goes to:
// https://github.com/chenglou/react-motion/blob/b1cde24f27ef6f7d76685dceb0a951ebfaa10f85/src/Motion.js
export const createFnUpdateSpringRigStyles = ({
  startStyles,
  endStyles,
  stiffness,
  damping,
  setComponentStyle,
}) => {

  const springStates = createInitialSpringStates(startStyles, endStyles);

  let prevTime = Date.now();
  let isFirstIteration = true;
  let accumulatedTime = 0;

  const updateSpringRigStyles = () => {

    let isRigAnimationDone = (
      !isFirstIteration
      && isSpringAnimationDone(springStates)
    );

    if (isRigAnimationDone) {
      setComponentStyle(endStyles);
    } else {

      const currentTime = Date.now();
      const elapsedTime = currentTime - prevTime;
      prevTime = currentTime;
      accumulatedTime += elapsedTime;

      const numFramesRemaining = Math.floor(accumulatedTime / MS_PER_ANIMATION_FRAME);
      const remainingTime = numFramesRemaining * MS_PER_ANIMATION_FRAME;
      const percentageFrameCompleted = (accumulatedTime - remainingTime) / MS_PER_ANIMATION_FRAME;

      Object.keys(startStyles).forEach(styleName => updateStyleForRig(
        styleName,
        setComponentStyle,
        springStates,
        numFramesRemaining,
        percentageFrameCompleted,
        stiffness,
        damping,
      ));

      accumulatedTime -= (numFramesRemaining * MS_PER_ANIMATION_FRAME);
    }


    isRigAnimationDone = (
      !isFirstIteration
      && isSpringAnimationDone(springStates)
    );

    isFirstIteration = false;
    return isRigAnimationDone;
  }

  return updateSpringRigStyles;
}
