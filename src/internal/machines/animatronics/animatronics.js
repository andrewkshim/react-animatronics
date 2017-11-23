import Debug from 'debug'

import { constructStyles } from '../../fashionistas/timed'

import {
  flatten,
  isUsingSpring,
  isUsingTime,
  makeError,
} from '../../utils'

import {
  DEFAULT_ANIMATION_NAME,
  IS_DEVELOPMENT,
  DEFAULT_EASING_FN,
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

  if (IS_DEVELOPMENT) {
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

  if (IS_DEVELOPMENT) {
    sequence.forEach(phase => throwIfPhaseNotValid(phase, nodes));
  }

  return sequence;
};

const getNumPhases = state => animationName => {
  const sequence = makeSequence(state)(animationName);
  return sequence.length;
};

const runTimedAnimation = reducers => (animationName, componentName, animation, index) => {
  const {
    from: fromStyles,
    to: toStyles,
    duration,
    easingFn = DEFAULT_EASING_FN,
  } = animation;

  reducers.createTimedJobMachine({
    index,
    componentName,
    duration,
  });

  const job = elapsedTime => {
    const progress = calculateEasingProgress(easingFn, duration, elapsedTime);
    const updatedStyles = constructStyles(fromStyles, toStyles, progress);
    reducers.updateComponentStyles({ componentName, updatedStyles });
  }

  const onCompleteJob = () => {
    reducers.updateComponentStyles({ componentName, toStyles });
    reducers.countdownAnimations({ animationName });
  }

  reducers.registerTimedJob({ index, componentName, job });
  reducers.registerTimedOnCompletedJob({ index, componentName, onCompleteJob });
  reducers.startTimedJob({ index, componentName });
};

const runSpringAnimation = reducers => (animationName, componentName, animation, index) => {
  const {
    from: fromStyles,
    to: toStyles,
    stiffness,
    damping,
  } = animation;

  reducers.createSpringMachine({
    index,
    componentName,
    fromStyles,
    toStyles,
    stiffness,
    damping,
  });
  reducers.createEndlessJobMachine({ index, componentName });

  const onNext = updatedStyles => {
    reducers.updateComponentStyles({ componentName, updatedStyles });
  }

  const onComplete = updatedStyles => {
    reducers.updateComponentStyles({ componentName, updatedStyles });
    reducers.stopEndlessJobMachine({ index, componentName });
    reducers.countdownAnimations({ animationName });
  }

  const job = () => {
    reducers.runNextSpringFrame({ index, componentName, onNext, onComplete });
  }

  reducers.registerEndlessJob({ index, componentName, job });
  reducers.startEndlessJobMachine({ index, componentName });
};

export const play = (state, reducers) => (animationName, onComplete) => {
  // IMPROVE: It's weird that getNumPhases calls makeSequence internally, but
  // things are the way they are so the user does not need to write each
  // phase as a function - having this inefficiency makes the API nicer.
  const numPhases = getNumPhases(state)(animationName);

  if (IS_DEVELOPMENT) {
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

  reducers.createPhasesCountdownMachine({
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
      reducers.countdownPhases({ animationName });
      if (phaseIndex < (numPhases - 1)) {
        runPhase(phaseIndex + 1);
      }
    }

    reducers.createAnimationCountdownMachine({
      animationName,
      job,
      numAnimations,
    });

    componentNames.forEach(componentName => {
      const rawAnimation = phase[componentName];
      const animations = Array.isArray(rawAnimation) ? rawAnimation : [rawAnimation];

      const runAnimation = (animation, index) => {
        if (isUsingTime(animation)) {
          runTimedAnimation(reducers)(animationName, componentName, animation, index);
        } else if (isUsingSpring(animation)) {
          runSpringAnimation(reducers)(animationName, componentName, animation, index);
        }
      };

      animations.forEach((animation, index) => {
        const { delay } = animation;
        if (delay == null) {
          runAnimation(animation, index);
        } else {
          reducers.runDelayedAnimation({ componentName, delay, runAnimation, animation, index });
        }
      });
    });
  }

  runPhase(0);
};

const stop = (state, reducers) => () => {
  reducers.stopMachine();
};

const reset = (state, reducers) => () => {
  reducer.stopMachine();
  reducer.resetMachine();
};

const registerComponent = (state, reducers) => (componentName, node, styleUpdater, styleResetter) => {
  reducers.registerComponent({
    componentName,
    node,
    styleUpdater,
    styleResetter,
  });
}

const unregisterComponent = (state, reducers) => componentName => {
  reducers.unregisterComponent({ componentName });
}

const setCreateAnimationSequences = (state, reducers) => createAnimationSequences => {
  reducers.setCreateAnimationSequences({
    createAnimationSequences,
  });
}

// EXPERIMENT: Isolating any shared state mutations here.
export const makeReducers = (machinist, state) => ({

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

  const reducers = makeReducers(machinist, state);

  const animatronicsMachine = {
    play: play(state, reducers),
    stop: stop(state, reducers),
    reset: reset(state, reducers),
    registerComponent: registerComponent(state, reducers),
    unregisterComponent: unregisterComponent(state, reducers),
    setCreateAnimationSequences: setCreateAnimationSequences(state, reducers),
  };

  return animatronicsMachine;
}
