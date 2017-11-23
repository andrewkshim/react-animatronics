const registerJob = (state, mutators) => job => {
  mutators.registerJob({ job });
};

const countdown = (state, mutators) => () => {
  mutators.countdown();
};

export const makeMutators = (machinist, state) => ({
  registerJob: action => {
    const { job } = action;
    state.jobs.push(job);
  },
  countdown: action => {
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

  const mutators = makeMutators(machinist, state);

  const countdownJobMachine = {
    registerJob: registerJob(state, mutators),
    countdown: countdown(state, mutators),
  };

  return countdownJobMachine;
}
