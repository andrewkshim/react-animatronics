// @flow
/**
 * AnimationMachine
 *
 * @module internal/machines/animation-machine
 */

import BezierEasing from 'bezier-easing'
import Debug from 'debug'

import type { TimeMachine, ComponentsMachine, AnimationMachine, Animation, AnimationPhase } from '../flow-types'

import Constants from '../constants'
import { constructStyles } from '../fashionistas/timed-fashionista'
import { InfiniteTimeMachine, FiniteTimeMachine } from './time-machine'
import SpringMachine from './spring-machine'

const debug = Debug('animatronics:animation');

const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);

const isUsingTime = (animation: Object): boolean =>
  animation.duration != null;

const isUsingSpring = (animation: Object): boolean =>
  animation.stiffness != null && animation.damping != null;

export const findLongestDelay = (phase: AnimationPhase): number =>
  Object.keys(phase)
    .map(key => phase[key])
    .map(s => s.delay || 0)
    .reduce(
      (longest, delay) => (delay > longest) ? delay : longest,
      0
    );

export const reversePhases = (phases: AnimationPhase[]): AnimationPhase[] =>
  phases
    .map(phase => Object.keys(phase)
      .reverse()
      .reduce((result, componentName) => {
        const longestDelay = findLongestDelay(phase);
        const { start, end, delay, ...rest } = phase[componentName];
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
  timeMachine: TimeMachine,
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

  const finiteMachine: TimeMachine = FiniteTimeMachine(timeMachine, duration);

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
  timeMachine: TimeMachine,
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
  createAnimationSequences: Function,
  requestAnimationFrame: Function,
  cancelAnimationFrame: Function,
): AnimationMachine => {

  const _state: Object = {
    timeMachines: null,
    phases: null,
    createAnimationSequences,
  };

  const _runPhase = (
    phase: AnimationPhase,
    onComponentFrame: Function,
    onPhaseComplete: Function,
  ): void => {
    debug('running animation phase %O', phase);

    _state.timeMachines = {};

    const componentNames = Object.keys(phase);
    let numComponentsDone = 0;

    const onComponentDone = () => {
      numComponentsDone++;
      if (numComponentsDone === componentNames.length) {
        onPhaseComplete();
      }
    };

    const runComponentPhase = componentName => {
      const animation: Object = phase[componentName];

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

    }

    componentNames.forEach(componentName => {
      const animation: Object = phase[componentName];
      // Intentionally ignoring 0 (in addition to null and undefined) even though
      // setTimeout(fn, 0) would affect the execution timing.
      if (!animation.delay) {
        runComponentPhase(componentName);
      } else {
        setTimeout(() => runComponentPhase(componentName), animation.delay);
      }
    });
  }

  const _onPhaseComplete = (
    nextPhaseNum,
    animationPhases,
    onComponentFrame,
    onComplete
  ): Function => () => {
    if (nextPhaseNum === animationPhases.length) {
      onComplete();
    } else {
      _runPhase(
        animationPhases[nextPhaseNum],
        onComponentFrame,
        _onPhaseComplete(
          nextPhaseNum + 1,
          animationPhases,
          onComponentFrame,
          onComplete
        ),
      );
    }
  };

  const play = (
    animationName: string,
    components: ComponentsMachine,
    onComplete: Function,
  ) => {
    const rawPhases = _state.createAnimationSequences(components.getNodes());
    _state.phases = Array.isArray(rawPhases) ? { [Constants.DEFAULT_ANIMATION_NAME]: rawPhases } : rawPhases;

    const animationPhases = _state.phases[animationName];

    _runPhase(
      animationPhases[0],
      components.updateStyles,
      _onPhaseComplete(
        1,
        animationPhases,
        components.updateStyles,
        onComplete
      ),
    );
  }

  const rewind = (
    animationName: string,
    components: ComponentsMachine,
    onComplete: Function
  ) => {
    if (!_state.phases) {
      // TODO: better error message
      throw new Error('rewind does not have phases');
    }
    const animationPhases = reversePhases(_state.phases[animationName]);

    _runPhase(
      animationPhases[0],
      components.updateStyles,
      _onPhaseComplete(
        1,
        animationPhases,
        components.updateStyles,
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
    _state.phases = null;
  }

  const setCreateAnimationSequences = updatedCreateAnimationPhases => {
    _state.createAnimationSequences = updatedCreateAnimationPhases;
  }

  const machine = { play, rewind, stop, setCreateAnimationSequences };
  return machine;
};
