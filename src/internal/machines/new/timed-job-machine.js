import Debug from 'debug'

const debug = Debug('animatronics:timed-job-machine');

const registerJob = (state, dispatch) => job => {
  dispatch({
    type: 'REGISTER_JOB',
    job,
  });
}

const registerOnCompleteJob = (state, dispatch) => job => {
  dispatch({
    type: 'REGISTER_ON_COMPLETED_JOB',
    job
  });
}

// IMPROVE: How to better manage state so its more consistent with the other
// reducers?
export const start = (state, dispatch) => () => {
  debug('starting timed job machine');

  dispatch({ type: 'START_MACHINE' });

  const startTime = state.now();

  const tick = () => {
    state.frame = state.requestAnimationFrame(executeJobs);
  }

  const executeJobs = () => {
    if (state.isStopped) return;
    state.jobs.forEach(job => {
      const elapsedTime = state.now() - startTime;
      job(elapsedTime);
      if (elapsedTime >= state.duration) {
        state.onCompletedJobs.forEach(j => j());
        state.frame = null;
        state.isStopped = true;
        state.jobs = [];
      }
    });
    tick();
  }

  tick();
}

export const stop = (state, dispatch) => () => {
  if (state.frame) {
    state.cancelAnimationFrame(state.frame);
  }
  dispatch({ type: 'STOP_MACHINE' });
}

export const makeReducers = machinist => ({
  REGISTER_JOB: (state, action) => {
    const { job } = action;
    state.jobs.push(job);
  },
  REGISTER_ON_COMPLETED_JOB: (state, action) => {
    const { job } = action;
    state.onCompletedJobs.push(job);
  },
  START_MACHINE: (state, action) => {
    state.isStopped = false;
  },
  STOP_MACHINE: (state, action) => {
    state.frame = null;
    state.isStopped = true;
    state.jobs = [];
    state.onCompletedJobs = [];
  },
});

export const makeTimedJobMachine = machinist => (
  duration,
  requestAnimationFrame,
  cancelAnimationFrame,
  now,
) => {
  const state = {
    frame: null,
    jobs: [],
    onCompletedJobs: [],
    isStopped: true,
    duration,
    requestAnimationFrame,
    cancelAnimationFrame,
    now,
  };

  const reducers = makeReducers(machinist);

  const dispatch = action => {
    const { type } = action;
    reducers[type](state, action);
  };

  const timedJobMachine = {
    registerJob: registerJob(state, dispatch),
    registerOnCompleteJob: registerOnCompleteJob(state, dispatch),
    start: start(state, dispatch),
    stop: stop(state, dispatch),
  };

  return timedJobMachine;
}
