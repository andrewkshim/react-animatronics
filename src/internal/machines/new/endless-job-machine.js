const registerJob = (state, dispatch) => job => {
  dispatch({
    type: 'REGISTER_JOB',
    job,
  });
}

// IMPROVE: How to better manage state so its more consistent with the other
// reducers?
export const start = (state, dispatch) => () => {
  dispatch({ type: 'START_MACHINE' });
  const tick = () => {
    state.frame = state.requestAnimationFrame(executeJobs);
  }
  const executeJobs = () => {
    if (state.isStopped) return;
    state.jobs.forEach(job => job());
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
  START_MACHINE: (state, action) => {
    state.isStopped = false;
  },
  STOP_MACHINE: (state, action) => {
    state.frame = null;
    state.jobs = [];
    state.isStopped = true;
  },
});

export const makeEndlessJobMachine = machinist => (
  requestAnimationFrame,
  cancelAnimationFrame,
) => {
  const state = {
    frame: null,
    jobs: [],
    isStopped: true,
    requestAnimationFrame,
    cancelAnimationFrame,
  };

  const reducers = makeReducers(machinist);

  const dispatch = action => {
    const { type } = action;
    reducers[type](state, action);
  };

  const endlessJobMachine = {
    registerJob: registerJob(state, dispatch),
    start: start(state, dispatch),
    stop: stop(state, dispatch),
  };

  return endlessJobMachine;
}
