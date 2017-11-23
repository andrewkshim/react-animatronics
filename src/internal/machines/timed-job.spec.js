import sinon from 'sinon'
import lolex from 'lolex'

import {
  start,
  stop,
  makeReducers,
} from './timed-job'

test('machines/timed-job/makeReducers', () => {
  const machinist = {};
  const reducers = makeReducers(machinist);
  const state = {
    frame: null,
    jobs: [],
    onCompletedJobs: [],
    isStopped: true,
  };

  reducers.REGISTER_JOB(state, { job: 'hello' }),

  expect(state.jobs).toEqual(['hello']);

  reducers.REGISTER_ON_COMPLETED_JOB(state, { job: 'foobar' }),

  expect(state.onCompletedJobs).toEqual(['foobar']);

  reducers.START_MACHINE(state, {}),

  expect(state.isStopped).toBe(false);

  reducers.STOP_MACHINE(state, {}),

  expect(state).toEqual(
    { frame: null, isStopped: true, jobs: [], onCompletedJobs: [] }
  );
});

test('machines/timed-job/start', () => {
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

  expect(job.callCount).toBe(5);

  expect(onCompletedJob.calledOnce).toBe(true);
});

test('machines/timed-job/stop', () => {
  const dispatch = () => {};
  const cancelAnimationFrame = sinon.spy();
  const state = {
    frame: 42,
    cancelAnimationFrame,
  };

  stop(state, dispatch)();

  expect(cancelAnimationFrame.firstCall.args[0]).toBe(42);
});
