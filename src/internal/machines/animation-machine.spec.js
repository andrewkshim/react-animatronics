// @flow
import sinon from 'sinon'
import test from 'tape'

import { AnimationMachine } from './animation-machine'

test('AnimationMachine', assert => {
  const interval = 125;
  const duration = 250;
  const stage = {
    componentA: {
      duration,
      start: { left: '0px' },
      end: { left: '100px' },
    },
  };
  const requestAnimationFrame = fn => { setTimeout(fn, interval) };
  const cancelAnimationFrame = clearTimeout;

  const animationMachine = AnimationMachine(
    stage,
    requestAnimationFrame,
    cancelAnimationFrame,
  );

  const onComponentFrame = sinon.spy();

  const onComplete = () => {
    assert.equals(
      onComponentFrame.callCount, Math.floor(duration / interval),
      'calls onComponentFrame the expected number of times'
    );
    assert.deepEquals(
      onComponentFrame.lastCall.args[0], 'componentA',
      'calls onComponentFrame for the correct component'
    );
    assert.deepEquals(
      onComponentFrame.lastCall.args[1], { left: '100px' },
      'calls onComponentFrame with the correct styles'
    );
    assert.end();
  };

  animationMachine.run(onComponentFrame, onComplete);
});
