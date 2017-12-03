import lolex from 'lolex'
import sinon from 'sinon'

import {
  calculateEasingProgress,
  checkHasUniqueTransforms,
  makeAnimatronicsMachine,
  makeMutators,
  makeAnimation,
  mergeStringTransforms,
  normalizeCombinedTransforms,
  playAnimation,
  promisifyIfCallback,
  reset,
  runTimedAnimation,
  stopMachinesForAnimation,
} from './animatronics'

import { makeTimedJobMachine } from '../timed-job'

import {
  DEFAULT_ANIMATION_NAME,
} from '../../constants'

import {
  heightAnimationFrames,
  transformAnimationFrames,
  boxShadowAnimationFrames,
} from './fixtures'

test('machines/animatronics/calculateEasingProgress', () => {
  expect(calculateEasingProgress(x => x, 500, 250)).toBe(0.5);
  expect(calculateEasingProgress(x => x, 0, 250)).toBe(1.0);
});

describe('makeAnimation', () => {

  test('should take an "animations" array and return the sequence array', () => {
    expect(
      makeAnimation({
        animations: [{
          circle: {
            duration: 500,
            from: { left: '100px' },
            to: { left: '200px' },
          }
        }],
        nodes: { circle: {} },
      })(DEFAULT_ANIMATION_NAME)
    ).toEqual(
      [{
        circle: {
          duration: 500,
          from: { left: '100px' },
          to: { left: '200px' },
        }
      }]
    );
  });

  test('should take an "animations" object and return the sequence array', () => {
    expect(
      makeAnimation({
        animations: {
          'myAnimation': [{
            circle: {
              duration: 500,
              from: { left: '100px' },
              to: { left: '200px' },
            }
          }]
        },
        nodes: { circle: {} },
      })('myAnimation')
    ).toEqual(
      [{
        circle: {
          duration: 500,
          from: { left: '100px' },
          to: { left: '200px' },
        }
      }]
    );
  });

  test('should take dynamic "animations" and return the sequence array', () => {
    expect(
      makeAnimation({
        animations: () => [{
          circle: {
            duration: 500,
            from: { left: '100px' },
            to: { left: '200px' },
          }
        }],
        nodes: { circle: {} },
      })(DEFAULT_ANIMATION_NAME)
    ).toEqual(
      [{
        circle: {
          duration: 500,
          from: { left: '100px' },
          to: { left: '200px' },
        }
      }]
    );

    expect(
      makeAnimation({
        animations: {
          hello: () => [{
            circle: {
              duration: 500,
              from: { left: '100px' },
              to: { left: '200px' },
            }
          }]
        },
        nodes: { circle: {} },
      })('hello')
    ).toEqual(
      [{
        circle: {
          duration: 500,
          from: { left: '100px' },
          to: { left: '200px' },
        }
      }]
    );
  });

  test('should pass in the nodes for unnamed animations', () => {
    makeAnimation({
      animations: ({ circle }) => {
        expect(circle).toEqual({ message: 'foobar' });
        return [];
      },
      nodes: { circle: { message: 'foobar' } },
    })(DEFAULT_ANIMATION_NAME);
  });

  test('should pass in the nodes for named animations', () => {
    makeAnimation({
      animations: {
        hey: ({ circle }) => {
          expect(circle).toEqual({ message: 'hey hey' });
          return [];
        }
      },
      nodes: { circle: { message: 'hey hey' } },
    })('hey');
  });

  test('should throw when running a named animation that is not declared', () => {
    expect(() => {
      makeAnimation({
        animations: () => ({
          foo: [],
          bar: [],
        }),
        nodes: {},
      })('woo')
    }).toThrow(/there is no such named animation/);
  });

});

describe('makeMutators', () => {

  const animationName = 'foobar';

  const machinist = {
    makeCountdownJobMachine: () => {
      return { registerJob: () => {} };
    },
    makeTimedJobMachine: () => {
      return { registerJob: () => {} };
    }
  };

  const state = {
    animationCountdownMachines: {},
    endlessJobMachines: {},
    phasesCountdownMachines: {},
    springMachines: {},
    timedJobMachines: {},
    timeouts: {},
  };

  const mutators = makeMutators(machinist, state);

  test('createAnimationCountdownMachine', () => {
    mutators.createAnimationCountdownMachine({
      numAnimations: 4,
      job: () => {},
      animationName,
    });
    expect(state.animationCountdownMachines.foobar).toBeTruthy();
  });

  test('createPhasesCountdownMachine', () => {
    mutators.createPhasesCountdownMachine({
      numPhases: 3,
      job: () => {},
      animationName,
    });
    expect(state.phasesCountdownMachines.foobar).toBeTruthy();
  });

  test('createTimedJobMachine', () => {
    mutators.createTimedJobMachine({
      animationName: 'foo',
      componentName: 'bar',
      duration: 400,
    });
    expect(state.timedJobMachines.foo.bar).toBeTruthy();
  });

  test('stopMachine', () => {
    expect(() => {
      mutators.stopMachine();
    }).not.toThrow();
  });

});

const runTimedAnimationMocked = animation => {
  let timedJobMachine;
  const animationName = 'hi';
  const componentName = 'foobar';
  const index = 0;
  const frames = [];

  const clock = lolex.createClock();
  const machinist = {};
  const state = {
    animationCountdownMachines: { hi: true },
    nodes: { foobar: { style: {} } },
    styleUpdaters: {},
  };
  const mutators = {
    createTimedJobMachine: ({ duration }) => {
      timedJobMachine = makeTimedJobMachine(machinist)(
        duration,
        callback => clock.setTimeout(callback, 10),
        clock.clearTimeout,
        clock.Date.now
      );
    },
    updateComponentStyles: ({ updatedStyles }) => {
      frames.push(updatedStyles);
    },
    countdownAnimations: () => {},
    registerTimedJob: ({ job }) => {
      timedJobMachine.registerJob(job);
    },
    registerTimedOnCompletedJob: ({ onCompleteJob }) => {
      timedJobMachine.registerOnCompleteJob(onCompleteJob);
    },
    startTimedJob: () => {
      timedJobMachine.start();
    },
    getComputedStyle: element => element.style,
  };

  runTimedAnimation(state, mutators)(
    animationName,
    componentName,
    animation,
    index,
  );

  clock.runAll();

  return frames;
}

test('runTimedAnimation', () => {
  expect(runTimedAnimationMocked({
    from: { height: '10px' },
    to: { height: '100px' },
    duration: 200,
  })).toEqual(heightAnimationFrames);

  expect(
    runTimedAnimationMocked({
      from: { transform: 'translate(0px, 0rem)' },
      to: { transform: 'translate(100px, 20rem)' },
      duration: 200,
    })
  ).toEqual(transformAnimationFrames);

  expect(
    runTimedAnimationMocked({
      from: { boxShadow: '0px 0px blue' },
      to: { boxShadow: '10px 20px red' },
      duration: 200,
    })
  ).toEqual(boxShadowAnimationFrames);
});

test('playAnimation', () => {
  expect.assertions(2);

  expect(() => {
    playAnimation()({}, () => {});
  }).toThrow(/expects its first argument to be a string/);

  playAnimation()({}).catch(e => {
    expect(e.message).toMatch(/expects its first argument to be a string/);
  })
});

test('promisifyIfCallback', () => {
  expect.assertions(3);

  const fn = (a, callback) => callback(a);
  const wrapped = promisifyIfCallback(fn);
  expect(wrapped().then).toBeTruthy();
  expect(wrapped('hello', a => {})).toBe(undefined);

  const fnThatThrows = (a, callback) => { throw new Error('foobar') };
  const wrappedThrower = promisifyIfCallback(fnThatThrows);
  wrappedThrower('hello').catch(e => {
    expect(e.message).toBe('foobar');
  })
});

test('stopMachinesForAnimation', () => {
  const animationName = 'foobar';
  const timeout = 42;
  const clearTimeout = jest.fn();
  const stop = jest.fn();

  const machinist = { clearTimeout };

  const state = {
    animationCountdownMachines: { [animationName]: [] },
    endlessJobMachines: { [animationName]: [[{ stop }]] },
    phasesCountdownMachines: { [animationName]: [] },
    springMachines: { [animationName]: [] },
    timedJobMachines: { [animationName]: [[{ stop }]] },
    timeouts: { [animationName]: [timeout] },
  };

  stopMachinesForAnimation(machinist, state)(animationName);
  expect(stop).toHaveBeenCalledTimes(2);
  expect(clearTimeout).toHaveBeenCalledWith(timeout);
  expect(state).toEqual({
    animationCountdownMachines: { [animationName]: null },
    endlessJobMachines: { [animationName]: null },
    phasesCountdownMachines: { [animationName]: null },
    springMachines: { [animationName]: null },
    timedJobMachines: { [animationName]: null },
    timeouts: { [animationName]: null },
  });
});

test('reset', () => {
  const state = {};
  const mutators = {
    stopMachine: jest.fn(),
    resetMachine: jest.fn(),
  };
  expect(reset(state, mutators)).not.toThrow();
  expect(mutators.stopMachine).toHaveBeenCalledTimes(1);
  expect(mutators.resetMachine).toHaveBeenCalledTimes(1);
});

describe('checkHasUniqueTransforms', () => {

  test('should identify when animations do not have unique transforms', () => {
    const animations = [
      { from: { transform: 'scale(1)' } },
      { from: { transform: 'scale(0)' } },
    ];
    expect(checkHasUniqueTransforms(animations)).toBe(false);
  });

  test('should identify when animations have unique transforms', () => {
    const animations = [
      { from: { transform: 'scale(1)' } },
      { from: { transform: 'translateX(0rem)' } },
    ];
    expect(checkHasUniqueTransforms(animations)).toBe(true);
  });

  test('should identify animations with no transforms', () => {
    const animations = [
      { from: { left: '0px' } },
      { from: { right: '100px' } },
    ];
    expect(checkHasUniqueTransforms(animations)).toBe(false);
  });

});

test('mergeStringTransforms', () => {
  const animations = [
    { to: { transform: 'scale(0)' } },
    { to: { transform: 'translateX(100px)' } },
  ];
  expect(mergeStringTransforms(animations)).toBe('scale(0) translateX(100px)');
});

