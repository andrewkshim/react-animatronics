// @flow
/**
 * MotionMachine
 * @module machines/motion-machine
 */

import type { VoidFn, MotionMachine } from '../flow-types'

export const PerpetualMotionMachine = (
  requestAnimationFrame: (fn: VoidFn) => void,
  cancelAnimationFrame: (frame: number) => void,
): MotionMachine => {

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

  const machine: MotionMachine = {
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

export const TimedMachineUpgrade = (machine: MotionMachine, duration: number): MotionMachine => {

  let startTime: number = 0;
  let _onComplete = () => {};

  const { do: _do, run: _run } = machine;

  machine.do = (job: VoidFn) => {
    const _job = () => {
      const elapsedTime: number = Date.now() - startTime;
      if (elapsedTime >= duration) {
        machine.stop();
        _onComplete();
      }
      job(elapsedTime);
    }
    return _do(_job);
  }

  machine.run = (onComplete) => {
    _onComplete = onComplete || _onComplete;
    return _run();
  }

  return machine;
};
