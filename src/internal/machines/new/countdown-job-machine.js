const registerJob = (state, dispatch) => job => {
  dispatch({
    type: 'REGISTER_JOB',
    job,
  });
};

const countdown = (state, dispatch) => () => {
  dispatch({ type: 'COUNTDOWN' });
};

// FIXME: Rename makeReducers to makeSideEffects
export const makeReducers = machinist => ({
  REGISTER_JOB: (state, action) => {
    const { job } = action;
    state.jobs.push(job);
  },
  COUNTDOWN: (state, action) => {
    if (--state.count === 0) {
      state.jobs.forEach(job => job());
    }
  },
});

export const makeCountdownJobMachine = machinist => count => {
  const state = {
    jobs: [],
    count,
  };

  const reducers = makeReducers(machinist);

  const dispatch = action => {
    const { type } = action;
    reducers[type](state, action);
  };

  const countdownJobMachine = {
    registerJob: registerJob(state, dispatch),
    countdown: countdown(state, dispatch),
  };

  return countdownJobMachine;
}
