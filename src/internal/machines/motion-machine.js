// @flow
/**
 * MotionMachine
 * @module machines/motion-machine
 */

import type { VoidFn, MotionMachine } from '../flow-types'
import { noop } from '../utils'

export const PerpetualMotionMachine = (
  requestAnimationFrame: (fn: VoidFn) => void,
  cancelAnimationFrame: (frame: number) => void,
): MotionMachine => {

  let _frame: ?number = null;
  let _machineIsStopped: boolean = false;
  let _job: Function = noop;
  let _onFrame: VoidFn = noop;

  const runIteration: VoidFn = () => {
    if (_machineIsStopped) return;

    _frame = requestAnimationFrame(() => {
      _job();
      runIteration();
    });
  }

  const machine: MotionMachine = {
    isStopped: (): boolean => _machineIsStopped,

    do: (job: Function, onFrame?: VoidFn) => {
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

  let _startTime: number = 0;
  let _onComplete = () => {};

  const { do: _do, run: _run } = machine;

  machine.do = (job: Function, onFrame?: VoidFn) => {
    const _job = () => {
      const elapsedTime: number = Date.now() - _startTime;
      if (elapsedTime >= duration) {
        machine.stop();
        _onComplete();
      }
      job(elapsedTime);
    }
    return _do(_job, onFrame);
  }

  machine.run = (onComplete) => {
    _startTime = Date.now();
    _onComplete = onComplete || _onComplete;
    return _run();
  }

  return machine;
};
