// @flow
import sinon from 'sinon'
import test from 'tape'

import { ControlsMachine } from './machines/controls-machine'
import { AnimationMachine } from './machines/animation-machine'
import { reverseStages, playAnimation } from './animator'

test('reverseStages', assert => {
  const stages = [
    {
      componentA: {
        duration: 500,
        start: { left: '0px' },
        end: { left: '0px' },
      },
    }
  ];

  const actual = reverseStages(stages);
  const expected = [
    {
      componentA: {
        duration: 500,
        start: { left: '0px' },
        end: { left: '0px' },
      },
    }
  ];

  assert.deepEquals(actual, expected, 'correctly reverses every stage');
  assert.end();
});

test('playAnimation with a single stage', assert => {
  const interval = 100;
  const duration = 500;
  const stages = [
    {
      componentA: {
        duration,
        start: { left: '0px' },
        end: { left: '100px' },
      },
    }
  ];
  const requestAnimationFrame = fn => { setTimeout(fn, interval) };
  const cancelAnimationFrame = clearTimeout;
  const controls = ControlsMachine();
  const animation = AnimationMachine(requestAnimationFrame, cancelAnimationFrame);
  const styleUpdater = sinon.spy();

  controls.registerComponent('componentA', {}, styleUpdater);

  playAnimation(
    stages,
    controls,
    animation,
    () => {
      assert.equals(
        styleUpdater.callCount, Math.floor(duration / interval),
        'calls the style updater the expected number of times'
      );
      assert.deepEquals(
        styleUpdater.lastCall.args[0], { left: '100px' },
        'provides the style updater with the correct end styles'
      );
      assert.end();
    },
  );
});

test('playAnimation with multiple stages', { timeout: 1000 }, assert => {
  const interval = 100;
  const duration = 200;
  const stages = [
    {
      componentA: {
        duration,
        start: { left: '0px' },
        end: { left: '100px' },
      },
    },
    {
      componentA: {
        duration,
        start: { left: '100px' },
        end: { left: '200px' },
      },
    },
    {
      componentA: {
        duration,
        start: { left: '200px' },
        end: { left: '300px' },
      },
    },
  ];
  const requestAnimationFrame = fn => { setTimeout(fn, interval) };
  const cancelAnimationFrame = clearTimeout;
  const controls = ControlsMachine();
  const animation = AnimationMachine(requestAnimationFrame, cancelAnimationFrame);
  const styleUpdater = sinon.spy();

  controls.registerComponent('componentA', {}, styleUpdater);

  playAnimation(
    stages,
    controls,
    animation,
    () => {
      assert.deepEquals(
        styleUpdater.lastCall.args[0], { left: '300px' },
        'provides the style updater with the correct end styles'
      );
      assert.end();
    },
  );
});
