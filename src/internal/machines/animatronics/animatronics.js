// To anyone who might judge me. Yes, this code is very stateful and ugly. It's an
// experiment in vanilla javascript and stateful/imperative programming. I've long
// since been a fan of functional programming with immutable data structures and
// purity and referential integrity and all that jazz, but I wanted to go back to
// my roots and try to bend stateful programming up until the point of breaking
// (without actually breaking). There's a time and place for stateful programming,
// and I think it's better to experiment with it than to completely forgo it.

import Debug from 'debug'

import { haveConvertibleUnits } from '../../fashionistas/common'
import { constructStyles } from '../../fashionistas/timed'
import Recorder from '../../recorder'

import {
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

const debug = Debug('react-animatronics:machines:animatronics');

export const calculateEasingProgress = (
  easingFn: Function,
  duration: number,
  elapsedTime: number,
): number => (
  easingFn(elapsedTime / (duration === 0 ? elapsedTime : duration))
);

export const makeSequence = state => animationName => {
  const { animations, nodes } = state;
  const areSequencesStatic = typeof animations === 'function';

  const sequences = areSequencesStatic
    ? animations(nodes)
    : animations;

  const namedSequences = Array.isArray(sequences)
    ? { [DEFAULT_ANIMATION_NAME]: sequences }
    : sequences;

  if (!IS_PRODUCTION) {
    if (namedSequences[animationName] == null) {
      throw makeError(
        `Attempted to run an animation named "${ animationName }", but there is no such`
        + ` named animation. The animations you have defined are:`
        + ` [${ Object.keys(namedSequences).filter(name => name !== DEFAULT_ANIMATION_NAME) }]`
      );
    }
  }

  const sequence = areSequencesStatic
    ? namedSequences[animationName]
    : namedSequences[animationName](nodes);

  if (!IS_PRODUCTION) {
    sequence.forEach(phase => throwIfPhaseNotValid(phase, nodes));
  }

  return sequence;
};

const getNumPhases = state => animationName => {
  const sequence = makeSequence(state)(animationName);
  return sequence.length;
};

const normalizeStyles = (getComputedStyle, node, fromStyles, toStyles) => {
  const normalizedFrom = { ...fromStyles };
  const normalizedTo = { ...toStyles };
  Object.keys(normalizedFrom).map(styleName => {
    const rawFromStyle = normalizedFrom[styleName];
    const rawToStyle = normalizedTo[styleName];
    if (!haveConvertibleUnits(rawFromStyle, rawToStyle, styleName)) return;
    if (!node && styleName === TRANSFORM) return;
    if (!node && styleName !== TRANSFORM) {
      // FIXME: More detailed error detection for transform styles? It's
      // tough to know whether or not we need to throw an error when using a
      // transform style since we need to know whether each individual
      // transformation pair is actually using a different unit.
      if (styleName !== TRANSFORM) {
        throw makeError(
          `You specified "from" and "to" styles that have different units, but there`
          + ` is no ref available for the component "${ componentName }". You must`
          + ` either change one of the styles [`
            + `{${styleName}: ${rawFromStyle}}, `
            + `{${styleName}: ${rawToStyle}}`
          + `] so they have the same units or make the ${ componentName }`
          + ` component a class component.`
        );
      }
    }
    node.style[styleName] = rawToStyle;
    const computedTo = getComputedStyle(node);
    normalizedTo[styleName] = computedTo[styleName];

    // FIXME: can make more efficient by not calling getComputedStyle more than twice
    node.style[styleName] = rawFromStyle;
    const computedFrom = getComputedStyle(node);
    normalizedFrom[styleName] = computedFrom[styleName];
  });
  return { normalizedFrom, normalizedTo };
}

export const runTimedAnimation = (state, mutators) => (animationName, componentName, animation, index) => {
  const {
    from: fromStyles,
    to: toStyles,
    duration,
    easingFn = DEFAULT_EASING_FN,
  } = animation;

  const { normalizedFrom, normalizedTo } = normalizeStyles(
    mutators.getComputedStyle,
    state.nodes[componentName],
    fromStyles,
    toStyles
  );

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
    const progress = calculateEasingProgress(easingFn, duration, elapsedTime);
    const updatedStyles = constructStyles(normalizedFrom, normalizedTo, progress);
    mutators.updateComponentStyles({ componentName, updatedStyles });

    if (!IS_PRODUCTION) {
      const updateStyles = state.styleUpdaters[componentName];
      Recorder.record({ animationName, componentName, elapsedTime, updatedStyles, updateStyles });
    }
  }

  const onCompleteJob = () => {
    const isStopped = !state.animationCountdownMachines[animationName];
    if (isStopped) return;

    mutators.updateComponentStyles({ componentName, updatedStyles: toStyles });
    mutators.countdownAnimations({ animationName });
  }

  mutators.registerTimedJob({ animationName, index, componentName, job });
  mutators.registerTimedOnCompletedJob({ animationName, index, componentName, onCompleteJob });
  mutators.startTimedJob({ animationName, index, componentName });
};

const runSpringAnimation = (state, mutators) => (animationName, componentName, animation, index) => {
  const {
    from: fromStyles,
    to: toStyles,
    stiffness,
    damping,
  } = animation;
  let startTime;
  if (!IS_PRODUCTION) {
    startTime = mutators.now();
  }

  mutators.createSpringMachine({
    animationName,
    componentName,
    damping,
    fromStyles,
    index,
    stiffness,
    toStyles,
  });
  mutators.createEndlessJobMachine({
    animationName,
    componentName,
    index,
  });

  if (!IS_PRODUCTION) {
    Recorder.reset(animationName);
  }

  const onNext = updatedStyles => {
    mutators.updateComponentStyles({ componentName, updatedStyles });

    if (!IS_PRODUCTION) {
      const updateStyles = state.styleUpdaters[componentName];
      const elapsedTime = mutators.now() - startTime;
      Recorder.record({ animationName, componentName, elapsedTime, updatedStyles, updateStyles });
    }
  }

  const onComplete = updatedStyles => {
    const isStopped = !state.animationCountdownMachines[animationName];
    if (isStopped) return;

    mutators.updateComponentStyles({ componentName, updatedStyles });
    mutators.stopEndlessJobMachine({ animationName, index, componentName });
    mutators.countdownAnimations({ animationName });
  }

  const job = () => {
    mutators.runNextSpringFrame({
      animationName,
      componentName,
      index,
      onComplete,
      onNext,
    });
  }

  mutators.registerEndlessJob({ animationName, index, componentName, job });
  mutators.startEndlessJobMachine({ animationName, index, componentName });
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
        `passing playAnimation directly into an event handler e.g.\n`,
        `    onClick={playAnimation}`,
        `\nbut that will pass in the event as the first argument, so you should`,
        `instead be calling playAnimation directly e.g.\n`,
        `    onClick={() => playAnimation()}`,
        `\n`,
      );
    }
  }

  // IMPROVE: It's weird that getNumPhases calls makeSequence internally, but
  // things are the way they are so the user does not need to write each
  // phase as a function - having this inefficiency makes the API nicer.
  const numPhases = getNumPhases(state)(animationName);

  if (!IS_PRODUCTION) {
    if (numPhases === 0) {
      throw makeError(
        `Attemped to run an empty animation sequence. Check <Animatronics/>`
        + ` or withAnimatronics and make sure youre're returning either an Array or`
        + ` an Object from the "animations" function. Here's what your`
        + ` function looks like right now:`
        + `\n`
        + `${ state.animations.toString() }`
      );
    }
  }

  mutators.createPhasesCountdownMachine({
    animationName,
    job: onComplete,
    numPhases,
  });

  const runPhase = (phaseIndex) => {
    const isStopped = !state.phasesCountdownMachines[animationName];
    if (isStopped) return;

    const sequence = makeSequence(state)(animationName);
    const phase = sequence[phaseIndex];
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

      const runAnimation = (animation, index) => {
        if (isUsingTime(animation)) {
          runTimedAnimation(state, mutators)(animationName, componentName, animation, index);
        } else if (isUsingSpring(animation)) {
          runSpringAnimation(state, mutators)(animationName, componentName, animation, index);
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

const stopMachinesForAnimation = (state) => (animationName) => {
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

const reset = (state, mutators) => () => {
  reducer.stopMachine();
  reducer.resetMachine(); // TODO
};

const registerComponent = (state, mutators) => (componentName, node, styleUpdater, styleResetter) => {
  mutators.registerComponent({
    componentName,
    node,
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
      fromStyles,
      index,
      stiffness,
      toStyles,
    } = action;
    const machine = machinist.makeSpringMachine(
      fromStyles,
      toStyles,
      stiffness,
      damping
    );
    // YUCK
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
    // YUCK
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
    // FIXME: don't use window directly
    return window.getComputedStyle(element);
  },

  now: () => {
    return machinist.now();
  },

  registerComponent: action => {
    const { componentName, node, styleUpdater, styleResetter } = action;
    debug('registering component %s %o', componentName, node);
    state.nodes[componentName] = node;
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

  stopMachine: action => {
    const { animationName } = action;

    if (!animationName) {
      Object.keys(state.phasesCountdownMachines).forEach(name => {
        stopMachinesForAnimation(state)(name);
      })
    } else {
       stopMachinesForAnimation(state)(animationName);
    }
  },

  stopEndlessJobMachine: action => {
    const { animationName, index, componentName } = action;
    state.endlessJobMachines[animationName][componentName][index].stop();
  },

  unregisterComponent: action => {
    const { componentName } = action;
    delete state.nodes[componentName];
    delete state.styleUpdaters[componentName];
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
    animations,
    nodes: {},
    styleUpdaters: {},
    styleResetters: {},
    timedJobMachines: {},
    springMachines: {},
    endlessJobMachines: {},
    timeouts: {},
    animationCountdownMachines: {},
    phasesCountdownMachines: {},
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
}
