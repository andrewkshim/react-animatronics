import React from 'react'
import lolex from 'lolex'
import sinon from 'sinon'
import test from 'tape'
import { mount } from 'enzyme'

import { withAnimatronics, withControl } from '../src'

test('runs each animation phase', assert => {
  class Base extends React.Component {
    render() {
      return <div/>;
    }
  }

  const Controlled = withControl('base', { useStringRefs: true })(Base);
  const App = () => <Controlled/>;

  const createAnimationSequences = () => {
    return [
      {
        base: {
          duration: 250,
          from: {
            top: '0px',
          },
          to: {
            top: '10px',
          },
        },
      },
      {
        base: {
          duration: 300,
          from: {
            top: '10px',
          },
          to: {
            top: '100px',
          },
        },
      },
    ];
  };

  const interval = 10;
  const { Date, setTimeout, clearTimeout, runAll } = lolex.createClock();
  const requestAnimationFrame = fn => { setTimeout(fn, interval) };
  const cancelAnimationFrame = clearTimeout;
  const startTime = Date.now();
  const Animated = withAnimatronics(
    createAnimationSequences,
    {
      requestAnimationFrame,
      cancelAnimationFrame,
      setTimeout,
      clearTimeout,
      now: Date.now,
    }
  )(App);
  const wrapper = mount(<Animated/>);
  const playAnimation = wrapper.find(App).prop('playAnimation');
  playAnimation(
    () => {
      const elapsedTime = Date.now() - startTime;
      assert.true(elapsedTime >= 550, 'the animation took the expected amount of time');
      assert.end();
    },
  );

  runAll();
})
