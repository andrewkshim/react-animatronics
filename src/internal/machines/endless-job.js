const registerJob = (state, mutators) => job => {
  mutators.registerJob({ job });
}

// IMPROVE: How to better manage state so its more consistent with the other mutators?
export const start = (state, mutators) => () => {
  mutators.startMachine();
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

export const stop = (state, mutators) => () => {
  if (state.frame) {
    state.cancelAnimationFrame(state.frame);
  }
  mutators.stopMachine();
}

export const makeMutators = (machinist, state) => ({

  registerJob: action => {
    const { job } = action;
    state.jobs.push(job);
  },

  startMachine: action => {
    state.isStopped = false;
  },

  stopMachine: action => {
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

  const mutators = makeMutators(machinist, state);

  const endlessJobMachine = {
    registerJob: registerJob(state, mutators),
    start: start(state, mutators),
    stop: stop(state, mutators),
  };

  return endlessJobMachine;
}
