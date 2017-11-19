import BezierEasing from 'bezier-easing'
import Debug from 'debug'

import { constructStyles } from '../fashionistas/timed'
import { makeError, flatten } from '../utils'

import {
  DEFAULT_ANIMATION_NAME,
  IS_DEVELOPMENT,
} from '../constants'

const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);

const debug = Debug('react-animatronics:machines:animatronics');

const stringify = obj => JSON.stringify(obj, null, 2);

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
  } else if (animation.duration == null && animation.stiffness == null) {
    throw makeError(
      `You declared an animation with neither a 'duration' or 'stiffness':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `You must specify one or the other.`
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
  } else if (animation.from != null && animation.to == null) {
    throw makeError(
      `You declared an animation with a 'from' but not an 'to':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `Animations must always have an 'to'. They, unlike people, should`,
      `always know where life is going to take them.`
    );
  } else if (animation.from == null && animation.to != null) {
    throw makeError(
      `You declared an animation with an 'to' but not a 'from':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `Animations must always have a 'from'. They, unlike chickens or eggs,`,
      `should know exactly where the beginning is.`
    );
  } else if (animation.from != null && typeof animation.from !== 'object') {
    throw makeError(
      `You declared an animation with an invalid 'from':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'from' must always be a plain object.`
    );
  } else if (animation.to != null && typeof animation.to !== 'object') {
    throw makeError(
      `You declared an animation with an invalid 'to':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'to' must always be a plain object.`
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
    if (Array.isArray(animation)) {
      animation.forEach(throwIfAnimationNotValid);
    } else {
      throwIfAnimationNotValid(animation);
    }
  });
}

export const makeSequence = state => animationName => {
  const { createAnimationSequences, nodes } = state;
  const sequences = createAnimationSequences(nodes);
  const namedSequences = Array.isArray(sequences)
    ? { [DEFAULT_ANIMATION_NAME]: sequences }
    : sequences;
  const sequence = namedSequences[animationName];

  if (IS_DEVELOPMENT) {
    sequence.forEach(phase => throwIfPhaseNotValid(phase, nodes));
  }

  return sequence;
};

const getNumPhases = state => animationName => {
  const sequence = makeSequence(state)(animationName);
  return sequence.length;
};

const runTimedAnimation = dispatch => (
  animationName,
  componentName,
  animation,
  index,
) => {
  const {
    from: fromStyles,
    to: toStyles,
    duration,
    easingFn = DEFAULT_EASING_FN,
  } = animation;

  dispatch({
    type: 'CREATE_TIMED_JOB_MACHINE',
    index,
    componentName,
    duration,
  });

  dispatch({
    type: 'REGISTER_TIMED_JOB',
    index,
    componentName,
    job: elapsedTime => {
      const progress = calculateEasingProgress(easingFn, duration, elapsedTime);
      const updatedStyles = constructStyles(fromStyles, toStyles, progress);
      dispatch({
        type: 'UPDATE_COMPONENT_STYLES',
        componentName,
        styles: updatedStyles,
      });
    }
  });

  dispatch({
    type: 'REGISTER_TIMED_ON_COMPLETED_JOB',
    index,
    componentName,
    job: () => {
      dispatch({
        type: 'UPDATE_COMPONENT_STYLES',
        componentName,
        styles: toStyles,
      });
      dispatch({
        type: 'COUNTDOWN_ANIMATIONS',
        animationName,
      });
    }
  });

  dispatch({
    type: 'START_TIMED_JOB',
    index,
    componentName,
  });
};

const runSpringAnimation = dispatch => (
  animationName,
  componentName,
  animation,
  index,
) => {
  const {
    from: fromStyles,
    to: toStyles,
    stiffness,
    damping,
  } = animation;

  dispatch({
    type: 'CREATE_SPRING_MACHINE',
    index,
    componentName,
    fromStyles,
    toStyles,
    stiffness,
    damping,
  });

  dispatch({
    type: 'CREATE_ENDLESS_JOB_MACHINE',
    index,
    componentName,
  });

  dispatch({
    type: 'REGISTER_ENDLESS_JOB',
    index,
    componentName,
    job: () => {
      dispatch({
        type: 'RUN_NEXT_SPRING_FRAME',
        index,
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
            index,
            componentName,
          });
          dispatch({
            type: 'COUNTDOWN_ANIMATIONS',
            animationName,
          });
        }
      });
    }
  });

  dispatch({
    type: 'START_ENDLESS_JOB_MACHINE',
    index,
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
    animationName,
    job: onComplete,
    numPhases,
  });

  const runPhase = (phaseIndex) => {
    const sequence = makeSequence(state, dispatch)(animationName);
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

    dispatch({
      type: 'CREATE_ANIMATION_COUNTDOWN_MACHINE',
      numAnimations,
      animationName,
      job: () => {
        dispatch({
          type: 'COUNTDOWN_PHASES',
          animationName,
        });
        if (phaseIndex < (numPhases - 1)) {
          runPhase(phaseIndex + 1);
        }
      }
    });

    componentNames.forEach(componentName => {
      const rawAnimation = phase[componentName];
      const animations = Array.isArray(rawAnimation) ? rawAnimation : [rawAnimation];
      animations.forEach((animation, index) => {
        if (!animation.delay) {
          if (isUsingTime(animation)) {
            runTimedAnimation(dispatch)(
              animationName,
              componentName,
              animation,
              index
            );
          } else if (isUsingSpring(animation)) {
            runSpringAnimation(dispatch)(
              animationName,
              componentName,
              animation,
              index
            );
          }
        } else {
          dispatch({
            type: 'RUN_DELAYED_ANIMATION',
            componentName,
            delay: animation.delay,
            job: () => {
              if (isUsingTime(animation)) {
                runTimedAnimation(dispatch)(
                  animationName,
                  componentName,
                  animation,
                  index
                );
              } else if (isUsingSpring(animation)) {
                runSpringAnimation(dispatch)(
                  animationName,
                  componentName,
                  animation,
                  index
                );
              }
            }
          });
        }
      });
    });
  }

  runPhase(0);
};

const stop = (state, dispatch) => () => {
  dispatch({ type: 'STOP_MACHINE' });
};

const reset = (state, dispatch) => () => {
  dispatch({ type: 'STOP_MACHINE' });
  dispatch({ type: 'RESET_MACHINE' });
};

const registerComponent = (state, dispatch) => (componentName, node, styleUpdater, styleResetter) => {
  dispatch({
    type: 'REGISTER_COMPONENT',
    componentName,
    node,
    styleUpdater,
    styleResetter,
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
  CREATE_ENDLESS_JOB_MACHINE: (state, action) => {
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
  CREATE_ANIMATION_COUNTDOWN_MACHINE: (state, action) => {
    const { numAnimations, job, animationName } = action;
    const machine = machinist.makeCountdownJobMachine(numAnimations);
    machine.registerJob(job);
    state.animationCountdownMachines[animationName] = machine;
  },
  CREATE_PHASES_COUNTDOWN_MACHINE: (state, action) => {
    const { numPhases, job, animationName } = action;
    const machine = machinist.makeCountdownJobMachine(numPhases);
    machine.registerJob(job);
    state.phasesCountdownMachines[animationName] = machine;
  },
  CREATE_TIMED_JOB_MACHINE: (state, action) => {
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
  COUNTDOWN_ANIMATIONS: (state, action) => {
    const { animationName } = action;
    state.animationCountdownMachines[animationName].countdown();
  },
  COUNTDOWN_PHASES: (state, action) => {
    const { animationName } = action;
    state.phasesCountdownMachines[animationName].countdown();
  },
  REGISTER_COMPONENT: (state, action) => {
    const { componentName, node, styleUpdater, styleResetter } = action;
    debug('registering component %s %o', componentName, node);
    state.nodes[componentName] = node;
    state.styleUpdaters[componentName] = styleUpdater;
    state.styleResetters[componentName] = styleResetter;
  },
  REGISTER_ENDLESS_JOB: (state, action) => {
    const { index, componentName, job } = action;
    state.endlessJobMachines[componentName][index].registerJob(job);
  },
  REGISTER_TIMED_JOB: (state, action) => {
    const { index, componentName, job } = action;
    state.timedJobMachines[componentName][index].registerJob(job);
  },
  REGISTER_TIMED_ON_COMPLETED_JOB: (state, action) => {
    const { index, componentName, job } = action;
    state.timedJobMachines[componentName][index].registerOnCompleteJob(job);
  },
  RESET_MACHINE: (state, action) => {
    Object.keys(state.styleResetters).map(componentName => {
      state.styleResetters[componentName]();
    });
  },
  RUN_NEXT_SPRING_FRAME: (state, action) => {
    const {
      index,
      componentName,
      onNext,
      onComplete,
    } = action;
    state.springMachines[componentName][index].runNextFrame(onNext, onComplete);
  },
  RUN_DELAYED_ANIMATION: (state, action) => {
    const { componentName, delay, job } = action;
    state.timeouts[componentName] = machinist.setTimeout(job, delay);
  },
  SET_CREATE_ANIMATION_SEQUENCES: (state, action) => {
    const { createAnimationSequences } = action;
    debug('setting updated createAnimationSequences %s', createAnimationSequences);
    state.createAnimationSequences = createAnimationSequences;
  },
  START_TIMED_JOB: (state, action) => {
    const { index, componentName } = action;
    state.timedJobMachines[componentName][index].start();
  },
  START_ENDLESS_JOB_MACHINE: (state, action) => {
    debug('starting endless job machine i.e. spring %O', action);
    const { index, componentName } = action;
    state.endlessJobMachines[componentName][index].start();
  },
  STOP_MACHINE: (state, action) => {
    flatten(Object.values(state.timedJobMachines))
      .forEach(machine => machine.stop());
    Object.values(state.timeouts)
      .forEach(timeout => machinist.clearTimeout(timeout));
    state.timedJobMachines = {};
    state.timeouts = {};
  },
  STOP_ENDLESS_JOB_MACHINE: (state, action) => {
    const { index, componentName } = action;
    state.endlessJobMachines[componentName][index].stop();
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

  const reducers = makeReducers(machinist);

  const dispatch = action => {
    const { type } = action;
    reducers[type](state, action);
  };

  const animatronicsMachine = {
    play: play(state, dispatch),
    stop: stop(state, dispatch),
    reset: reset(state, dispatch),
    registerComponent: registerComponent(state, dispatch),
    unregisterComponent: unregisterComponent(state, dispatch),
    setCreateAnimationSequences: setCreateAnimationSequences(state, dispatch),
  };

  return animatronicsMachine;
}
