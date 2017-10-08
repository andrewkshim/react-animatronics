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
export const PerpetualMachine = (
  requestAnimationFrame: (fn: VoidFn) => void,
  cancelAnimationFrame: (frame: number) => void,
): Machine => {

  let _frame: ?number = null;
  let _machineIsStopped: boolean = false;
  let _job: ?VoidFn = null;
  let _onFrame: ?VoidFn = null;

  const runIteration: VoidFn = () => {
    if (_machineIsStopped) return;

    _frame = requestAnimationFrame(() => {
      _job();
      runIteration();
    });
  }

  const machine: Machine = {
    isStopped: () => _machineIsStopped,

    do: (job: VoidFn, onFrame: VoidFn) => {
      _job = job;
      return machine;
    },

    run: () => {
      _machineIsStopped = false;
      runIteration();
      return machine;
    },

    stop: () => {
      if (_frame) {
        cancelAnimationFrame(_frame);
      }
      _frame = null;
      _machineIsStopped = true;
    }

  };

  return machine;
};

/**
 * Creates a machine that maintains extra state for managing spring animations.
 */
export const SpringMachineUpgrade = (machine: Machine): Machine => {

  let prevTime = Date.now();
  let numIterations = 0;
  let accumulatedTime = 0;


}

/**
 * Creates a machine that will stop running after the specified duration.
 */
export const TimedMachineUpgrade = (machine: Machine, duration: number): Machine => {

  let startTime: number = 0;

  const { do: _do, run: _run } = machine;

  machine.do = (job: VoidFn) => {
    const _job = () => {
      const elapsedTime: number = Date.now() - startTime;
      if (elapsedTime >= duration) {
        machine.stop();
      }
      job(elapsedTime);
    }
    return _do(_job);
  }

  machine.run = () => {
    startTime = Date.now();
    return _run();
  }

  return machine;
};
