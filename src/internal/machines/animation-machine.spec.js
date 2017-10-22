import sinon from 'sinon'
import test from 'tape'

import Constants from '../constants'
import ComponentMachine from './components-machine'

import AnimationMachine, {
  throwIfAnimationNotValid,
  throwIfPhaseNotValid,
  findLongestDelay,
  reversePhases,
} from './animation-machine'

test('throwIfAnimationNotValid', assert => {
  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      stiffness: 200,
      damping: 20,
    }),
    /must specify either/,
    'should throw when animation is both timed and spring'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      stiffness: 20,
    }),
    /with both a 'duration' and a 'stiffness'/,
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      damping: 20,
    }),
    /with both a 'duration' and a 'damping'/,
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 'foobar',
    }),
    /'duration' must always be a number/,
    'should throw when the duration is not a number'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      stiffness: 'foobar',
      damping: 20,
    }),
    /'stiffness' must always be a number/,
    'should throw when the stiffness is not a number'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      stiffness: 200,
      damping: 'foobar',
    }),
    /'damping' must always be a number/,
    'should throw when the damping is not a number'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      stiffness: 200,
    }),
    /with a 'stiffness' but not a 'damping'/,
    'should throw when a spring animation has stiffness but not damping'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      damping: 20,
    }),
    /with a 'damping' but not a 'stiffness'/,
    'should throw when a spring animation has damping but not stiffness'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      start: {},
    }),
    /with a 'start' but not an 'end'/,
    'should throw when an animation has a start but no end'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      end: {},
    }),
    /with an 'end' but not a 'start'/,
    'should throw when an animation has an end but no start'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      start: 'foobar',
      end: {},
    }),
    /'start' must always be a plain object/,
    'should throw when start is not an object'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      start: {},
      end: 'foobar',
    }),
    /'end' must always be a plain object/,
    'should throw when end is not an object'
  );

  assert.throws(
    () => throwIfAnimationNotValid({
      duration: 100,
      delay: 'foobar',
      start: {},
      end: {},
    }),
    /'delay' must always be a number/,
    'should throw when delay is not a number'
  );

  assert.doesNotThrow(
    () => throwIfAnimationNotValid({
      duration: 100,
      start: {},
      end: {},
    }),
    'should not throw when the animation is valid'
  );

  assert.end();
});

test('throwIfPhaseNotValid', assert => {
  assert.throws(
    () => {
      throwIfPhaseNotValid(
        { bar: {
          duration: 100,
          start: { left: '100px' },
          end: { left: '200px' }
        } },
        { foo: null }
      );
    },
    /isn't aware of any component with that name/
  );
  assert.end();
});

test('findLongestDelay', assert => {
  const phase = {
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
  assert.equals(findLongestDelay(phase), 700, 'correctly finds the longest delay');
  assert.end();
});

test('reversePhases', assert => {
  assert.deepEquals(
    reversePhases([
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
    'correctly reverses every phase and the order of the phases'
  );

  assert.deepEquals(
    reversePhases([
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

test('AnimationMachine.play with a single phase', assert => {
  const interval = 100;
  const duration = 500;
  const sequence = [
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
  const components = ComponentMachine();
  const animation = AnimationMachine(
    () => sequence,
    requestAnimationFrame,
    cancelAnimationFrame
  );
  const styleUpdater = sinon.spy();

  components.registerComponent('componentA', {}, styleUpdater);

  animation.play(
    Constants.DEFAULT_ANIMATION_NAME,
    components,
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

test('AnimationMachine.play with a single phase and multiple components', assert => {
  const interval = 100;
  const duration = 500;
  const sequence = [
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
  const components = ComponentMachine();
  const animation = AnimationMachine(
    () => sequence,
    requestAnimationFrame,
    cancelAnimationFrame
  );
  const styleUpdaterA = sinon.spy();
  const styleUpdaterB = sinon.spy();

  components.registerComponent('componentA', {}, styleUpdaterA);
  components.registerComponent('componentB', {}, styleUpdaterB);

  animation.play(
    Constants.DEFAULT_ANIMATION_NAME,
    components,
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

test('AnimationMachine.play with multiple phases', { timeout: 1000 }, assert => {
  const interval = 100;
  const duration = 200;
  const sequence = [
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
  const components = ComponentMachine();
  const animation = AnimationMachine(
    () => sequence,
    requestAnimationFrame,
    cancelAnimationFrame
  );
  const styleUpdater = sinon.spy();

  components.registerComponent('componentA', {}, styleUpdater);

  animation.play(
    Constants.DEFAULT_ANIMATION_NAME,
    components,
    () => {
      assert.deepEquals(
        styleUpdater.lastCall.args[0], { left: '300px' },
        'provides the style updater with the correct end styles'
      );
      assert.end();
    },
  );
});
