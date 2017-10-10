// @flow
import sinon from 'sinon'
import test from 'tape'

import { InfiniteTimeMachine, FiniteTimeMachine } from './time-machine'

test('InfiniteTimeMachine running a single job', assert => {
  const expectedCallCount = 5;
  const interval = 100;
  const requestAnimationFrame = fn => { setTimeout(fn, interval) };
  const cancelAnimationFrame = clearTimeout;
  const spy = sinon.spy();
  let numIterations = 0;

  const infiniteMachine = InfiniteTimeMachine(requestAnimationFrame, cancelAnimationFrame);

  const job = () => {
    if (numIterations === expectedCallCount) {
      infiniteMachine.stop();
      assert.true(infiniteMachine.isStopped(), 'the machine knows when it is stopped');
      assert.equals(spy.callCount, expectedCallCount, 'the machine runs the expected number of iterations');
      assert.end();
    }
    numIterations++;
    spy();
  };

  infiniteMachine
    .do(job)
    .run();
});

test('InfiniteTimeMachine running multiple jobs', assert => {
  const expectedCallCount = 10;
  const interval = 20;
  const requestAnimationFrame = fn => { setTimeout(fn, interval) };
  const cancelAnimationFrame = clearTimeout;
  const spyA = sinon.spy();
  const spyB = sinon.spy();
  let numIterations = 0;

  const infiniteMachine = InfiniteTimeMachine(requestAnimationFrame, cancelAnimationFrame);

  const jobA = () => {
    numIterations++;
    spyA();
  };

  const jobB = () => {
    numIterations++;
    spyB();
    if (numIterations === expectedCallCount) {
      console.log(numIterations);
      infiniteMachine.stop();
      assert.equals(
        spyA.callCount, (expectedCallCount / 2),
        'the machine runs the first job the expected number of times'
      );
      assert.equals(
        spyB.callCount, (expectedCallCount / 2),
        'the machine runs the second job the expected number of times'
      );
      assert.end();
    }
  };

  infiniteMachine
    .do(jobA)
    .do(jobB)
    .run();
});

test('FiniteTimeMachine', assert => {
  const duration = 500;
  const interval = 90;
  const expectedCallCount = Math.floor(duration / interval);
  const requestAnimationFrame = fn => { setTimeout(fn, interval) };
  const cancelAnimationFrame = clearTimeout;
  const job = sinon.spy();

  const infiniteMachine = InfiniteTimeMachine(requestAnimationFrame, cancelAnimationFrame);
  const finiteMachine = FiniteTimeMachine(infiniteMachine, duration);

  const onComplete = () => {
    assert.true(finiteMachine.isStopped(), 'the machine knows when it is stopped');
    assert.equals(job.callCount, expectedCallCount, 'the machine runs the expected number of iterations');
    assert.end();
  }

  finiteMachine
    .do(job)
    .run(onComplete);
});
