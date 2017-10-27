import test from 'tape'
import sinon from 'sinon'
import lolex from 'lolex'

import {
  start,
  stop,
  makeReducers,
} from './timed-job-machine'

test('makeReducers', assert => {
  const machinist = {};
  const reducers = makeReducers(machinist);
  const state = {
    frame: null,
    jobs: [],
    onCompletedJobs: [],
    isStopped: true,
  };

  reducers.REGISTER_JOB(state, { job: 'hello' }),

  assert.deepEquals(
    state.jobs,
    ['hello'],
    'REGISTER_JOB should add a job'
  );

  reducers.REGISTER_ON_COMPLETED_JOB(state, { job: 'foobar' }),

  assert.deepEquals(
    state.onCompletedJobs,
    ['foobar'],
    'REGISTER_ON_COMPLETED_JOB should add an onCompleted job'
  );

  reducers.START_MACHINE(state, {}),

  assert.false(
    state.isStopped,
    'START_MACHINE marks the machine as started'
  );

  reducers.STOP_MACHINE(state, {}),

  assert.deepEquals(
    state,
    { frame: null, isStopped: true, jobs: [], onCompletedJobs: [] },
    'STOP_MACHINE resets the machine'
  );

  assert.end();
});

test('start', assert => {
  const clock = lolex.createClock();
  const job = sinon.spy();
  const onCompletedJob = sinon.spy();
  const dispatch = () => {};
  const state = {
    isStopped: false,
    now: clock.Date.now,
    requestAnimationFrame: callback => clock.setTimeout(callback, 100),
    duration: 500,
    jobs: [ job ],
    onCompletedJobs: [ onCompletedJob ],
  };

  start(state, dispatch)();
  clock.runAll();

  assert.equals(
    job.callCount, 5,
    'should call the job the expected number of times'
  );

  assert.true(
    onCompletedJob.calledOnce,
    'should call the onCompletedJob when it finishes'
  );

  assert.end();
});

test('stop', assert => {
  const dispatch = () => {};
  const cancelAnimationFrame = sinon.spy();
  const state = {
    frame: 42,
    cancelAnimationFrame,
  };

  stop(state, dispatch)();

  assert.equals(
    cancelAnimationFrame.firstCall.args[0], 42,
    'should call cancelAnimationFrame with the current frame'
  )

  assert.end();
});
