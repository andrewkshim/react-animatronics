import BezierEasing from 'bezier-easing'
import Debug from 'debug'

import Constants from '../constants'
import { constructStyles } from '../fashionistas/timed-fashionista'
import { IS_DEVELOPMENT, makeError } from '../utils'

const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);

const debug = Debug('react-animatronics:machines:animatronics');

const isUsingTime = (animation: Object): boolean =>
  animation.duration != null;

const isUsingSpring = (animation: Object): boolean =>
  animation.stiffness != null && animation.damping != null;

export const calculateEasingProgress = (
  easingFn: Function,
  duration: number,
  elapsedTime: number,
): number => (
  easingFn(elapsedTime / (duration === 0 ? elapsedTime : duration))
);

export const makeSequence = state => animationName => {
  const { createAnimationSequences, nodes } = state;
  const sequences = createAnimationSequences(nodes);
  const namedSequences = Array.isArray(sequences)
    ? { [Constants.DEFAULT_ANIMATION_NAME]: sequences }
    : sequences;
  const sequence = namedSequences[animationName];

  // TODO: uncomment below
  //if (IS_DEVELOPMENT) {
    //sequence.forEach(phase => throwIfPhaseNotValid(phase, nodes));
  //}

  return sequence;
};

const getNumPhases = state => animationName => {
  const sequence = makeSequence(state)(animationName);
  return sequence.length;
};

const runTimedAnimation = dispatch => (componentName, animation) => {
  const {
    start: startStyles,
    end: endStyles,
    duration,
    easingFn = DEFAULT_EASING_FN,
  } = animation;

  dispatch({
    type: 'CREATE_TIMED_JOB_MACHINE',
    componentName,
    duration,
  });

  dispatch({
    type: 'REGISTER_TIMED_JOB',
    componentName,
    job: elapsedTime => {
      const progress = calculateEasingProgress(easingFn, duration, elapsedTime);
      const updatedStyles = constructStyles(startStyles, endStyles, progress);
      dispatch({
        type: 'UPDATE_COMPONENT_STYLES',
        componentName,
        styles: updatedStyles,
      });
    }
  });

  dispatch({
    type: 'REGISTER_TIMED_ON_COMPLETED_JOB',
    componentName,
    job: () => {
      dispatch({
        type: 'UPDATE_COMPONENT_STYLES',
        componentName,
        styles: endStyles,
      });
      dispatch({ type: 'COUNTDOWN_COMPONENTS' });
    }
  });

  dispatch({
    type: 'START_TIMED_JOB',
    componentName,
  });
};

const runSpringAnimation = dispatch => (componentName, animation) => {
  const {
    start: startStyles,
    end: endStyles,
    stiffness,
    damping,
  } = animation;

  dispatch({
    type: 'CREATE_SPRING_MACHINE',
    componentName,
    startStyles,
    endStyles,
    stiffness,
    damping,
  });

  dispatch({
    type: 'CREATE_ENDLESS_JOB_MACHINE',
    componentName,
  });

  dispatch({
    type: 'REGISTER_ENDLESS_JOB',
    componentName,
    job: () => {
      dispatch({
        type: 'RUN_NEXT_SPRING_FRAME',
        componentName,
        onNext: updatedStyles => {
          dispatch({
            type: 'UPDATE_COMPONENT_STYLES',
            componentName,
            styles: updatedStyles,
          });
        },
        onComplete: updatedStyles => {
          dispatch({
            type: 'UPDATE_COMPONENT_STYLES',
            componentName,
            styles: updatedStyles,
          });
          dispatch({
            type: 'STOP_ENDLESS_JOB_MACHINE',
            componentName,
          });
          dispatch({ type: 'COUNTDOWN_COMPONENTS' });
        }
      });
    }
  });

  dispatch({
    type: 'START_ENDLESS_JOB_MACHINE',
    componentName,
  });
};

export const play = (state, dispatch) => (animationName, onComplete) => {
  // IMPROVE: It's weird that getNumPhases calls makeSequence internally, but
  // things are the way they are so the user does not need to write each
  // phase as a function - having this inefficiency makes the API nicer.
  const numPhases = getNumPhases(state, dispatch)(animationName);

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

  dispatch({
    type: 'CREATE_PHASES_COUNTDOWN_MACHINE',
    numPhases,
    job: onComplete,
  });

  const runPhase = (phaseIndex) => {
    const sequence = makeSequence(state, dispatch)(animationName);
    const phase = sequence[phaseIndex];
    const componentNames = Object.keys(phase);

    dispatch({
      type: 'CREATE_COMPONENTS_COUNTDOWN_MACHINE',
      numComponents: componentNames.length,
      job: () => {
        dispatch({ type: 'COUNTDOWN_PHASES' });
        if (phaseIndex < (numPhases - 1)) {
          runPhase(phaseIndex + 1);
        }
      }
    });

    componentNames.forEach(componentName => {
      const animation = phase[componentName];
      if (!animation.delay) {
        if (isUsingTime(animation)) {
          runTimedAnimation(dispatch)(componentName, animation);
        } else if (isUsingSpring(animation)) {
          runSpringAnimation(dispatch)(componentName, animation);
        }
      } else {
        dispatch({
          type: 'RUN_DELAYED_ANIMATION',
          componentName,
          delay: animation.delay,
          job: () => {
            if (isUsingTime(animation)) {
              runTimedAnimation(dispatch)(componentName, animation);
            } else if (isUsingSpring(animation)) {
              runSpringAnimation(dispatch)(componentName, animation);
            }
          }
        });
      }
    });
  }

  runPhase(0);
};

const stop = (state, dispatch) => () => {
  dispatch({ type: 'STOP_MACHINE' });
};

const registerComponent = (state, dispatch) => (componentName, node, styleUpdater) => {
  dispatch({
    type: 'REGISTER_COMPONENT',
    componentName,
    node,
    styleUpdater,
  });
}

const unregisterComponent = (state, dispatch) => componentName => {
  dispatch({
    type: 'UNREGISTER_COMPONENT',
    componentName,
  });
}

const setCreateAnimationSequences = (state, dispatch) => createAnimationSequences => {
  dispatch({
    type: 'SET_CREATE_ANIMATION_SEQUENCES',
    createAnimationSequences,
  });
}

export const makeReducers = machinist => ({
  CREATE_SPRING_MACHINE: (state, action) => {
    const { componentName, startStyles, endStyles, stiffness, damping } = action;
    const machine = machinist.makeSpringMachine(
      startStyles,
      endStyles,
      stiffness,
      damping
    );
    state.springMachines[componentName] = machine;
  },
  CREATE_ENDLESS_JOB_MACHINE: (state, action) => {
    const { componentName } = action;
    const machine = machinist.makeEndlessJobMachine(
      state.requestAnimationFrame,
      state.cancelAnimationFrame
    );
    state.endlessJobMachines[componentName] = machine;
  },
  CREATE_COMPONENTS_COUNTDOWN_MACHINE: (state, action) => {
    const { numComponents, job } = action;
    const machine = machinist.makeCountdownJobMachine(numComponents);
    machine.registerJob(job);
    state.componentCountdownMachine = machine;
  },
  CREATE_PHASES_COUNTDOWN_MACHINE: (state, action) => {
    const { numPhases, job } = action;
    const machine = machinist.makeCountdownJobMachine(numPhases);
    machine.registerJob(job);
    state.phasesCountdownMachine = machine;
  },
  CREATE_TIMED_JOB_MACHINE: (state, action) => {
    const { componentName, duration } = action;
    const machine = machinist.makeTimedJobMachine(
      duration,
      state.requestAnimationFrame,
      state.cancelAnimationFrame,
      state.now,
    );
    state.timedJobMachines[componentName] = machine;
  },
  COUNTDOWN_COMPONENTS: (state, action) => {
    state.componentCountdownMachine.countdown();
  },
  COUNTDOWN_PHASES: (state, action) => {
    state.phasesCountdownMachine.countdown();
  },
  REGISTER_COMPONENT: (state, action) => {
    const { componentName, node, styleUpdater } = action;
    debug('registering component %s %o', componentName, node);
    state.nodes[componentName] = node;
    state.styleUpdaters[componentName] = styleUpdater;
  },
  REGISTER_ENDLESS_JOB: (state, action) => {
    const { componentName, job } = action;
    state.endlessJobMachines[componentName].registerJob(job);
  },
  REGISTER_TIMED_JOB: (state, action) => {
    const { componentName, job } = action;
    state.timedJobMachines[componentName].registerJob(job);
  },
  REGISTER_TIMED_ON_COMPLETED_JOB: (state, action) => {
    const { componentName, job } = action;
    state.timedJobMachines[componentName].registerOnCompleteJob(job);
  },
  RUN_NEXT_SPRING_FRAME: (state, action) => {
    const { componentName, onNext, onComplete } = action;
    state.springMachines[componentName].runNextFrame(onNext, onComplete);
  },
  RUN_DELAYED_ANIMATION: (state, action) => {
    const { componentName, delay, job } = action;
    state.timeouts[componentName] = state.setTimeout(job, delay);
  },
  SET_CREATE_ANIMATION_SEQUENCES: (state, action) => {
    const { createAnimationSequences } = action;
    state.createAnimationSequences = createAnimationSequences;
  },
  START_TIMED_JOB: (state, action) => {
    const { componentName } = action;
    state.timedJobMachines[componentName].start();
  },
  START_ENDLESS_JOB_MACHINE: (state, action) => {
    debug('starting endless job machine i.e. spring %O', action);
    const { componentName } = action;
    state.endlessJobMachines[componentName].start();
  },
  STOP_MACHINE: (state, action) => {
    const { job } = action;
    Object.values(state.timedJobMachines).forEach(machine => machine.stop());
    Object.values(state.timeouts).forEach(timeout => state.clearTimeout(timeout));
    state.timedJobMachines = {};
    state.timeouts = {};
  },
  STOP_ENDLESS_JOB_MACHINE: (state, action) => {
    const { componentName } = action;
    state.endlessJobMachines[componentName].stop();
  },
  UNREGISTER_COMPONENT: (state, action) => {
    const { componentName } = action;
    delete state.nodes[componentName];
    delete state.styleUpdaters[componentName];
  },
  UPDATE_COMPONENT_STYLES: (state, action) => {
    const { componentName, styles } = action;
    const updateStyles = state.styleUpdaters[componentName];
    if (updateStyles) {
      updateStyles(styles);
    }
  }
});

export const makeAnimatronicsMachine = machinist => (
  createAnimationSequences,
  requestAnimationFrame,
  cancelAnimationFrame,
  now,
  setTimeout,
  clearTimeout,
) => {
  const state = {
    nodes: {},
    styleUpdaters: {},
    timedJobMachines: {},
    springMachines: {},
    endlessJobMachines: {},
    timeouts: {},
    componentCountdownMachine: null,
    phasesCountdownMachine: null,
    createAnimationSequences,
    requestAnimationFrame,
    cancelAnimationFrame,
    now,
    setTimeout,
    clearTimeout,
  };

  const reducers = makeReducers(machinist);

  const dispatch = action => {
    const { type } = action;
    reducers[type](state, action);
  };

  const animatronicsMachine = {
    play: play(state, dispatch),
    stop: stop(state, dispatch),
    registerComponent: registerComponent(state, dispatch),
    unregisterComponent: unregisterComponent(state, dispatch),
    setCreateAnimationSequences: setCreateAnimationSequences(state, dispatch),
  };

  return animatronicsMachine;
}
