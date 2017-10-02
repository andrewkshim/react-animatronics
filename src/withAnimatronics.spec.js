import React from 'react'
import test from 'tape'
import { shallow } from 'enzyme'

import withAnimatronics from './withAnimatronics'

test('withAnimatronics creates a valid React element', assert => {
  const Animated = withAnimatronics()(() => <div/>);
  const element = React.createElement(Animated);
  assert.true(React.isValidElement(element));
  assert.end();
});

test('withAnimatronics supplies runAnimation() to the wrapped component', assert => {
  const Base = () => <div/>;
  const Animated = withAnimatronics()(Base);
  const wrapper = shallow(<Animated/>);
  const runAnimation = wrapper.find(Base).prop('runAnimation');
  assert.true(typeof runAnimation === 'function');
  assert.end();
});
