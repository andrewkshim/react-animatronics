import lolex from 'lolex'
import sinon from 'sinon'

import {
  calculateEasingProgress,
  makeMutators,
  makeSequence,
  playAnimation,
  runTimedAnimation,
  makeAnimatronicsMachine,
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

test('machines/animatronics/makeSequence', () => {
  expect(
    makeSequence(
      {
        animations: () => ({
          hello: [
            {
              circle: {
                duration: 500,
                from: { left: '100px' },
                to: { left: '200px' },
              }
            }
          ]
        }),
        nodes: { circle: {} },
      }
    )('hello')
  ).toEqual(
    [
      {
        circle: {
          duration: 500,
          from: { left: '100px' },
          to: { left: '200px' },
        }
      }
    ]
  );

  makeSequence(
    {
      animations: ({ circle }) => {
        expect(circle).toEqual({ message: 'foobar' });
        return [];
      },
      nodes: { circle: { message: 'foobar' } },
    }
  )(DEFAULT_ANIMATION_NAME),

  makeSequence(
    {
      animations: {
        hey: ({ circle }) => {
          expect(circle).toEqual({ message: 'hey hey' });
          return [];
        }
      },
      nodes: { circle: { message: 'hey hey' } },
    }
  )('hey'),

  expect(() => {
    makeSequence(
      {
        animations: () => ({
          foo: [],
          bar: [],
        }),
        nodes: {},
      }
    )('woo')
  }).toThrow(/there is no such named animation/);
});

test('machines/animatronics/makeMutators', () => {
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
    phasesCountdownMachines: {},
    timedJobMachines: {},
  };

  const mutators = makeMutators(machinist, state);

  const animationName = 'foobar';

  mutators.createAnimationCountdownMachine({
    numAnimations: 4,
    job: () => {},
    animationName,
  });

  expect(state.animationCountdownMachines.foobar).toBeTruthy();

  mutators.createPhasesCountdownMachine({
    numPhases: 3,
    job: () => {},
    animationName,
  });

  expect(state.phasesCountdownMachines.foobar).toBeTruthy();

  mutators.createTimedJobMachine({
    animationName: 'foo',
    componentName: 'bar',
    duration: 400,
  });

  expect(state.timedJobMachines.foo.bar).toBeTruthy();
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
    playAnimation()({});
  }).toThrow(/expects its first argument to be a string/);
});

