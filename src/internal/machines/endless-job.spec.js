import test from 'tape'
import sinon from 'sinon'
import lolex from 'lolex'

import {
  makeReducers,
  start,
  stop,
} from './endless-job'

test('machines/endless-job/makeReducers', assert => {
  const machinist = {};
  const reducers = makeReducers(machinist);
  const state = {
    frame: null,
    jobs: [],
    isStopped: true,
  };

  reducers.REGISTER_JOB(state, { job: 'foobar' });

  assert.deepEquals(
    state.jobs,
    ['foobar'],
    'REGISTER_JOB should add a job'
  );

  reducers.START_MACHINE(state, {});

  assert.false(
    state.isStopped,
    'START_MACHINE should mark the machine as started'
  );

  reducers.STOP_MACHINE(state, {});

  assert.deepEquals(
    state,
    { frame: null, jobs: [], isStopped: true },
    'STOP_MACHINE should reset the machine state'
  );

  assert.end();
});

test('machines/endless-job/start', assert => {
  const clock = lolex.createClock();
  const dispatch = () => {};
  const state = {
    isStopped: false,
    jobs: [],
    requestAnimationFrame: callback => clock.setTimeout(callback, 10),
  };

  const expectedCallCount = 5;
  let callCount = 0;
  const job = () => {
    if (callCount === expectedCallCount) {
      state.isStopped = true;
    } else {
      callCount++;
    }
  }
  state.jobs.push(job);

  start(state, dispatch)();
  clock.runAll();

  assert.equals(
    callCount, expectedCallCount,
    'should run the job as long as the machine is not stopped'
  );

  assert.end();
});

test('machines/endless-job/stop', assert => {
  const clock = lolex.createClock();
  const dispatch = () => {};
  const cancelAnimationFrame = sinon.spy();
  const state = {
    frame: 'hello',
    cancelAnimationFrame,
  };

  stop(state, dispatch)();

  assert.equals(
    cancelAnimationFrame.firstCall.args[0], 'hello',
    'should calll cancelAnimationFrame with the current frame'
  );

  assert.end();
});
