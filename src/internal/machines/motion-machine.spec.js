// @flow
import sinon from 'sinon'
import test from 'tape'

import { PerpetualMotionMachine, TimedMachineUpgrade } from './motion-machine'

test('PerpetualMotionMachine', assert => {
  const expectedCallCount = 5;
  const interval = 100;
  const requestAnimationFrame = (fn) => { setTimeout(fn, interval) };
  const cancelAnimationFrame = clearTimeout;
  const spy = sinon.spy();
  let numIterations = 0;

  const motionMachine = PerpetualMotionMachine(requestAnimationFrame, cancelAnimationFrame);

  const job = () => {
    if (numIterations === expectedCallCount) {
      motionMachine.stop();
      assert.true(motionMachine.isStopped(), 'the machine knows when it is stopped');
      assert.equals(spy.callCount, expectedCallCount, 'the machine runs the expected number of iterations');
      assert.end();
    }
    numIterations++;
    spy();
  };

  motionMachine
    .do(job)
    .run();
});

test('TimedMachineUpgrade', assert => {
  const duration = 500;
  const interval = 90;
  const expectedCallCount = Math.floor(duration / interval);
  const requestAnimationFrame = (fn) => { setTimeout(fn, interval) };
  const cancelAnimationFrame = clearTimeout;
  const job = sinon.spy();

  const motionMachine = PerpetualMotionMachine(requestAnimationFrame, cancelAnimationFrame);
  const timedMachine = TimedMachineUpgrade(motionMachine, duration);

  const onComplete = () => {
    assert.true(timedMachine.isStopped(), 'the machine knows when it is stopped');
    assert.equals(job.callCount, expectedCallCount, 'the machine runs the expected number of iterations');
    assert.end();
  }

  timedMachine
    .do(job)
    .run(onComplete);
});
