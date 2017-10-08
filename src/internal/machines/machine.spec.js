// @flow
import sinon from 'sinon'
import test from 'tape'

import { PerpetualMachineFactory, TimedMachineFactory } from './machine'

test('PerpetualMachineFactory', assert => {
  const expectedCallCount = 5;
  const interval = 100;
  const requestAnimationFrame = (fn) => { setTimeout(fn, interval) };
  const cancelAnimationFrame = clearTimeout;
  const spy = sinon.spy();
  let numIterations = 0;

  const onComplete = () => {
    assert.equals(spy.callCount, expectedCallCount, 'the machine runs the expected number of iterations');
    assert.end();
  }

  const PerpetualMachine = PerpetualMachineFactory(requestAnimationFrame, cancelAnimationFrame);
  const machine = PerpetualMachine(onComplete);

  const job = () => {
    if (numIterations === expectedCallCount) {
      machine.stop();
    }
    numIterations++;
    spy();
  };

  machine
    .do(job)
    .run();
});

test('TimedMachineFactory', assert => {
  const duration = 500;
  const interval = 100;
  const expectedCallCount = Math.floor(duration / interval);
  const requestAnimationFrame = (fn) => { setTimeout(fn, interval) };
  const cancelAnimationFrame = clearTimeout;
  const job = sinon.spy();

  const onComplete = () => {
    assert.equals(job.callCount, expectedCallCount, 'the machine runs the expected number of iterations');
    assert.true(machine.isStopped(), 'the machine knows when it is stopped');
    assert.end();
  }

  const TimedMachine = TimedMachineFactory(requestAnimationFrame, cancelAnimationFrame);
  const machine = TimedMachine(duration, onComplete);

  machine
    .do(job)
    .run();
});
