// @flow
/**
 * Machine: contains all mutable state.
 * @module machine
 *
 * The machine should be in charge of managing the animation frames, but it
 * doesn't know anything about what to do in those frames, that's up to the
 * Animator.
 */

import type { VoidFn, Machine } from './flow-types'

// TODO: use utils
const noop: VoidFn = () => {};

/**
 * Creates a machine that will continue to run until the caller tells it to stop.
 */
export const PerpetualMachineFactory = (
  requestAnimationFrame: (fn: VoidFn) => void,
  cancelAnimationFrame: (frame: number) => void,
) => (
  onComplete?: VoidFn = noop,
  onFrame?: VoidFn = noop,
): Machine => {

  let frame: ?number = null;
  let machineIsStopped: boolean = false;

  const jobs: Array<VoidFn> = [];

  const runIteration: VoidFn = () => {
    if (machineIsStopped) return;

    onFrame();
    frame = requestAnimationFrame(() => {
      jobs.forEach(job => job());
      runIteration();
    });
  }

  const machine: Machine = {
    isStopped: () => machineIsStopped,

    do: (job: VoidFn) => {
      jobs.push(job);
      return machine;
    },

    run: () => {
      runIteration();
      return machine;
    },

    stop: () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      machineIsStopped = true;
      onComplete();
    }

  };

  return machine;
};


/**
 * Creates a machine that will stop running after the specified duration.
 */
export const TimedMachineFactory = (
  requestAnimationFrame: (fn: VoidFn) => void,
  cancelAnimationFrame: (frame: number) => void,
) => (
  duration: number,
  onComplete?: VoidFn = noop,
  onFrame?: VoidFn = noop,
): Machine => {

  let startTime: number = 0;

  const _onFrame: VoidFn = () => {
    const elapsedTime: number = Date.now() - startTime;
    onFrame();
    if (elapsedTime >= duration) {
      machine.stop();
    }
  }

  const factory = PerpetualMachineFactory(requestAnimationFrame, cancelAnimationFrame);
  const machine: Machine = factory(onComplete, _onFrame);

  const _run = machine.run;
  machine.run = () => {
    startTime = Date.now();
    return _run();
  }

  return machine;
};
