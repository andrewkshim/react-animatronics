import React from 'react'
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
          start: {
            top: '0px',
          },
          end: {
            top: '10px',
          },
        },
      },
      {
        base: {
          duration: 300,
          start: {
            top: '10px',
          },
          end: {
            top: '100px',
          },
        },
      },
    ];
  };

  const startTime = Date.now();
  const Animated = withAnimatronics(createAnimationSequences)(App);
  const wrapper = mount(<Animated/>);
  const playAnimation = wrapper.find(App).prop('playAnimation');
  playAnimation(
    () => {
      const elapsedTime = Date.now() - startTime;
      assert.true(elapsedTime >= 550, 'the animation took the expected amount of time');
      assert.end();
    },
  );
})
