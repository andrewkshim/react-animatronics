// @flow
/**
 * AnimationMachine
 *
 * @module internal/machines/animation-machine
 */

import BezierEasing from 'bezier-easing'
import Debug from 'debug'

import type { Time, Controls, Animation, AnimationStage } from '../flow-types'

import Constants from '../constants'
import { constructStyles } from '../fashionistas/timed-fashionista'
import { InfiniteTimeMachine, FiniteTimeMachine } from './time-machine'
import { SpringMachine } from './spring-machine'

const debug = Debug('animatronics:animation');

const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);

const isUsingTime = (animation: Object): boolean =>
  animation.duration != null;

const isUsingSpring = (animation: Object): boolean =>
  animation.stiffness != null && animation.damping != null;

export const findLongestDelay = (stage: AnimationStage): number =>
  Object.keys(stage)
    .map(key => stage[key])
    .map(s => s.delay || 0)
    .reduce(
      (longest, delay) => (delay > longest) ? delay : longest,
      0
    );

export const reverseStages = (stages: AnimationStage[]): AnimationStage[] =>
  stages
    .map(stage => Object.keys(stage)
      .reverse()
      .reduce((result, componentName) => {
        const longestDelay = findLongestDelay(stage);
        const { start, end, delay, ...rest } = stage[componentName];
        result[componentName] = {
          delay: longestDelay - (delay || 0),
          start: end,
          end: start,
          ...rest,
        };
        return result;
      }, {})
    )
    .reverse();

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
  onComponentDone: Function,
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
      onComponentDone();
    });
}

const runSpringAnimation = (
  timeMachine: Time,
  animation: Object,
  onFrame: Function,
  onComponentDone: Function,
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
    onComponentDone();
  }

  timeMachine
    .do(() => {
      springMachine.next(_onNext, _onComplete);
    })
    .run();
}

export default (
  createAnimationStages: Function,
  requestAnimationFrame: Function,
  cancelAnimationFrame: Function,
): Animation => {

  const _state: Object = {
    timeMachines: null,
    stages: null,
    createAnimationStages,
  };

  const _runStage = (
    stage: AnimationStage,
    onComponentFrame: Function,
    onStageComplete: Function,
  ): void => {
    debug('running animation stage %O', stage);

    _state.timeMachines = {};

    const componentNames = Object.keys(stage);
    let numComponentsDone = 0;

    const onComponentDone = () => {
      numComponentsDone++;
      if (numComponentsDone === componentNames.length) {
        onStageComplete();
      }
    };

    componentNames.forEach(componentName => {
      const animation: Object = stage[componentName];
      _state.timeMachines[componentName] = InfiniteTimeMachine(
        requestAnimationFrame,
        cancelAnimationFrame,
      );

      const onFrame: Function = (updatedStyles) => {
        onComponentFrame(componentName, updatedStyles);
      }

      if (isUsingTime(animation)) {
        runTimedAnimation(
          _state.timeMachines[componentName],
          animation,
          onFrame,
          onComponentDone
        );
      } else if (isUsingSpring(animation)) {
        runSpringAnimation(
          _state.timeMachines[componentName],
          animation,
          onFrame,
          onComponentDone
        );
      } else {
        // TODO: Error
      }
    });
  }

  const _onStageComplete = (
    nextStageNum,
    animationStages,
    onComponentFrame,
    onComplete
  ): Function => () => {
    if (nextStageNum === animationStages.length) {
      onComplete();
    } else {
      _runStage(
        animationStages[nextStageNum],
        onComponentFrame,
        _onStageComplete(
          nextStageNum + 1,
          animationStages,
          onComponentFrame,
          onComplete
        ),
      );
    }
  };

  const play = (
    animationName: string,
    controls: Controls,
    onComplete: Function,
  ) => {
    const rawStages = _state.createAnimationStages(controls.getNodes());
    _state.stages = Array.isArray(rawStages) ? { [Constants.DEFAULT_ANIMATION_NAME]: rawStages } : rawStages;

    const animationStages = _state.stages[animationName];

    _runStage(
      animationStages[0],
      controls.updateStyles,
      _onStageComplete(
        1,
        animationStages,
        controls.updateStyles,
        onComplete
      ),
    );
  }

  const rewind = (
    animationName: string,
    controls: Controls,
    onComplete: Function
  ) => {
    if (!_state.stages[animationName]) {
      // TODO: better error message
      throw new Error('rewind does not have stages');
    }
    const animationStages = reverseStages(_state.stages[animationName]);

    _runStage(
      animationStages[0],
      controls.updateStyles,
      _onStageComplete(
        1,
        animationStages,
        controls.updateStyles,
        onComplete
      ),
    );
  }

  const stop = () => {
    if (!_state.timeMachines) return;

    Object.keys(_state.timeMachines).forEach(componentName => {
      _state.timeMachines[componentName].stop();
    });
    _state.timeMachines = null;
    _state.stages = null;
  }

  const setCreateAnimationStages = updatedCreateAnimationStages => {
    _state.createAnimationStages = updatedCreateAnimationStages;
  }

  const machine = { play, rewind, stop, setCreateAnimationStages };
  return machine;
};
