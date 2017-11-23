import sinon from 'sinon'
import lolex from 'lolex'

import {
  makeMutators,
  start,
  stop,
} from './endless-job'

test('machines/endless-job/makeMutators', () => {
  const state = {
    frame: null,
    jobs: [],
    isStopped: true,
  };
  const mutators = makeMutators({}, state);

  mutators.registerJob({ job: 'foobar' });
  expect(state.jobs).toEqual(['foobar']);

  mutators.startMachine();
  expect(state.isStopped).toBe(false);

  mutators.stopMachine();
  expect(state).toEqual(
    { frame: null, jobs: [], isStopped: true }
  );
});

test('machines/endless-job/start', () => {
  const clock = lolex.createClock();
  const state = {
    isStopped: false,
    jobs: [],
    requestAnimationFrame: callback => clock.setTimeout(callback, 10),
  };
  const mutators = makeMutators({}, state);

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

  start(state, mutators)();
  clock.runAll();

  expect(callCount).toBe(expectedCallCount);
});

test('machines/endless-job/stop', () => {
  const clock = lolex.createClock();
  const cancelAnimationFrame = sinon.spy();
  const state = {
    frame: 'hello',
    cancelAnimationFrame,
  };
  const mutators = makeMutators({}, state);

  stop(state, mutators)();

  expect(cancelAnimationFrame.firstCall.args[0]).toBe('hello');
});
