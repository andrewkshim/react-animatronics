import React from 'react'
import { mount } from 'enzyme'

import withAnimatronics from './withAnimatronics'

test('withAnimatronics', () => {
  const createAnimationSequences = () => [
    {
      base: {
        duration: 100,
        from: { left: '100px' },
        to: { left: '200px' },
      }
    }
  ];

  const Animated = withAnimatronics(createAnimationSequences)(() => <div/>);
  const element = React.createElement(Animated);

  expect(React.isValidElement(element)).toBe(true);

  expect(() => withAnimatronics()).toThrow(
    /expects its first argument to be a function/,
  );

  expect(() => withAnimatronics(() => [])(undefined)).toThrow(
    /must be used to wrap a React component/,
  );
});

test('withAnimatronics.playAnimation', () => {
  const Base = () => <div/>;
  const createAnimationSequences = () => [
    {
      base: {
        duration: 100,
        from: { left: '100px' },
        to: { left: '200px' },
      }
    }
  ];

  const Animated = withAnimatronics(createAnimationSequences)(Base);
  const wrapper = mount(<Animated/>);
  const playAnimation = wrapper.find(Base).prop('playAnimation');

  expect(typeof playAnimation === 'function').toBe(true);

  expect(() => playAnimation({})).toThrow(
    /expects its first argument to be the string name of your animation/,
  );

  const wrapperTwo = mount(<Animated/>);
  const playAnimationTwo = wrapperTwo.find(Base).prop('playAnimation');

  expect(playAnimation).not.toBe(playAnimationTwo);
});
