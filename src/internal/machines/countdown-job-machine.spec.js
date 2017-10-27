import test from 'tape'
import sinon from 'sinon'

import {
  makeReducers,
} from './countdown-job-machine'

test('countdown-job-machine/makeReducers', assert => {
  const machinist = {};
  const reducers = makeReducers(machinist);
  const job = sinon.spy();
  const state = {
    jobs: [],
    count: 2,
  };

  reducers.REGISTER_JOB(state, { job });

  assert.deepEquals(
    state.jobs,
    [ job ],
    'REGISTER_JOB should add a job'
  );

  reducers.COUNTDOWN(state, {}),

  assert.equals(
    state.count, 1,
    'COUNTDOWN should decrement the count'
  );

  reducers.COUNTDOWN(state, {}),

  assert.true(
    job.calledOnce,
    'COUNTDOWN should call the jobs when the count reaches 0'
  );

  assert.end();
});
