import sinon from 'sinon'
import lolex from 'lolex'

import {
  start,
  stop,
  makeMutators,
} from './timed-job'

test('machines/timed-job/makeMutators', () => {
  const machinist = {};
  const state = {
    frame: null,
    jobs: [],
    onCompleteJobs: [],
    isStopped: true,
  };
  const mutators = makeMutators(machinist, state);

  mutators.registerJob({ job: 'hello' }),
  expect(state.jobs).toEqual(['hello']);

  mutators.registerOnCompleteJob({ onCompleteJob: 'foobar' }),
  expect(state.onCompleteJobs).toEqual(['foobar']);

  mutators.startMachine(),
  expect(state.isStopped).toBe(false);

  mutators.stopMachine(),
  expect(state).toEqual(
    { frame: null, isStopped: true, jobs: [], onCompleteJobs: [] }
  );
});

test('machines/timed-job/start', () => {
  const clock = lolex.createClock();
  const job = sinon.spy();
  const onCompletedJob = sinon.spy();
  const state = {
    isStopped: false,
    now: clock.Date.now,
    requestAnimationFrame: callback => clock.setTimeout(callback, 100),
    duration: 500,
    jobs: [ job ],
    onCompleteJobs: [ onCompletedJob ],
  };
  const mutators = makeMutators({}, state);

  start(state, mutators)();
  clock.runAll();

  expect(job.callCount).toBe(5);

  expect(onCompletedJob.calledOnce).toBe(true);
});

test('machines/timed-job/stop', () => {
  const cancelAnimationFrame = sinon.spy();
  const state = {
    frame: 42,
    cancelAnimationFrame,
  };
  const mutators = makeMutators({}, state);

  stop(state, mutators)();

  expect(cancelAnimationFrame.firstCall.args[0]).toBe(42);
});
