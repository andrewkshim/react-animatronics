// @flow
/**
 * SpringMachine
 * @module machines/spring-machine
 */

import type { VoidFn } from '../flow-types'

import Constants from '../constants'
import { noop } from '../utils'
import { parseValues, interpolateStyle } from '../stylists/common-stylist'

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
  const spring = -stiffness * (currentPosition - endPosition);
  const damper = -damping * currentVelocity;
  const acceleration = spring + damper;
  return currentVelocity + (acceleration * Constants.SECONDS_PER_ANIMATION_FRAME);
};

const calculateValue = (currentValue, velocity) =>
  currentValue + (velocity * Constants.SECONDS_PER_ANIMATION_FRAME);

const interpolateValue = (currentValue, endValue, progress) => {
  const delta = endValue - currentValue;
  return currentValue + (delta * progress);
}

const interpolateStyle = (start, end, value) =>
  start.isColorType ?
    { ...start, value: chroma.mix(start.value, end.value, value) }
  : start.isNumberType ?
    { ...start, value: interpolateValue(start.value, end.value, value) }
  : start.isUnitType ?
    { ...start, value: interpolateValue(start.value, end.value, value) }
  :
    end;

const reconstructCSS = (startStyles, endStyles, styleNames, values) => {
  const reconstructed = {};
  styleNames.forEach((name, index) => {
    const start = parseStyle(startStyles[name]);
    const end = parseStyle(endStyles[name]);
    const value = values[index];
    reconstructed[name] = stringifyStyle(
      start.isBasicType ?
        interpolateStyle(start, end, value)
      : start.isTransformType ?
        {
          ...start,
          styles: start.styles.map(
            (s, i) => interpolateStyle(s, end.styles[i], value)
          ),
        }
      :
        end
    );
  });
  return reconstructed;
}

// Each SpringMachine manages the spring state for a single Style.
const SpringMachine = (startStyles, endStyles, stiffness, damping) => {

  const styleNames = Object.keys(startStyles);
  const endValues = styleNames.map(() => 1);

  let _prevTime = Date.now();
  let _numIterations = 0;
  let _accumulatedTime = 0;
  let _values = styleNames.map(() => 0);
  let _velocities = styleNames.map(() => 0);
  let _intermediateValues = styleNames.map(name => parseValues(startStyles[name]));
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

  const next = (onNext = noop) => {
    if (isStopped()) {
      const updatedCSS = reconstructCSS(startStyles, endStyles, styleNames, endValues);
      onNext(updatedCSS);
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
  }

  const machine = { isStopped, next };
  return machine;
};
