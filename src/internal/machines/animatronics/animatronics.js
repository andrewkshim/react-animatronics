// To anyone who might judge me. Yes, this code is very stateful and ugly. It's an
// experiment in vanilla javascript and stateful/imperative programming. I've long
// since been a fan of functional programming with immutable data structures and
// purity and referential transparency and all that jazz, but I wanted to try
// and bend stateful programming up until the point of breaking (without
// actually breaking). There's a time and place for stateful programming, and I
// think it's better to experiment with it than to completely forgo it.

import Debug from 'debug'

import { constructStyles } from '../../fashionistas/timed'
import Recorder from '../../recorder'

import {
  parseTransformName,
  separateTransformNames,
} from '../../fashionistas/common'

import {
  BETWEEN_PAREN_REGEX,
  flatten,
  isUsingSpring,
  isUsingTime,
  makeError,
  noop,
} from '../../utils'

import {
  DEFAULT_ANIMATION_NAME,
  DEFAULT_EASING_FN,
  IS_PRODUCTION,
  TRANSFORM,
} from '../../constants'

import {
  throwIfAnimationNotValid,
  throwIfPhaseNotValid,
} from './validator'

import runSpringAnimation from './runSpringAnimation'

import { normalizeStyles } from './normalizer'

const debug = Debug('react-animatronics:machines:animatronics');

export const checkHasUniqueTransforms = animations => animations
  .map(animation => animation.from.transform)
  .filter(transform => !!transform)
  .map(parseTransformName)
  .reduce((result, name) => {
    result.add(name);
    return result;
  }, new Set())
  .size > 1;

export const calculateEasingProgress = (
  easing: Function,
  duration: number,
  elapsedTime: number,
): number => (
  easing(elapsedTime / (duration === 0 ? elapsedTime : duration))
);

export const mergeStringTransforms = animations => {
  return animations
    .map(animation => animation.to.transform)
    .filter(transform => !!transform)
    .join(' ');
}

export const makeAnimation = state => animationName => {
  const { animations, nodes } = state;

  const namedAnimations = (Array.isArray(animations) || typeof animations === 'function')
    ? { [DEFAULT_ANIMATION_NAME]: animations }
    : animations;

  if (!IS_PRODUCTION) {
    if (namedAnimations[animationName] == null) {
      throw makeError(
        `Attempted to run an animation named "${ animationName }", but there is no such`
        + ` named animation. The animations you have defined are:`
        + ` [${ Object.keys(namedAnimations).filter(name => name !== DEFAULT_ANIMATION_NAME) }]`
      );
    }
  }

  const isAnimationDynamic = typeof namedAnimations[animationName] === 'function';
  const animation = isAnimationDynamic
    ? namedAnimations[animationName](nodes)
    : namedAnimations[animationName];

  if (!IS_PRODUCTION) {
    animation.forEach(phase => throwIfPhaseNotValid(phase, nodes));
  }

  return animation;
};

const getNumPhases = state => animationName => {
  const animation = makeAnimation(state)(animationName);
  return animation.length;
};



export const runTimedAnimation = (state, mutators) => (
  animationName,
  componentName,
  animation,
  index,
  animations,
  hasUniqueTransforms = false
) => {
  const {
    from: fromStyles,
    to: toStyles,
    duration,
    easing = DEFAULT_EASING_FN,
  } = animation;

  // TODO: throw if animations from and to don't have the same
  const transformations = animation.from.transform
    && separateTransformNames(animation.from.transform);

  const { normalizedFrom, normalizedTo } = normalizeStyles({
    getComputedStyle: mutators.getComputedStyle,
    node: state.nodes[componentName],
    fromStyles,
    toStyles,
    animation,
  });

  mutators.createTimedJobMachine({
    animationName,
    index,
    componentName,
    duration,
  });

  if (!IS_PRODUCTION) {
    Recorder.reset(animationName);
  }

  const job = elapsedTime => {
    const progress = calculateEasingProgress(easing, duration, elapsedTime);
    const updatedStyles = constructStyles(
      normalizedFrom,
      normalizedTo,
      progress,
      transformations
    );
    if (hasUniqueTransforms) {
      mutators.updateUniqueTransformsComponentStyles({
        componentName,
        fromStyles,
        toStyles,
        updatedStyles,
        normalizedFrom,
        normalizedTo,
      });
    } else {
      mutators.updateComponentStyles({ componentName, updatedStyles });
    }

    if (!IS_PRODUCTION) {
      const updateStyles = state.styleUpdaters[componentName];
      Recorder.record({
        animationName,
        componentName,
        elapsedTime,
        updateStyles,
        updatedStyles: !hasUniqueTransforms ? updatedStyles : ({
          ...updatedStyles,
          transform: state.concurrentTransformsMachines[componentName].getTransformString()
        }),
      });
    }
  }

  const onCompleteJob = () => {
    const isStopped = !state.animationCountdownMachines[animationName];
    if (isStopped) return;

    if (hasUniqueTransforms) {
      mutators.updateUniqueTransformsComponentStyles({
        componentName,
        fromStyles,
        toStyles,
        normalizedFrom,
        normalizedTo,
        updatedStyles: toStyles,
      });
    } else {
      mutators.updateComponentStyles({
        componentName,
        updatedStyles: toStyles
      });
    }
    mutators.countdownAnimations({ animationName });
  }

  mutators.registerTimedJob({ animationName, index, componentName, job });
  mutators.registerTimedOnCompletedJob({ animationName, index, componentName, onCompleteJob });
  mutators.startTimedJob({ animationName, index, componentName });
};


// TODO: make this generic to multiple arguments, don't need it right now
// but would be nice to have
export const promisifyIfCallback = playAnimation => (
  animationName = DEFAULT_ANIMATION_NAME,
  onComplete,
) => {
  if (typeof animationName === 'function') {
    onComplete = animationName;
    animationName = DEFAULT_ANIMATION_NAME;
  }
  return (onComplete != null)
    ? playAnimation(animationName, onComplete)
    : (
      new Promise((resolve, reject) => {
        try {
          playAnimation(animationName, resolve);
        } catch (err) {
          reject(err);
        }
      })
    );
}

// IMPROVE: All functions that touch state and mutators can become action generators
// that produce a sequence of actions that should become applied. This will make it
// easier to unit test and see which parts of the state these functions touch.
export const playAnimation = (state, mutators) => promisifyIfCallback((animationName, onComplete) => {
  if (!IS_PRODUCTION) {
    if (typeof animationName !== 'string') {
      throw makeError(
        `playAnimation() expects its first argument to be a string name of`,
        `your animation, but it received: ${ animationName }. You might be`,
        `passing playAnimation directly into an event handler e.g. "onClick={playAnimation}"`,
        `but that will pass in the event as the first argument, so you should`,
        `instead be calling playAnimation directly e.g. "onClick={() => playAnimation()}".`
      );
    }
  }

  // IMPROVE: It's weird that getNumPhases calls makeAnimation internally, but
  // things are the way they are so the user does not need to write each
  // phase as a function - having this inefficiency makes the API nicer.
  const numPhases = getNumPhases(state)(animationName);

  if (!IS_PRODUCTION) {
    if (numPhases === 0) {
      throw makeError(
        `Attemped to run an empty animation. Check <Animatronics/>`
        + ` or withAnimatronics and make sure youre're returning either an Array or`
        + ` an Object from the "animations" function. Here's what your`
        + ` function looks like right now:`
        + `\n`
        + `${ state.animations.toString() }`
      );
    }
  }

  const onPhaseComplete = () => {
    if (!IS_PRODUCTION) {
      Recorder.flush();
    }
    onComplete();
  }

  mutators.createPhasesCountdownMachine({
    animationName,
    job: onPhaseComplete,
    numPhases,
  });

  const runPhase = (phaseIndex) => {
    const isStopped = !state.phasesCountdownMachines[animationName];
    if (isStopped) return;

    const animation = makeAnimation(state)(animationName);
    const phase = animation[phaseIndex];
    debug('executing phase %O', phase);
    const componentNames = Object.keys(phase);
    const numAnimations = componentNames.reduce(
      (result, componentNames) => {
        const rawAnimation = phase[componentNames];
        const animations = Array.isArray(rawAnimation) ? rawAnimation : [rawAnimation];
        return result + animations.length;
      },
      0
    );

    const job = () => {
      mutators.countdownPhases({ animationName });

      // TODO: remove this block
      componentNames.forEach(componentName => {
        const rawAnimation = phase[componentName];
        const animations = Array.isArray(rawAnimation) ? rawAnimation : [rawAnimation];
        const hasUniqueTransforms = checkHasUniqueTransforms(animations);
        if (!hasUniqueTransforms) return;
        mutators.setMergedTransforms({
          componentName,
          mergedTransforms: mergeStringTransforms(animations),
        });

      });

      if (phaseIndex < (numPhases - 1)) {
        runPhase(phaseIndex + 1);
      }
    }

    mutators.createAnimationCountdownMachine({
      animationName,
      job,
      numAnimations,
    });

    componentNames.forEach(componentName => {
      const rawAnimation = phase[componentName];
      const animations = Array.isArray(rawAnimation) ? rawAnimation : [rawAnimation];
      const hasUniqueTransforms = checkHasUniqueTransforms(animations);
      if (hasUniqueTransforms) {
        mutators.createConcurrentTransformsMachine({ componentName });
      }

      const runAnimation = (animation, index) => {
        if (isUsingTime(animation)) {
          // TODO: Reorganize this code, look at all the arguments :(
          // You can see that the wrong lines are drawn because we're passing in
          // the "animations", "animation", and "index". We only need the "animations"
          // to merge the transform styles IN CASE they happen to be unique.
          runTimedAnimation(state, mutators)(
            animationName,
            componentName,
            animation,
            index,
            animations,
            hasUniqueTransforms
          );
        } else if (isUsingSpring(animation)) {
          runSpringAnimation(state, mutators)(
            animationName,
            componentName,
            animation,
            index,
            hasUniqueTransforms
          );
        }
      };

      animations.forEach((animation, index) => {
        const { delay } = animation;
        if (delay == null) {
          runAnimation(animation, index);
        } else {
          mutators.runDelayedAnimation({
            animation,
            animationName,
            componentName,
            delay,
            index,
            runAnimation,
          });
        }
      });
    });
  }

  runPhase(0);
});

const cancelAnimation = (state, mutators) => (animationName) => {
  mutators.stopMachine({ animationName });
};

export const stopMachinesForAnimation = (machinist, state) => animationName => {
  if (state.timedJobMachines[animationName]) {
    flatten(Object.values(state.timedJobMachines[animationName]))
      .forEach(machine => machine.stop());
  }

  if (state.endlessJobMachines[animationName]) {
    flatten(Object.values(state.endlessJobMachines[animationName]))
      .forEach(machine => machine.stop());
  }

  if (state.timeouts[animationName]) {
    Object.values(state.timeouts[animationName])
      .forEach(timeout => machinist.clearTimeout(timeout));
  }

  state.animationCountdownMachines[animationName] = null;
  state.endlessJobMachines[animationName] = null;
  state.phasesCountdownMachines[animationName] = null;
  state.springMachines[animationName] = null;
  state.timedJobMachines[animationName] = null;
  state.timeouts[animationName] = null;
}

export const reset = (state, mutators) => () => {
  mutators.stopMachine();
  mutators.resetMachine();
};

const registerComponent = (state, mutators) => (
  componentName,
  node,
  styleGetter,
  styleUpdater,
  styleResetter,
) => {
  mutators.registerComponent({
    componentName,
    node,
    styleGetter,
    styleUpdater,
    styleResetter,
  });
}

const unregisterComponent = (state, mutators) => componentName => {
  mutators.unregisterComponent({ componentName });
}

const setAnimations = (state, mutators) => animations => {
  mutators.setAnimations({ animations });
}

// EXPERIMENT: Isolating any shared state mutations here.
export const makeMutators = (machinist, state) => ({
  createSpringMachine: action => {
    const {
      animationName,
      componentName,
      damping,
      normalizedFrom,
      index,
      stiffness,
      normalizedTo,
      transformations,
    } = action;
    const machine = machinist.makeSpringMachine(
      normalizedFrom,
      normalizedTo,
      stiffness,
      damping,
      transformations,
    );
    if (!state.springMachines[animationName]) {
      state.springMachines[animationName] = {};
    }
    if (!state.springMachines[animationName][componentName]) {
      state.springMachines[animationName][componentName] = [];
    }
    state.springMachines[animationName][componentName][index] = machine;
  },

  createEndlessJobMachine: action => {
    const { animationName, index, componentName } = action;
    const machine = machinist.makeEndlessJobMachine(
      machinist.requestAnimationFrame,
      machinist.cancelAnimationFrame
    );
    if (!state.endlessJobMachines[animationName]) {
      state.endlessJobMachines[animationName] = {};
    }
    if (!state.endlessJobMachines[animationName][componentName]) {
      state.endlessJobMachines[animationName][componentName] = [];
    }
    state.endlessJobMachines[animationName][componentName][index] = machine;
  },

  createAnimationCountdownMachine: action => {
    const { numAnimations, job, animationName } = action;
    const machine = machinist.makeCountdownJobMachine(numAnimations);
    machine.registerJob(job);
    state.animationCountdownMachines[animationName] = machine;
  },

  createConcurrentTransformsMachine: action => {
    const { componentName } = action;
    const machine = machinist.makeConcurrentTransformsMachine();
    state.concurrentTransformsMachines[componentName] = machine;
  },

  createPhasesCountdownMachine: action => {
    const { numPhases, job, animationName } = action;
    const machine = machinist.makeCountdownJobMachine(numPhases);
    machine.registerJob(job);
    state.phasesCountdownMachines[animationName] = machine;
  },

  createTimedJobMachine: action => {
    const { animationName, index, componentName, duration } = action;
    const machine = machinist.makeTimedJobMachine(
      duration,
      machinist.requestAnimationFrame,
      machinist.cancelAnimationFrame,
      machinist.now,
    );
    // IMPROVE: This is a good argument for adopting Immutable. It would make state
    // management like this much easier. That said, I want to keep the number of
    // external dependencies as low as possible, and adding Immutable isn't going
    // to improve things enough to warrant adding it (for now).
    if (!state.timedJobMachines[animationName]) {
      state.timedJobMachines[animationName] = {};
    }
    if (!state.timedJobMachines[animationName][componentName]) {
      state.timedJobMachines[animationName][componentName] = [];
    }
    state.timedJobMachines[animationName][componentName][index] = machine;
  },

  countdownAnimations: action => {
    const { animationName } = action;
    state.animationCountdownMachines[animationName].countdown();
  },

  countdownPhases: action => {
    const { animationName } = action;
    state.phasesCountdownMachines[animationName].countdown();
  },

  getComputedStyle: element => {
    // TODO: Find a better place to put this.
    return window.getComputedStyle(element);
  },

  now: () => {
    return machinist.now();
  },

  registerComponent: action => {
    const {
      componentName,
      node,
      styleGetter,
      styleUpdater,
      styleResetter,
    } = action;
    debug('registering component %s %o', componentName, node);
    state.nodes[componentName] = node;
    state.styleGetters[componentName] = styleGetter;
    state.styleUpdaters[componentName] = styleUpdater;
    state.styleResetters[componentName] = styleResetter;
  },

  registerEndlessJob: action => {
    const { animationName, index, componentName, job } = action;
    state.endlessJobMachines[animationName][componentName][index].registerJob(job);
  },

  registerTimedJob: action => {
    const { animationName, index, componentName, job } = action;
    state.timedJobMachines[animationName][componentName][index].registerJob(job);
  },

  registerTimedOnCompletedJob: action => {
    const { animationName, index, componentName, onCompleteJob } = action;
    state.timedJobMachines[animationName][componentName][index].registerOnCompleteJob(onCompleteJob);
  },

  resetMachine: action => {
    Object.keys(state.styleResetters).map(componentName => {
      state.styleResetters[componentName]();
    });
  },

  runNextSpringFrame: action => {
    const {
      animationName,
      componentName,
      index,
      onComplete,
      onNext,
    } = action;
    state.springMachines[animationName][componentName][index].runNextFrame(onNext, onComplete);
  },

  runDelayedAnimation: action => {
    const {
      animation,
      animationName,
      componentName,
      delay,
      index,
      runAnimation,
    } = action;
    if (!state.timeouts[animationName]) {
      state.timeouts[animationName] = {};
    }
    state.timeouts[animationName][componentName] = machinist.setTimeout(
      () => runAnimation(animation, index),
      delay
    );
  },

  setAnimations: action => {
    const { animations } = action;
    debug('setting updated animations %s', animations);
    state.animations = animations;
  },

  startTimedJob: action => {
    const { animationName, index, componentName } = action;
    state.timedJobMachines[animationName][componentName][index].start();
  },

  startEndlessJobMachine: action => {
    debug('starting endless job machine i.e. spring %O', action);
    const { animationName, index, componentName } = action;
    state.endlessJobMachines[animationName][componentName][index].start();
  },

  stopMachine: (action = {}) => {
    const { animationName } = action;

    if (!animationName) {
      Object.keys(state.phasesCountdownMachines).forEach(name => {
        stopMachinesForAnimation(machinist, state)(name);
      })
    } else {
       stopMachinesForAnimation(machinist, state)(animationName);
    }
  },

  stopEndlessJobMachine: action => {
    const { animationName, index, componentName } = action;
    state.endlessJobMachines[animationName][componentName][index].stop();
  },

  unregisterComponent: action => {
    const { componentName } = action;
    delete state.nodes[componentName];
    delete state.styleGetters[componentName];
    delete state.styleUpdaters[componentName];
  },

  setMergedTransforms: action => {
    const { componentName } = action;
    const machine = state.concurrentTransformsMachines[componentName];
    const updateStyles = state.styleUpdaters[componentName];
    updateStyles({ transform: machine.getTransformString() });
  },

  updateUniqueTransformsComponentStyles: action => {
    const {
      componentName,
      fromStyles,
      normalizedFrom,
      normalizedTo,
      toStyles,
      updatedStyles,
    } = action;

    const updateStyles = state.styleUpdaters[componentName];
    const transformsMachine = state.concurrentTransformsMachines[componentName];

    transformsMachine.registerTransforms({
      fromTransforms: normalizedFrom.transform,
      toTransforms: normalizedTo.transform,
      updatedTransforms: updatedStyles.transform,
    });

    updateStyles({
      ...updatedStyles,
      transform: transformsMachine.getTransformString(),
    });
  },

  updateComponentStyles: action => {
    const { componentName, updatedStyles } = action;
    const updateStyles = state.styleUpdaters[componentName];
    if (updateStyles) {
      updateStyles(updatedStyles);
    }
  }
});

export const makeAnimatronicsMachine = machinist => animations => {
  const state = {
    animationCountdownMachines: {},
    animations,
    concurrentTransformsMachines: {},
    endlessJobMachines: {},
    nodes: {},
    phasesCountdownMachines: {},
    springMachines: {},
    styleGetters: {},
    styleResetters: {},
    styleUpdaters: {},
    timedJobMachines: {},
    timeouts: {},
  };

  const mutators = makeMutators(machinist, state);

  const animatronicsMachine = {
    playAnimation: playAnimation(state, mutators),
    cancelAnimation: cancelAnimation(state, mutators),
    reset: reset(state, mutators),
    registerComponent: registerComponent(state, mutators),
    unregisterComponent: unregisterComponent(state, mutators),
    setAnimations: setAnimations(state, mutators),
  };

  return animatronicsMachine;
};

