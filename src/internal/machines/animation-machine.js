// @flow
/**
 * AnimationMachine
 *
 * @module internal/machines/animation-machine
 */

import BezierEasing from 'bezier-easing'
import Debug from 'debug'

import type { Time, Controls, Animation, AnimationStage } from '../flow-types'

import { constructStyles } from '../fashionistas/timed-fashionista'
import { InfiniteTimeMachine, FiniteTimeMachine } from './time-machine'
import { SpringMachine } from './spring-machine'

const debug = Debug('animatronics:animation');

const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);

const isUsingTime = (animation: Object): boolean =>
  animation.duration != null;

const isUsingSpring = (animation: Object): boolean =>
  animation.stiffness != null && animation.damping != null;

export const reverseStages = (stages: AnimationStage[]): AnimationStage[] =>
  stages
    .map(stage =>
      Object.keys(stage).reduce((result, componentName) => {
        const { start, end, ...rest } = stage[componentName];
        result[componentName] = {
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

export const AnimationMachine = (
  requestAnimationFrame: Function,
  cancelAnimationFrame: Function,
): Animation => {

  const _state: { timeMachines: { [string]: Time }, previousStages: AnimationStage[] } = {
    timeMachines: {},
    previousStages: [],
  };

  const _runStage = (
    stage: AnimationStage,
    onComponentFrame: Function,
    onStageComplete: Function,
  ): void => {
    debug('running animation stage %O', stage);

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

  const play = (
    stages: AnimationStage[],
    controls: Controls,
    onComplete: Function,
  ) => {
    // TODO: invariant, can't have any previousStages
    _state.previousStages = stages;

    const _onStageComplete = nextStageNum => () => {
      if (nextStageNum === stages.length) {
        onComplete();
      } else {
        _runStage(
          stages[nextStageNum],
          controls.updateStyles,
          _onStageComplete(nextStageNum + 1),
        );
      }
    };

    _runStage(
      stages[0],
      controls.updateStyles,
      _onStageComplete(1),
    );
  }

  const rewind = (controls: Controls, onComplete: Function) => {
    const stages = reverseStages(_state.previousStages);
    play(stages, controls, () => {
      _state.previousStages = [];
      onComplete();
    });
  }

  const stop = () => {
    Object.keys(_state.timeMachines).forEach(componentName => {
      _state.timeMachines[componentName].stop();
    });
  }

  const machine = { play, rewind, stop };
  return machine;
};
