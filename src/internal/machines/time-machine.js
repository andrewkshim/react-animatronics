// @flow
/**
 * TimeMachine
 *
 * @module internal/machines/time-machine
 */

import type { VoidFn, Time } from '../flow-types'
import { noop } from '../utils'

export const InfiniteTimeMachine = (
  requestAnimationFrame: (fn: VoidFn) => void,
  cancelAnimationFrame: (frame: number) => void,
): Time => {

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

  const machine: Time = {
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

export const FiniteTimeMachine = (machine: Time, duration: number): Time => {

  let _startTime: number = 0;
  let _onComplete = () => {};

  const { do: _do, run: _run, ...rest } = machine;

  const finiteMachine = {
    ...rest,
    do: (job: Function) => {
      const _job = () => {
        const elapsedTime: number = Date.now() - _startTime;
        if (elapsedTime >= duration) {
          machine.stop();
          _onComplete();
        }
        job(elapsedTime);
      }
      _do(_job);
      return finiteMachine;
    },
    run: (onComplete) => {
      _startTime = Date.now();
      _onComplete = onComplete || _onComplete;
      _run();
      return finiteMachine;
    },
  };

  return finiteMachine;
};
