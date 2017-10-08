// @flow
/**
 * SpringMachine
 * @module machines/spring-machine
 */

import type {
  VoidFn,
  CSS,
  SpringMachine as SpringMachineType,
} from '../flow-types'

import Constants from '../constants'
import { noop } from '../utils'
import { parseStyle, stringifyStyle } from '../stylists/common-stylist'
import { reconstructCSS, interpolateValue } from '../stylists/spring-stylist'

// Springs can sometimes take a few iterations to get started. Need to set a minimum
// number of iterations before we mark a spring as "stopped" so we don't accidentally
// prevent slow springs from running.
const MIN_ITERATIONS: number = 10;

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
export const SpringMachine = (
  startStyles: CSS,
  endStyles: CSS,
  stiffness: number,
  damping: number,
): SpringMachineType => {

  const styleNames: Array<string> = Object.keys(startStyles);
  const endValues: Array<number> = styleNames.map(() => 1);

  let _prevTime = Date.now();
  let _numIterations = 0;
  let _accumulatedTime = 0;
  let _values = styleNames.map(() => 0);
  let _velocities = styleNames.map(() => 0);
  let _intermediateValues = styleNames.map(() => 0);
  let _intermediateVelocities = styleNames.map(() => 0);

  const calculateVelocities = (velocities) => {
    return velocities.map(
      (velocity, index) => calculateVelocity(
        velocity,
        _values[index],
        endValues[index],
        stiffness,
        damping,
      )
    );
  }

  const calculateValues = (values, velocities) => {
    return values.map(
      (value, index) => calculateValue(value, velocities[index])
    );
  }

  const syncToLatestFrame = (numFramesBehind) => {
    for (let i = 0; i < numFramesBehind; i++) {
      _velocities = calculateVelocities(_velocities);
      _values = calculateValues(_values, _velocities);
    }
  }

    // todo: num frames behind
  const moveToNextFrame = (progress) => {
    _intermediateVelocities = calculateVelocities(_velocities);
    _intermediateValues = calculateValues(_values, _intermediateVelocities);
    _velocities = _velocities.map(
      (velocity, index) => interpolateValue(velocity, _intermediateVelocities[index], progress)
    );
    _values = _values.map(
      (value, index) => interpolateValue(value, _intermediateValues[index], progress)
    );

  }

  const isStopped = () => _velocities.every(hasStopped) && _numIterations > MIN_ITERATIONS;

  const next = (onNext = noop, onComplete = noop) => {
    if (isStopped()) {
      const updatedCSS = reconstructCSS(startStyles, endStyles, styleNames, endValues);
      onComplete(updatedCSS);
      return;
    }
    const currentTime = Date.now();
    const timeSinceLastFrame = currentTime - _prevTime;

    _prevTime = currentTime;
    _accumulatedTime += timeSinceLastFrame;

    const numFramesBehind = Math.floor(_accumulatedTime / Constants.MS_PER_ANIMATION_FRAME);
    const remainingTime = numFramesBehind * Constants.MS_PER_ANIMATION_FRAME;
    const progress = (_accumulatedTime - remainingTime) / Constants.MS_PER_ANIMATION_FRAME;

    syncToLatestFrame(numFramesBehind);
    moveToNextFrame(progress);

    const updatedCSS = reconstructCSS(startStyles, endStyles, styleNames, _values);
    onNext(updatedCSS);

    _accumulatedTime -= (numFramesBehind * Constants.MS_PER_ANIMATION_FRAME);
    _numIterations++;
  }

  const machine = { isStopped, next };
  return machine;
};
