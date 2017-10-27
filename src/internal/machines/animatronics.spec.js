import test from 'tape'
import sinon from 'sinon'

import {
  calculateEasingProgress,
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

test('machines/animatronics/makeSequence', assert => {
  const createAnimationSequences = () => ({
    hello: [
      {
        circle: {
          duration: 500,
          from: { left: '100px' },
          top: { left: '200px' },
        }
      }
    ]
  });

  const state = {
    createAnimationSequences,
    nodes: {},
  };

  assert.deepEquals(
    makeSequence(state)('hello'),
    [
      {
        circle: {
          duration: 500,
          from: { left: '100px' },
          top: { left: '200px' },
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
    componentCountdownMachine: null,
    phasesCountdownMachine: null,
    timedJobMachines: {},
  };

  reducers.CREATE_COMPONENTS_COUNTDOWN_MACHINE(
    state,
    { numComponents: 4, job: () => {} }
  );

  assert.ok(
    state.componentCountdownMachine,
    'CREATE_COMPONENTS_COUNTDOWN_MACHINE should create a countdown machine'
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
