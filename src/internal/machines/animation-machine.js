// @flow
/**
 * AnimationMachine
 *
 * @module internal/machines/animation-machine
 */

import BezierEasing from 'bezier-easing'

import type { Time, Animation } from '../flow-types'

import { constructStyles } from '../fashionistas/timed-fashionista'
import { InfiniteTimeMachine, FiniteTimeMachine } from './time-machine'
import { SpringMachine } from './spring-machine'

const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);

const isUsingTime = (animation: Object): boolean =>
  animation.duration != null;

const isUsingSpring = (animation: Object): boolean =>
  animation.stiffness != null && animation.damping != null;

export const calculateEasingProgress = (
  easingFn: Function,
  duration: number,
  elapsedTime: number,
): number =>
  easingFn(elapsedTime / (duration === 0 ? elapsedTime : duration));

const runTimedAnimation = (
  timeMachine: Time,
  animation: Object,
  onFrame: Function,
  onComplete: Function,
) => {
  const {
    start: startStyles,
    end: endStyles,
    duration,
    easingFn = DEFAULT_EASING_FN,
  } = animation;

  const finiteMachine: Time = FiniteTimeMachine(timeMachine, duration);

  finiteMachine
    .do(elapsedTime => {
      const progress = calculateEasingProgress(easingFn, duration, elapsedTime);
      const currentStyles = constructStyles(startStyles, endStyles, progress);
      onFrame(currentStyles);
    })
    .run(() => {
      onFrame(endStyles);
      onComplete();
    });
}

const runSpringAnimation = (
  timeMachine: Time,
  animation: Object,
  onFrame: Function,
  onComplete: Function,
) => {
  const {
    start: startStyles,
    end: endStyles,
    stiffness,
    damping,
  } = animation;

  const springMachine = SpringMachine(startStyles, endStyles, stiffness, damping);
  const _onNext = (updatedStyles) => {
    onFrame(updatedStyles);
  }
  const _onComplete = (endStyles) => {
    onFrame(endStyles);
    timeMachine.stop();
    onComplete();
  }

  timeMachine
    .do(() => {
      springMachine.next(_onNext, _onComplete);
    })
    .run();
}

export const AnimationMachine = (
  stage: Object,
  requestAnimationFrame: Function,
  cancelAnimationFrame: Function,
): Animation => {
  const infiniteMachine: Time = InfiniteTimeMachine(
    requestAnimationFrame,
    cancelAnimationFrame,
  );

  const run = (onComponentFrame: Function, onComplete: Function) => {
    Object.keys(stage).reduce((updatedComponentStyles, componentName) => {
      const animation: Object = stage[componentName];
      const onFrame: Function = (updatedStyles) => {
        onComponentFrame(componentName, updatedStyles);
      }
      if (isUsingTime(animation)) {
        runTimedAnimation(infiniteMachine, animation, onFrame, onComplete);
      } else if (isUsingSpring(animation)) {
        runSpringAnimation(infiniteMachine, animation, onFrame, onComplete);
      } else {
        // TODO: Error
      }
    }, {});
  }

  const machine = { run };
  return machine;
};
