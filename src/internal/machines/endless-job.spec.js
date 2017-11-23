import sinon from 'sinon'
import lolex from 'lolex'

import {
  makeReducers,
  start,
  stop,
} from './endless-job'

test('machines/endless-job/makeReducers', () => {
  const machinist = {};
  const reducers = makeReducers(machinist);
  const state = {
    frame: null,
    jobs: [],
    isStopped: true,
  };

  reducers.REGISTER_JOB(state, { job: 'foobar' });

  expect(state.jobs).toEqual(['foobar']);

  reducers.START_MACHINE(state, {});

  expect(state.isStopped).toBe(false);

  reducers.STOP_MACHINE(state, {});

  expect(state).toEqual(
    { frame: null, jobs: [], isStopped: true }
  );
});

test('machines/endless-job/start', () => {
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

  expect(callCount).toBe(expectedCallCount);
});

test('machines/endless-job/stop', () => {
  const clock = lolex.createClock();
  const dispatch = () => {};
  const cancelAnimationFrame = sinon.spy();
  const state = {
    frame: 'hello',
    cancelAnimationFrame,
  };

  stop(state, dispatch)();

  expect(cancelAnimationFrame.firstCall.args[0]).toBe('hello');
});
