import type { VoidFn, Styles, SpringMachine } from '../../flow-types'

import Constants from '../../constants'
import { noop } from '../../utils'
import { parseStyle } from '../../fashionistas/common-fashionista'
import { reconstructStyles, interpolateValue } from '../../fashionistas/spring-fashionista'

// Springs can sometimes take a few iterations to get started. Need to set a minimum
// number of iterations before we mark a spring as "stopped" so we don't accidentally
// prevent slow springs from running.
const MIN_ITERATIONS: number = 10;

// Keep track of how many times the spring looked like it has stopped but don't actually
// stop it unless we've seen it stop a minimum number of times so we don't prematurely
// end the animation. Sometimes the spring will look like it has stopped when it has
// more iterations to go.
const MIN_STOPS: number = 5;

const hasStopped = (velocity: number): boolean =>
  Math.abs(velocity) < 0.01;

const calculateVelocity = (
  currentVelocity: number,
  currentPosition: number,
  endPosition: number,
  stiffness: number,
  damping: number,
): number => {
  const spring: number = -stiffness * (currentPosition - endPosition);
  const damper: number = -damping * currentVelocity;
  const acceleration: number = spring + damper;
  return currentVelocity + (acceleration * Constants.SECONDS_PER_ANIMATION_FRAME);
};

const calculateValue = (currentValue: number, velocity: number): number =>
  currentValue + (velocity * Constants.SECONDS_PER_ANIMATION_FRAME);

// Credit for most of this logic goes to:
// https://github.com/chenglou/react-motion/blob/b1cde24f27ef6f7d76685dceb0a951ebfaa10f85/src/Motion.js

export const makeSideEffects = machinist => ({
  INCREMENT_NUM_STOPS: (state, action) => {
    state.numStops++;
  },
  UPDATE_VELOCITIES: (state, action) => {
    const { velocities } = action;
    state.velocities = velocities;
  },
  UPDATE_VALUES: (state, action) => {
    const { values } = action;
    state.values = values;
  },
  UPDATE_INTERMEDIATE_VELOCITIES: (state, action) => {
    const { intermediateVelocities } = action;
    state.intermediateVelocities = intermediateVelocities;
  },
  UPDATE_INTERMEDIATE_VALUES: (state, action) => {
    const { intermediateValues } = action;
    state.intermediateValues = intermediateValues;
  },
  UPDATE_PREV_TIME: (state, action) => {
    const { prevTime } = action;
    state.prevTime = prevTime;
  },
  UPDATE_ACCUMULATED_TIME: (state, action) => {
    const { accumulatedTime } = action;
    state.accumulatedTime = accumulatedTime;
  },
  INCREMENT_NUM_ITERATIONS: (state, action) => {
    state.numIterations++;
  },
});

const calculateVelocities = state => {
  return state.velocities.map(
    (velocity, index) => calculateVelocity(
      velocity,
      state.values[index],
      state.endValues[index],
      state.stiffness,
      state.damping,
    )
  );
};

const calculateValues = state => {
  return state.values.map(
    (value, index) => calculateValue(value, state.velocities[index])
  );
};

const syncToLatestFrame = (state, dispatch) => numFramesBehind => {
  for (let i = 0; i < numFramesBehind; i++) {
    dispatch({
      type: 'UPDATE_VELOCITIES',
      velocities: calculateVelocities(state),
    });
    dispatch({
      type: 'UPDATE_VALUES',
      values: calculateValues(state),
    });
  }
};

const moveToNextFrame = (state, dispatch) => progress => {
  dispatch({
    type: 'UPDATE_INTERMEDIATE_VELOCITIES',
    intermediateVelocities: calculateVelocities(state),
  });
  dispatch({
    type: 'UPDATE_INTERMEDIATE_VALUES',
    intermediateValues: calculateValues(state),
  });
  dispatch({
    type: 'UPDATE_VELOCITIES',
    velocities: state.velocities.map(
      (velocity, index) => interpolateValue(
        velocity,
        state.intermediateVelocities[index],
        progress
      )
    ),
  });
  dispatch({
    type: 'UPDATE_VALUES',
    values: state.values.map(
      (value, index) => interpolateValue(
        value,
        state.intermediateValues[index],
        progress
      )
    )
  });
}

const isStopped = state => (
  state.velocities.every(hasStopped)
  && state.numIterations > MIN_ITERATIONS
);

const runNextFrame = (state, dispatch) => (
  onNext: Function = noop,
  onComplete: Function = noop
) => {
  if (isStopped(state)) {
    if (state.numStops === MIN_STOPS) {
      const updatedStyles = reconstructStyles(
        state.startStyles,
        state.endStyles,
        state.styleNames,
        state.endValues
      );
      onComplete(updatedStyles);
      return;
    } else {
      dispatch({ type: 'INCREMENT_NUM_STOPS' });
    }
  }

  const currentTime = Date.now();
  const timeSinceLastFrame = currentTime - state.prevTime;

  dispatch({
    type: 'UPDATE_PREV_TIME',
    prevTime: currentTime
  });
  dispatch({
    type: 'UPDATE_ACCUMULATED_TIME',
    accumulatedTime: state.accumulatedTime + timeSinceLastFrame,
  });

  const numFramesBehind = Math.floor(state.accumulatedTime / Constants.MS_PER_ANIMATION_FRAME);
  const remainingTime = numFramesBehind * Constants.MS_PER_ANIMATION_FRAME;
  const progress = (state.accumulatedTime - remainingTime) / Constants.MS_PER_ANIMATION_FRAME;

  syncToLatestFrame(state, dispatch)(numFramesBehind);
  moveToNextFrame(state, dispatch)(progress);

  const updatedStyles = reconstructStyles(
    state.startStyles,
    state.endStyles,
    state.styleNames,
    state.values
  );
  onNext(updatedStyles);

  dispatch({
    type: 'UPDATE_ACCUMULATED_TIME',
    accumulatedTime: state.accumulatedTime - (numFramesBehind * Constants.MS_PER_ANIMATION_FRAME)
  });
  dispatch({ type: 'INCREMENT_NUM_ITERATIONS' });
}

export const makeSpringMachine = machinist => (
  startStyles: Styles,
  endStyles: Styles,
  stiffness: number,
  damping: number,
) => {
  const styleNames = Object.keys(startStyles);
  const state = {
    startStyles,
    endStyles,
    stiffness,
    damping,
    styleNames,
    endValues: styleNames.map(() => 1),
    prevTime: Date.now(),
    accumulatedTime: 0,
    numIterations: 0,
    numStops: 0,
    values: styleNames.map(() => 0),
    velocities: styleNames.map(() => 0),
    intermediateValues: styleNames.map(() => 0),
    intermediateVelocities: styleNames.map(() => 0),
  };

  const sideEffects = makeSideEffects(machinist);

  const dispatch = action => {
    const { type } = action;
    sideEffects[type](state, action);
  };

  const springMachine = {
    runNextFrame: runNextFrame(state, dispatch),
  };

  return springMachine;
}
