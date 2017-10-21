import React from 'react'
import test from 'tape'
import { mount } from 'enzyme'

import withAnimatronics from './withAnimatronics'

test('withAnimatronics creates a valid React element', assert => {
  const Animated = withAnimatronics()(() => <div/>);
  const element = React.createElement(Animated);
  assert.true(React.isValidElement(element));
  assert.end();
});

test('withAnimatronics supplies playAnimation() to the wrapped component', assert => {
  const Base = () => <div/>;
  const Animated = withAnimatronics()(Base);
  const wrapper = mount(<Animated/>);
  const playAnimation = wrapper.find(Base).prop('playAnimation');
  assert.true(typeof playAnimation === 'function');
  assert.end();
});
