// @flow
import sinon from 'sinon'
import test from 'tape'

import Constants from '../constants'
import { ControlsMachine } from './controls-machine'
import { reverseStages, AnimationMachine } from './animation-machine'

test('findLongestDelay', assert => {
  const stage = {
    componentA: {
      duration: 500,
      delay: 100,
      start: { left: '0px' },
      end: { left: '100px' },
    },
    componentB: {
      duration: 500,
      delay: 700,
      start: { left: '0px' },
      end: { left: '100px' },
    },
  };
  assert.equals(findLongestDelay(stage), 700, 'correctly finds the longest delay');
  assert.end();
});

test('reverseStages', assert => {
  assert.deepEquals(
    reverseStages([
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
    ]),
    [
      {
        componentB: {
          delay: 0,
          duration: 420,
          start: { top: '200px' },
          end: { top: '0px' },
        },
      },
      {
        componentA: {
          delay: 0,
          duration: 500,
          start: { left: '100px' },
          end: { left: '0px' },
        },
      },
    ],
    'correctly reverses every stage and the order of the stages'
  );

  assert.deepEquals(
    reverseStages([
      {
        componentA: {
          delay: 100,
          duration: 500,
          start: { left: '0px' },
          end: { left: '100px' },
        },
        componentB: {
          delay: 620,
          duration: 420,
          start: { top: '0px' },
          end: { top: '200px' },
        },
      },
    ]),
    [
      {
        componentA: {
          delay: 520,
          duration: 500,
          start: { left: '100px' },
          end: { left: '0px' },
        },
        componentB: {
          delay: 0,
          duration: 420,
          start: { top: '200px' },
          end: { top: '0px' },
        },
      },
    ],
    'correctly reverses every delay'
  );

  assert.end();
});

test('AnimationMachine.play with a single stage', assert => {
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
  const animation = AnimationMachine(
    () => stages,
    requestAnimationFrame,
    cancelAnimationFrame
  );
  const styleUpdater = sinon.spy();

  controls.registerComponent('componentA', {}, styleUpdater);

  animation.play(
    Constants.DEFAULT_ANIMATION_NAME,
    controls,
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

test('AnimationMachine.play with a single stage and multiple components', assert => {
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
  const animation = AnimationMachine(
    () => stages,
    requestAnimationFrame,
    cancelAnimationFrame
  );
  const styleUpdaterA = sinon.spy();
  const styleUpdaterB = sinon.spy();

  controls.registerComponent('componentA', {}, styleUpdaterA);
  controls.registerComponent('componentB', {}, styleUpdaterB);

  animation.play(
    Constants.DEFAULT_ANIMATION_NAME,
    controls,
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

test('AnimationMachine.play with multiple stages', { timeout: 1000 }, assert => {
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
  const animation = AnimationMachine(
    () => stages,
    requestAnimationFrame,
    cancelAnimationFrame
  );
  const styleUpdater = sinon.spy();

  controls.registerComponent('componentA', {}, styleUpdater);

  animation.play(
    Constants.DEFAULT_ANIMATION_NAME,
    controls,
    () => {
      assert.deepEquals(
        styleUpdater.lastCall.args[0], { left: '300px' },
        'provides the style updater with the correct end styles'
      );
      assert.end();
    },
  );
});
