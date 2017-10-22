// @flow
/**
 * AnimationMachine
 *
 * @module internal/machines/animation-machine
 */

import BezierEasing from 'bezier-easing'
import Debug from 'debug'
import lolex from 'lolex'

import type {
  Animation,
  AnimationMachine,
  AnimationPhase,
  ComponentsMachine,
  DOMNode,
  TimeMachine,
} from '../flow-types'

import Constants from '../constants'
import { IS_DEVELOPMENT, makeError } from '../utils'
import { constructStyles } from '../fashionistas/timed-fashionista'
import { InfiniteTimeMachine, FiniteTimeMachine } from './time-machine'
import SpringMachine from './spring-machine'

const clock = lolex.createClock();

const debug = Debug('animatronics:animation');

const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);

const stringify = obj => JSON.stringify(obj, null, 2);

const isUsingTime = (animation: Object): boolean =>
  animation.duration != null;

const isUsingSpring = (animation: Object): boolean =>
  animation.stiffness != null && animation.damping != null;

export const throwIfAnimationNotValid = (animation: Animation) => {
  if (isUsingTime(animation) && isUsingSpring(animation)) {
    throw makeError(
      `The following animation declaration is incorrect:`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `Animations must specify either [duration] OR [stiffness, damping],`,
      `they cannot specify all three at once because animating with a`,
      `duration is very different from animating with a spring.`
    );
  } else if (animation.duration != null && animation.stiffness != null) {
    throw makeError(
      `You declared an animation with both a 'duration' and a 'stiffness':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `You should either:`,
      `\n`,
      `    1) remove the 'stiffness'`,
      `\n`,
      `    OR`,
      `\n`,
      `    2) remove the 'duration' and add a 'damping'`,
      `\n`,
      `since animations must either use time or spring, but not both.`,
    );
  } else if (animation.duration != null && animation.damping != null) {
    throw makeError(
      `You declared an animation with both a 'duration' and a 'damping':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `You should either:`,
      `\n`,
      `    1) remove the 'damping'`,
      `\n`,
      `    OR`,
      `\n`,
      `    2) remove the 'duration' and add a 'stiffness'`,
      `\n`,
      `since animations must either use time or spring, but not both.`,
    );
  } else if (animation.stiffness != null && animation.damping == null) {
    throw makeError(
      `You declared an animation with a 'stiffness' but not a 'damping':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `Spring animations must specify both a stiffness and damping,`,
      `so add a 'damping' value to your animation for springy goodness.`
    );
  } else if (animation.stiffness == null && animation.damping != null) {
    throw makeError(
      `You declared an animation with a 'damping' but not a 'stiffness':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `Spring animations must specify both a stiffness and damping,`,
      `so add a 'stiffness' value to your animation for springy goodness.`
    );
  } else if (animation.duration != null && typeof animation.duration !== 'number') {
    throw makeError(
      `You declared an animation with an invalid 'duration':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'duration' must always be a number (in milliseconds).`
    );
  } else if (animation.stiffness != null && typeof animation.stiffness !== 'number') {
    throw makeError(
      `You declared an animation with an invalid 'stiffness':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'stiffness' must always be a number.`
    );
  } else if (animation.damping != null && typeof animation.damping !== 'number') {
    throw makeError(
      `You declared an animation with an invalid 'damping':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'damping' must always be a number.`
    );
  } else if (animation.start != null && animation.end == null) {
    throw makeError(
      `You declared an animation with a 'start' but not an 'end':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `Animations must always have an 'end'. They, unlike people, should`,
      `always know where life is going to take them.`
    );
  } else if (animation.start == null && animation.end != null) {
    throw makeError(
      `You declared an animation with an 'end' but not a 'start':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `Animations must always have a 'start'. They, unlike chickens or eggs,`,
      `should know exactly where the start is.`
    );
  } else if (animation.start != null && typeof animation.start !== 'object') {
    throw makeError(
      `You declared an animation with an invalid 'start':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'start' must always be a plain object.`
    );
  } else if (animation.end != null && typeof animation.end !== 'object') {
    throw makeError(
      `You declared an animation with an invalid 'end':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'end' must always be a plain object.`
    );
  } else if (animation.delay != null && typeof animation.delay !== 'number') {
    throw makeError(
      `You declared an animation with an invalid 'delay':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'delay' must always be a number (in milliseconds).`
    );
  }
}

export const throwIfPhaseNotValid = (phase: AnimationPhase, nodes: { [string]: DOMNode }) => {
  const validComponents = new Set(Object.keys(nodes));
  Object.keys(phase).forEach(componentName => {
    if (!validComponents.has(componentName)) {
      throw makeError(
        `You've declared an animation for the controlled component: '${ componentName }',`,
        `but react-animatronics isn't aware of any component with that name.`,
        `If you don't know why this is happening, check for the following:`,
        `\n`,
        `    1) Any misspelled names in withAnimatronics`,
        `\n`,
        `    2) Any misspelled names in withControl`,
        `\n`,
        `    3) If the component you want to animate should be wrapped by withControl`,
        `\n`
      );
    }
    const animation = phase[componentName];
    throwIfAnimationNotValid(animation);
  });
}

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
  now: () => number,
) => {
  const {
    start: startStyles,
    end: endStyles,
    duration,
    easingFn = DEFAULT_EASING_FN,
  } = animation;

  const finiteMachine: TimeMachine = FiniteTimeMachine(
    timeMachine,
    duration,
    now,
  );

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
  setTimeout: Function,
  clearTimeout: Function,
  now: () => number,
): AnimationMachine => {

  const _state: Object = {
    timeMachines: null,
    phases: null,
    timeouts: null,
    createAnimationSequences,
  };

  const _runPhase = (
    phase: AnimationPhase,
    onComponentFrame: Function,
    onPhaseComplete: Function,
  ): void => {
    debug('running animation phase %O', phase);

    _state.timeMachines = {};
    _state.timeouts = {};

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
          onComponentDone,
          now,
        );
      } else if (isUsingSpring(animation)) {
        runSpringAnimation(
          _state.timeMachines[componentName],
          animation,
          onFrame,
          onComponentDone
        );
      }

    }

    componentNames.forEach(componentName => {
      const animation: Object = phase[componentName];
      // Intentionally ignoring 0 (in addition to null and undefined) even though
      // setTimeout(fn, 0) would affect the execution timing.
      if (!animation.delay) {
        runComponentPhase(componentName);
      } else {
        _state.timeout[componentName] = setTimeout(
          () => runComponentPhase(componentName),
          animation.delay
        );
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
    const nodes = components.getNodes();
    const rawPhases = _state.createAnimationSequences(components.getNodes());
    _state.phases = Array.isArray(rawPhases)
      ? { [Constants.DEFAULT_ANIMATION_NAME]: rawPhases }
      : rawPhases;

    const animationPhases = _state.phases[animationName];

    if (IS_DEVELOPMENT) {
      animationPhases.forEach(phase => throwIfPhaseNotValid(phase, nodes));
    }

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
    if (IS_DEVELOPMENT) {
      if (!_state.phases) {
        throw makeError(
          `You attempted to run 'rewindAnimation' before running 'playAnimation',`,
          `but that doesn't make sense to react-animatronics, there's nothing to`,
          `rewind if you haven't played before. If you want to run an animation in`,
          `reverse, you should change or add an animation sequence to 'withAnimatronics'.`
        );
      }
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
      if (_state.timeouts[componentName]) {
        clearTimeout(_state.timeouts[componentName]);
      }
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
