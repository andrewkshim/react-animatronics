import type { VoidFn, Styles, SpringMachine } from '../../flow-types'

import { noop } from '../utils'
import { parseStyle } from '../fashionistas/common'
import { reconstructStyles, interpolateValue } from '../fashionistas/spring'
import {
  SECONDS_PER_ANIMATION_FRAME,
  MS_PER_ANIMATION_FRAME,
} from '../constants'

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
  return currentVelocity + (acceleration * SECONDS_PER_ANIMATION_FRAME);
};

const calculateValue = (currentValue: number, velocity: number): number =>
  currentValue + (velocity * SECONDS_PER_ANIMATION_FRAME);

// Credit for most of this logic goes to:
// https://github.com/chenglou/react-motion/blob/b1cde24f27ef6f7d76685dceb0a951ebfaa10f85/src/Motion.js

export const makeMutators = (machinist, state) => ({
  incrementNumIterations: action => {
    state.numIterations++;
  },
  incrementNumStops: action => {
    state.numStops++;
  },
  now: () => {
    return machinist.now();
  },
  updateVelocities: action => {
    const { velocities } = action;
    state.velocities = velocities;
  },
  updateValues: action => {
    const { values } = action;
    state.values = values;
  },
  updateIntermediateVelocities: action => {
    const { intermediateVelocities } = action;
    state.intermediateVelocities = intermediateVelocities;
  },
  updateIntermediateValues: action => {
    const { intermediateValues } = action;
    state.intermediateValues = intermediateValues;
  },
  updatePrevTime: action => {
    const { prevTime } = action;
    state.prevTime = prevTime;
  },
  updateAccumulatedTime: action => {
    const { accumulatedTime } = action;
    state.accumulatedTime = accumulatedTime;
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

const syncToLatestFrame = (state, mutators) => numFramesBehind => {
  for (let i = 0; i < numFramesBehind; i++) {
    const velocities = calculateVelocities(state);
    mutators.updateVelocities({ velocities });

    const values = calculateValues(state);
    mutators.updateValues({ values });
  }
};

const moveToNextFrame = (state, mutators) => progress => {
  const intermediateVelocities = calculateVelocities(state);
  mutators.updateIntermediateVelocities({ intermediateVelocities });

  const intermediateValues = calculateValues(state);
  mutators.updateIntermediateValues({ intermediateValues });

  const velocities = state.velocities.map(
    (velocity, index) => interpolateValue(
      velocity,
      state.intermediateVelocities[index],
      progress
    )
  );
  mutators.updateVelocities({ velocities });

  const values = state.values.map(
    (value, index) => interpolateValue(
      value,
      state.intermediateValues[index],
      progress
    )
  );
  mutators.updateValues({ values })
}

const isStopped = state => (
  state.velocities.every(hasStopped)
  && state.numIterations > MIN_ITERATIONS
);

const runNextFrame = (state, mutators) => (
  onNext: Function = noop,
  onComplete: Function = noop
) => {
  if (isStopped(state)) {
    if (state.numStops === MIN_STOPS) {
      const updatedStyles = reconstructStyles(
        state.fromStyles,
        state.toStyles,
        state.styleNames,
        state.endValues
      );
      onComplete(updatedStyles);
      return;
    } else {
      mutators.incrementNumStops();
    }
  }

  const currentTime = mutators.now();
  const timeSinceLastFrame = currentTime - state.prevTime;

  mutators.updatePrevTime({ prevTime: currentTime });
  mutators.updateAccumulatedTime({
    accumulatedTime: state.accumulatedTime + timeSinceLastFrame,
  })

  const numFramesBehind = Math.floor(state.accumulatedTime / MS_PER_ANIMATION_FRAME);
  const remainingTime = numFramesBehind * MS_PER_ANIMATION_FRAME;
  const progress = (state.accumulatedTime - remainingTime) / MS_PER_ANIMATION_FRAME;

  syncToLatestFrame(state, mutators)(numFramesBehind);
  moveToNextFrame(state, mutators)(progress);

  const updatedStyles = reconstructStyles(
    state.fromStyles,
    state.toStyles,
    state.styleNames,
    state.values
  );
  onNext(updatedStyles);

  mutators.updateAccumulatedTime({
    accumulatedTime: state.accumulatedTime - (numFramesBehind * MS_PER_ANIMATION_FRAME),
  });
  mutators.incrementNumIterations();
}

export const makeSpringMachine = machinist => (
  fromStyles: Styles,
  toStyles: Styles,
  stiffness: number,
  damping: number,
) => {
  const styleNames = Object.keys(fromStyles);
  const state = {
    fromStyles,
    toStyles,
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

  const mutators = makeMutators(machinist, state);

  const springMachine = {
    runNextFrame: runNextFrame(state, mutators),
  };

  return springMachine;
}
