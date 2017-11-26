import Debug from 'debug'

import { constructStyles } from '../../fashionistas/timed'
import Recorder from '../../recorder'

import {
  flatten,
  isUsingSpring,
  isUsingTime,
  makeError,
} from '../../utils'

import {
  DEFAULT_ANIMATION_NAME,
  DEFAULT_EASING_FN,
  IS_PRODUCTION,
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
  const { createAnimationSequences, nodes } = state;
  const areSequencesStatic = typeof createAnimationSequences === 'function';

  const sequences = areSequencesStatic
    ? createAnimationSequences(nodes)
    : createAnimationSequences;

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

const runTimedAnimation = (state, mutators) => (animationName, componentName, animation, index) => {
  const {
    from: fromStyles,
    to: toStyles,
    duration,
    easingFn = DEFAULT_EASING_FN,
  } = animation;

  mutators.createTimedJobMachine({
    index,
    componentName,
    duration,
  });

  if (!IS_PRODUCTION) {
    Recorder.reset(animationName);
  }

  const job = elapsedTime => {
    const progress = calculateEasingProgress(easingFn, duration, elapsedTime);
    const updatedStyles = constructStyles(fromStyles, toStyles, progress);
    mutators.updateComponentStyles({ componentName, updatedStyles });

    if (!IS_PRODUCTION) {
      const updateStyles = state.styleUpdaters[componentName];
      Recorder.record({ animationName, componentName, elapsedTime, updatedStyles, updateStyles });
    }
  }

  const onCompleteJob = () => {
    mutators.updateComponentStyles({ componentName, toStyles });
    mutators.countdownAnimations({ animationName });
  }

  mutators.registerTimedJob({ index, componentName, job });
  mutators.registerTimedOnCompletedJob({ index, componentName, onCompleteJob });
  mutators.startTimedJob({ index, componentName });
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
    index,
    componentName,
    fromStyles,
    toStyles,
    stiffness,
    damping,
  });
  mutators.createEndlessJobMachine({ index, componentName });

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
    mutators.updateComponentStyles({ componentName, updatedStyles });
    mutators.stopEndlessJobMachine({ index, componentName });
    mutators.countdownAnimations({ animationName });
  }

  const job = () => {
    mutators.runNextSpringFrame({ index, componentName, onNext, onComplete });
  }

  mutators.registerEndlessJob({ index, componentName, job });
  mutators.startEndlessJobMachine({ index, componentName });
};

export const play = (state, mutators) => (animationName, onComplete) => {
  // IMPROVE: It's weird that getNumPhases calls makeSequence internally, but
  // things are the way they are so the user does not need to write each
  // phase as a function - having this inefficiency makes the API nicer.
  const numPhases = getNumPhases(state)(animationName);

  if (!IS_PRODUCTION) {
    if (numPhases === 0) {
      throw makeError(
        `Attemped to run an empty animation sequence. Check <Animatronics/>`
        + ` or withAnimatronics and make sure youre're returning either an Array or`
        + ` an Object from the "createAnimationSequences" function. Here's what your`
        + ` function looks like right now:`
        + `\n`
        + `${ state.createAnimationSequences.toString() }`
      );
    }
  }

  mutators.createPhasesCountdownMachine({
    animationName,
    job: onComplete,
    numPhases,
  });

  const runPhase = (phaseIndex) => {
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
          mutators.runDelayedAnimation({ componentName, delay, runAnimation, animation, index });
        }
      });
    });
  }

  runPhase(0);
};

const stop = (state, mutators) => () => {
  mutators.stopMachine();
};

const reset = (state, mutators) => () => {
  reducer.stopMachine();
  reducer.resetMachine();
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

const setCreateAnimationSequences = (state, mutators) => createAnimationSequences => {
  mutators.setCreateAnimationSequences({
    createAnimationSequences,
  });
}

// EXPERIMENT: Isolating any shared state mutations here.
export const makeMutators = (machinist, state) => ({

  createSpringMachine: action => {
    const {
      index,
      componentName,
      fromStyles,
      toStyles,
      stiffness,
      damping,
    } = action;
    const machine = machinist.makeSpringMachine(
      fromStyles,
      toStyles,
      stiffness,
      damping
    );
    if (!state.springMachines[componentName]) {
      state.springMachines[componentName] = [];
    }
    state.springMachines[componentName][index] = machine;
  },

  createEndlessJobMachine: action => {
    const { index, componentName } = action;
    const machine = machinist.makeEndlessJobMachine(
      machinist.requestAnimationFrame,
      machinist.cancelAnimationFrame
    );
    if (!state.endlessJobMachines[componentName]) {
      state.endlessJobMachines[componentName] = [];
    }
    state.endlessJobMachines[componentName][index] = machine;
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
    const { index, componentName, duration } = action;
    const machine = machinist.makeTimedJobMachine(
      duration,
      machinist.requestAnimationFrame,
      machinist.cancelAnimationFrame,
      machinist.now,
    );
    if (!state.timedJobMachines[componentName]) {
      state.timedJobMachines[componentName] = [];
    }
    state.timedJobMachines[componentName][index] = machine;
  },

  countdownAnimations: action => {
    const { animationName } = action;
    state.animationCountdownMachines[animationName].countdown();
  },

  countdownPhases: action => {
    const { animationName } = action;
    state.phasesCountdownMachines[animationName].countdown();
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
    const { index, componentName, job } = action;
    state.endlessJobMachines[componentName][index].registerJob(job);
  },

  registerTimedJob: action => {
    const { index, componentName, job } = action;
    state.timedJobMachines[componentName][index].registerJob(job);
  },

  registerTimedOnCompletedJob: action => {
    const { index, componentName, onCompleteJob } = action;
    state.timedJobMachines[componentName][index].registerOnCompleteJob(onCompleteJob);
  },

  resetMachine: action => {
    Object.keys(state.styleResetters).map(componentName => {
      state.styleResetters[componentName]();
    });
  },

  runNextSpringFrame: action => {
    const {
      index,
      componentName,
      onNext,
      onComplete,
    } = action;
    state.springMachines[componentName][index].runNextFrame(onNext, onComplete);
  },

  runDelayedAnimation: action => {
    const { componentName, delay, runAnimation, animation, index } = action;
    state.timeouts[componentName] = machinist.setTimeout(
      () => runAnimation(animation, index),
      delay
    );
  },

  setCreateAnimationSequences: action => {
    const { createAnimationSequences } = action;
    debug('setting updated createAnimationSequences %s', createAnimationSequences);
    state.createAnimationSequences = createAnimationSequences;
  },

  startTimedJob: action => {
    const { index, componentName } = action;
    state.timedJobMachines[componentName][index].start();
  },

  startEndlessJobMachine: action => {
    debug('starting endless job machine i.e. spring %O', action);
    const { index, componentName } = action;
    state.endlessJobMachines[componentName][index].start();
  },

  stopMachine: action => {
    flatten(Object.values(state.timedJobMachines))
      .forEach(machine => machine.stop());
    Object.values(state.timeouts)
      .forEach(timeout => machinist.clearTimeout(timeout));
    state.timedJobMachines = {};
    state.timeouts = {};
  },

  stopEndlessJobMachine: action => {
    const { index, componentName } = action;
    state.endlessJobMachines[componentName][index].stop();
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

export const makeAnimatronicsMachine = machinist => createAnimationSequences => {
  const state = {
    nodes: {},
    styleUpdaters: {},
    styleResetters: {},
    timedJobMachines: {},
    springMachines: {},
    endlessJobMachines: {},
    timeouts: {},
    animationCountdownMachines: {},
    phasesCountdownMachines: {},
    createAnimationSequences,
  };

  const mutators = makeMutators(machinist, state);

  const animatronicsMachine = {
    play: play(state, mutators),
    stop: stop(state, mutators),
    reset: reset(state, mutators),
    registerComponent: registerComponent(state, mutators),
    unregisterComponent: unregisterComponent(state, mutators),
    setCreateAnimationSequences: setCreateAnimationSequences(state, mutators),
  };

  return animatronicsMachine;
}
