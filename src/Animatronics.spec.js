import React from 'react'
import test from 'tape'
import { mount } from 'enzyme'

import Animatronics from './Animatronics'
import withAnimatronics from './withAnimatronics'

test('Animatronics', assert => {
  const Base = () => <div/>;
  const createAnimationSequences = () => [];

  const Animated = withAnimatronics(createAnimationSequences)(Base);

  const wrapper = mount(
    <Animatronics createAnimationSequences={ createAnimationSequences }>
      <Base/>
    </Animatronics>
  );

  assert.equals(wrapper.find('AnimatronicsComponent').length, 1);
  assert.end();
});
