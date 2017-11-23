import sinon from 'sinon'

import {
  calculateEasingProgress,
  throwIfAnimationNotValid,
  throwIfPhaseNotValid,
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

test('machines/animatronics/throwIfAnimationNotValid', () => {
  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      stiffness: 200,
      damping: 20,
    }),
  ).toThrow(/must specify either/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      stiffness: 20,
    }),
  ).toThrow(/with both a 'duration' and a 'stiffness'/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      damping: 20,
    })
  ).toThrow(/with both a 'duration' and a 'damping'/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 'foobar',
    })
  ).toThrow(/'duration' must always be a number/);

  expect(
    () => throwIfAnimationNotValid({
      stiffness: 'foobar',
      damping: 20,
    })
  ).toThrow(/'stiffness' must always be a number/);

  expect(
    () => throwIfAnimationNotValid({
      stiffness: 200,
      damping: 'foobar',
    })
  ).toThrow(/'damping' must always be a number/);

  expect(
    () => throwIfAnimationNotValid({
      stiffness: 200,
    }),
  ).toThrow(/with a 'stiffness' but not a 'damping'/);

  expect(
    () => throwIfAnimationNotValid({
      damping: 20,
    })
  ).toThrow(/with a 'damping' but not a 'stiffness'/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: {},
    })
  ).toThrow(/with a 'from' but not an 'to'/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      to: {},
    })
  ).toThrow(/with an 'to' but not a 'from'/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: 'foobar',
      to: {},
    })
  ).toThrow(/'from' must always be a plain object/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: {},
      to: 'foobar',
    })
  ).toThrow(/'to' must always be a plain object/);

  expect(
    () => throwIfAnimationNotValid({
      from: {
        scaleA: 0,
      },
      to: {
        scaleA: 1,
      }
    })
  ).toThrow(/specify one or the other/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      delay: 'foobar',
      from: {},
      to: {},
    })
  ).toThrow(/'delay' must always be a number/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: {},
      to: {},
    })
  ).not.toThrow();
});

test('machines/animatronics/throwIfPhaseNotValid', () => {
  expect(
    () => {
      throwIfPhaseNotValid(
        { bar: {
          duration: 100,
          from: { left: '100px' },
          to: { left: '200px' }
        } },
        { foo: null }
      );
    }
  ).toThrow(/isn't aware of any component with that name/);
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
