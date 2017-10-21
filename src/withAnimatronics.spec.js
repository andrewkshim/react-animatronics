import React from 'react'
import test from 'tape'
import { mount } from 'enzyme'

import withAnimatronics from './withAnimatronics'

test('withAnimatronics creates a valid React element', assert => {
  const createAnimationSequences = () => [
    {
      base: {
        duration: 100,
        start: { left: '100px' },
        end: { left: '200px' },
      }
    }
  ];

  const Animated = withAnimatronics(createAnimationSequences)(() => <div/>);

  const element = React.createElement(Animated);
  assert.true(React.isValidElement(element));
  assert.end();
});

test('withAnimatronics.playAnimation', assert => {
  const Base = () => <div/>;
  const createAnimationSequences = () => [
    {
      base: {
        duration: 100,
        start: { left: '100px' },
        end: { left: '200px' },
      }
    }
  ];

  const Animated = withAnimatronics(createAnimationSequences)(Base);
  const wrapper = mount(<Animated/>);
  const playAnimation = wrapper.find(Base).prop('playAnimation');

  assert.true(
    typeof playAnimation === 'function',
    'supplies playAnimation() to the wrapped component'
  );

  assert.throws(
    () => playAnimation({}),
    /expects its first argument to be the string name of your animation/,
    'playAnimation() correctly throws when provided incorrect arguments',
  );

  assert.end();
});
