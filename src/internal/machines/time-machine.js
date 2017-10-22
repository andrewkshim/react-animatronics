// @flow
/**
 * TimeMachine
 *
 * @module internal/machines/time-machine
 */

import type { VoidFn, TimeMachine } from '../flow-types'
import { noop } from '../utils'

export const InfiniteTimeMachine = (
  requestAnimationFrame: (fn: VoidFn) => void,
  cancelAnimationFrame: (frame: number) => void,
): TimeMachine => {

  let _frame: ?number = null;
  let _machineIsStopped: boolean = false;
  let _jobs: Function[] = [];

  const runIteration: VoidFn = () => {
    _frame = requestAnimationFrame(() => {
      if (_machineIsStopped) return;
      _jobs.forEach(job => job());
      runIteration();
    });
  }

  const machine: TimeMachine = {
    isStopped: (): boolean => _machineIsStopped,

    do: (job: Function) => {
      _jobs.push(job);
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
      _jobs = [];
    }

  };

  return machine;
};

export const FiniteTimeMachine = (
  machine: TimeMachine,
  duration: number,
  now: () => number,
): TimeMachine => {

  let _startTime: number = 0;
  let _onComplete = () => {};

  const { do: _do, run: _run, ...rest } = machine;

  const finiteMachine = {
    ...rest,
    do: (job: Function) => {
      const _job = () => {
        const elapsedTime: number = now() - _startTime;
        job(elapsedTime);

        if (elapsedTime >= duration) {
          machine.stop();
          _onComplete();
        }
      }
      _do(_job);
      return finiteMachine;
    },
    run: (onComplete) => {
      _startTime = now();
      _onComplete = onComplete || _onComplete;
      _run();
      return finiteMachine;
    },
  };

  return finiteMachine;
};
