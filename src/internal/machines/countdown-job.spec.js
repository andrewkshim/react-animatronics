import sinon from 'sinon'

import {
  makeMutators,
} from './countdown-job'

test('machines/countdown-job/makeMutators', () => {
  const machinist = {};
  const state = {
    jobs: [],
    count: 2,
  };
  const mutators = makeMutators(machinist, state);
  const job = sinon.spy();

  mutators.registerJob({ job });
  expect(state.jobs).toEqual([ job ]);

  mutators.countdown();
  expect(state.count).toBe(1);

  mutators.countdown();
  expect(job.calledOnce).toBe(true);
});
