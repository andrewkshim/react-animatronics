import sinon from 'sinon'

import {
  calculateEasingProgress,
  play,
  makeSequence,
  makeReducers,
} from './animatronics'

import {
  DEFAULT_ANIMATION_NAME
} from '../../constants'

test('machines/animatronics/calculateEasingProgress', () => {
  expect(calculateEasingProgress(x => x, 500, 250)).toBe(0.5);
  expect(calculateEasingProgress(x => x, 0, 250)).toBe(1.0);
});

test('machines/animatronics/makeSequence', () => {
  expect(
    makeSequence(
      {
        createAnimationSequences: () => ({
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
      createAnimationSequences: ({ circle }) => {
        expect(circle).toEqual({ message: 'foobar' });
        return [];
      },
      nodes: { circle: { message: 'foobar' } },
    }
  )(DEFAULT_ANIMATION_NAME),

  makeSequence(
    {
      createAnimationSequences: {
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
        createAnimationSequences: () => ({
          foo: [],
          bar: [],
        }),
        nodes: {},
      }
    )('woo')
  }).toThrow(/there is no such named animation/);
});

test('machines/animatronics/makeReducers', () => {
  const machinist = {
    makeCountdownJobMachine: () => {
      return { registerJob: () => {} };
    },
    makeTimedJobMachine: () => {
      return { registerJob: () => {} };
    }
  };

  const reducers = makeReducers(machinist);

  const animationName = 'foobar';
  const state = {
    animationCountdownMachines: {},
    phasesCountdownMachines: {},
    timedJobMachines: {},
  };

  reducers.CREATE_ANIMATION_COUNTDOWN_MACHINE(
    state,
    { numAnimations: 4, job: () => {}, animationName }
  );

  expect(state.animationCountdownMachines.foobar).toBeTruthy();

  reducers.CREATE_PHASES_COUNTDOWN_MACHINE(
    state,
    { numPhases: 3, job: () => {}, animationName }
  );

  expect(state.phasesCountdownMachines.foobar).toBeTruthy();

  reducers.CREATE_TIMED_JOB_MACHINE(
    state,
    { componentName: 'foobar', duration: 400 }
  );

  expect(state.timedJobMachines.foobar).toBeTruthy();
});
