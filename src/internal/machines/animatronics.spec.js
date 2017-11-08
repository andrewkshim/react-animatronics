import test from 'tape'
import sinon from 'sinon'

import {
  calculateEasingProgress,
  throwIfAnimationNotValid,
  throwIfPhaseNotValid,
  play,
  makeSequence,
  makeReducers,
} from './animatronics'

test('machines/animatronics/calculateEasingProgress', assert => {
  assert.equals(
    calculateEasingProgress(x => x, 500, 250), 0.5,
    'should return the result of the easing(elapsedTime / duration)'
  );

  assert.equals(
    calculateEasingProgress(x => x, 0, 250), 1,
    'should return the result of the easing(1) when duration is 0'
  );

  assert.end();
});

test('machines/animatronics/throwIfAnimationNotValid', assert => {
  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      stiffness: 200,
      damping: 20,
    }),
    /must specify either/,
    'should throw when animation is both timed and spring'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      stiffness: 20,
    }),
    /with both a 'duration' and a 'stiffness'/,
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      damping: 20,
    }),
    /with both a 'duration' and a 'damping'/,
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 'foobar',
    }),
    /'duration' must always be a number/,
    'should throw when the duration is not a number'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      stiffness: 'foobar',
      damping: 20,
    }),
    /'stiffness' must always be a number/,
    'should throw when the stiffness is not a number'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      stiffness: 200,
      damping: 'foobar',
    }),
    /'damping' must always be a number/,
    'should throw when the damping is not a number'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      stiffness: 200,
    }),
    /with a 'stiffness' but not a 'damping'/,
    'should throw when a spring animation has stiffness but not damping'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      damping: 20,
    }),
    /with a 'damping' but not a 'stiffness'/,
    'should throw when a spring animation has damping but not stiffness'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: {},
    }),
    /with a 'from' but not an 'to'/,
    'should throw when an animation has a from but no to'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      to: {},
    }),
    /with an 'to' but not a 'from'/,
    'should throw when an animation has an to but no from'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: 'foobar',
      to: {},
    }),
    /'from' must always be a plain object/,
    'should throw when from is not an object'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: {},
      to: 'foobar',
    }),
    /'to' must always be a plain object/,
    'should throw when to is not an object'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      delay: 'foobar',
      from: {},
      to: {},
    }),
    /'delay' must always be a number/,
    'should throw when delay is not a number'
  );

  assert.doesNotThrow(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: {},
      to: {},
    }),
    'should not throw when the animation is valid'
  );

  assert.end();
});

test('machines/animatronics/throwIfPhaseNotValid', assert => {
  assert.throws(
    () => {
      throwIfPhaseNotValid(
        { bar: {
          duration: 100,
          from: { left: '100px' },
          to: { left: '200px' }
        } },
        { foo: null }
      );
    },
    /isn't aware of any component with that name/
  );
  assert.end();
});

test('machines/animatronics/makeSequence', assert => {
  const createAnimationSequences = () => ({
    hello: [
      {
        circle: {
          duration: 500,
          from: { left: '100px' },
          to: { left: '200px' },
        }
      }
    ]
  });

  const state = {
    createAnimationSequences,
    nodes: { circle: {} },
  };

  assert.deepEquals(
    makeSequence(state)('hello'),
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
  assert.end();
});

test('machines/animatronics/makeReducers', assert => {
  const machinist = {
    makeCountdownJobMachine: () => {
      return { registerJob: () => {} };
    },
    makeTimedJobMachine: () => {
      return { registerJob: () => {} };
    }
  };

  const reducers = makeReducers(machinist);

  const state = {
    animationCountdownMachine: null,
    phasesCountdownMachine: null,
    timedJobMachines: {},
  };

  reducers.CREATE_ANIMATION_COUNTDOWN_MACHINE(
    state,
    { numAnimations: 4, job: () => {} }
  );

  assert.ok(
    state.animationCountdownMachine,
    'CREATE_ANIMATION_COUNTDOWN_MACHINE should create a countdown machine'
  );

  reducers.CREATE_PHASES_COUNTDOWN_MACHINE(
    state,
    { numPhases: 3, job: () => {} }
  );

  assert.ok(
    state.phasesCountdownMachine,
    'CREATE_PHASES_COUNTDOWN_MACHINE should create a countdown machine'
  );

  reducers.CREATE_TIMED_JOB_MACHINE(
    state,
    { componentName: 'foobar', duration: 400 }
  );

  assert.ok(
    state.timedJobMachines.foobar,
    'CREATE_TIMED_JOB_MACHINE should create a timed job machine for the component'
  );

  assert.end();
});
