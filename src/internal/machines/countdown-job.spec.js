import sinon from 'sinon'

import {
  makeReducers,
} from './countdown-job'

test('machines/countdown-job/makeReducers', () => {
  const machinist = {};
  const reducers = makeReducers(machinist);
  const job = sinon.spy();
  const state = {
    jobs: [],
    count: 2,
  };

  reducers.REGISTER_JOB(state, { job });

  expect(state.jobs).toEqual([ job ]);

  reducers.COUNTDOWN(state, {}),

  expect(state.count).toBe(1);

  reducers.COUNTDOWN(state, {}),

  expect(job.calledOnce).toBe(true);
});
