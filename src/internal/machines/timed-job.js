import Debug from 'debug'

const debug = Debug('react-animatronics:machines:timed-job');

const registerJob = (state, mutators) => job => {
  mutators.registerJob({ job });
}

const registerOnCompleteJob = (state, mutators) => onCompleteJob => {
  mutators.registerOnCompleteJob({ onCompleteJob });
}

export const start = (state, mutators) => () => {
  debug('starting timed job machine');

  mutators.startMachine();

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
        state.onCompleteJobs.forEach(j => j());
        state.frame = null;
        state.isStopped = true;
        state.jobs = [];
      }
    });
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
  registerOnCompleteJob: action => {
    const { onCompleteJob } = action;
    state.onCompleteJobs.push(onCompleteJob);
  },
  startMachine: action => {
    state.isStopped = false;
  },
  stopMachine: action => {
    state.frame = null;
    state.isStopped = true;
    state.jobs = [];
    state.onCompleteJobs = [];
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
    onCompleteJobs: [],
    isStopped: true,
    duration,
    requestAnimationFrame,
    cancelAnimationFrame,
    now,
  };

  const mutators = makeMutators(machinist, state);

  const timedJobMachine = {
    registerJob: registerJob(state, mutators),
    registerOnCompleteJob: registerOnCompleteJob(state, mutators),
    start: start(state, mutators),
    stop: stop(state, mutators),
  };

  return timedJobMachine;
}
