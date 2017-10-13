// @flow
import sinon from 'sinon'
import test from 'tape'

import { ControlsMachine } from './machines/controls-machine'
import { AnimationMachine } from './machines/animation-machine'
import { reverseStages, playAnimation } from './animator'

test.only('reverseStages', assert => {
  const stages = [
    {
      componentA: {
        duration: 500,
        start: { left: '0px' },
        end: { left: '100px' },
      },
    },
    {
      componentB: {
        duration: 420,
        start: { top: '0px' },
        end: { top: '200px' },
      },
    },
  ];

  const actual = reverseStages(stages);
  const expected = [
    {
      componentB: {
        duration: 420,
        start: { top: '200px' },
        end: { top: '0px' },
      },
    },
    {
      componentA: {
        duration: 500,
        start: { left: '100px' },
        end: { left: '0px' },
      },
    },
  ];

  assert.deepEquals(
    actual, expected,
    'correctly reverses every stage and the order of the stages'
  );
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
      assert.ok(
        styleUpdater.callCount >= Math.floor(duration / interval),
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

test('playAnimation with a single stage and multiple components', assert => {
  const interval = 100;
  const duration = 500;
  const stages = [
    {
      componentA: {
        duration,
        start: { left: '0px' },
        end: { left: '100px' },
      },
      componentB: {
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
  const styleUpdaterA = sinon.spy();
  const styleUpdaterB = sinon.spy();

  controls.registerComponent('componentA', {}, styleUpdaterA);
  controls.registerComponent('componentB', {}, styleUpdaterB);

  playAnimation(
    stages,
    controls,
    animation,
    () => {
      assert.deepEquals(
        styleUpdaterA.lastCall.args[0], { left: '100px' },
        'provides the style updater for the first component with the correct end styles'
      );
      assert.deepEquals(
        styleUpdaterB.lastCall.args[0], { left: '100px' },
        'provides the style updater for the second component with the correct end styles'
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

